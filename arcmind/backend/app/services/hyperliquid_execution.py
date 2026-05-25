from dataclasses import dataclass

from app.config import get_settings
from app.models import AgentDecision
from app.services.risk_engine import approve_execution


@dataclass
class ExecutionResult:
    mode: str
    submitted: bool
    orders: list[dict]
    message: str


class HyperliquidExecutionAdapter:
    """Translates ArcMind allocation decisions into Hyperliquid execution intents.

    Live trading should use Hyperliquid's official Python SDK or signed exchange
    endpoint. Dry-run is the default so development cannot accidentally trade.
    """

    def __init__(self) -> None:
        self.settings = get_settings()

    async def execute(self, decision: AgentDecision) -> ExecutionResult:
        approved, reasons = approve_execution(decision)
        orders = [
            {
                "trader_id": allocation.trader_id,
                "target_weight_bps": allocation.weight_bps,
                "action": allocation.action,
                "risk_score": allocation.risk_score,
            }
            for allocation in decision.allocations
        ]
        orders.extend(
            {
                "trader_id": exit_decision.trader_id,
                "target_weight_bps": 0,
                "action": "exit",
                "risk_score": exit_decision.risk_score,
            }
            for exit_decision in decision.exits
        )

        if not approved:
            return ExecutionResult(
                mode="blocked",
                submitted=False,
                orders=orders,
                message=f"Risk engine blocked execution: {'; '.join(reasons)}",
            )

        if self.settings.hyperliquid_dry_run:
            return ExecutionResult(
                mode=f"dry_run:{self.settings.hyperliquid_execution_network}",
                submitted=False,
                orders=orders,
                message="Execution intents generated. Set HYPERLIQUID_DRY_RUN=false only after signer and risk limits are configured.",
            )

        return ExecutionResult(
            mode="live",
            submitted=False,
            orders=orders,
            message="Live Hyperliquid execution adapter is intentionally gated until API wallet signing is configured.",
        )
