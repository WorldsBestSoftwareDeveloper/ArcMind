import hashlib
import json
from datetime import datetime, timezone

from app.models import AgentDecision, AllocationDecision, TraderMetrics

RISK_CONFIG = {
    "conservative": {"deploy_bps": 6_000, "max_leader_bps": 2_500, "max_drawdown": 0.11, "max_degradation": 0.28},
    "moderate": {"deploy_bps": 8_500, "max_leader_bps": 3_500, "max_drawdown": 0.16, "max_degradation": 0.42},
    "aggressive": {"deploy_bps": 9_500, "max_leader_bps": 5_000, "max_drawdown": 0.24, "max_degradation": 0.58},
}


def score_trader(trader: TraderMetrics) -> float:
    edge = trader.sharpe * 0.34 + trader.calmar * 0.28 + trader.consistency * 1.8
    safety = (1 - trader.max_drawdown) * 1.4 + trader.win_rate * 0.8
    liquidity = min(1.0, trader.volume_30d / 60_000_000) * 0.55
    penalty = trader.degradation * 2.2 + trader.volatility * 0.9
    return max(0.0, edge + safety + liquidity - penalty)


def build_decision(traders: list[TraderMetrics], risk_profile: str = "moderate", wallet: str | None = None) -> AgentDecision:
    config = RISK_CONFIG.get(risk_profile, RISK_CONFIG["moderate"])
    ranked = sorted(traders, key=score_trader, reverse=True)
    target_count = 3 if risk_profile == "conservative" else 5
    selected = [
        trader for trader in ranked if trader.degradation < config["max_degradation"] and trader.max_drawdown < config["max_drawdown"]
    ][:target_count]
    selected_ids = {trader.trader_id for trader in selected}
    fill_candidates = [
        trader
        for trader in ranked
        if trader.trader_id not in selected_ids and trader.degradation < 0.75 and trader.max_drawdown < 0.35 and score_trader(trader) > 0
    ]
    selected.extend(fill_candidates[: max(0, target_count - len(selected))])
    if not selected:
        selected = ranked[: min(3, len(ranked))]

    raw_scores = [score_trader(trader) for trader in selected]
    total_score = sum(raw_scores) or 1
    max_alloc = config["max_leader_bps"]
    allocations: list[AllocationDecision] = []
    used_bps = 0

    for trader, raw_score in zip(selected, raw_scores):
        weight = min(max_alloc, int((raw_score / total_score) * config["deploy_bps"]))
        used_bps += weight
        risk_score = int(min(100, max(0, trader.degradation * 100 + trader.max_drawdown * 120 + trader.volatility * 45)))
        action = "increase" if trader.consistency > 0.82 and trader.degradation < 0.25 else "maintain"
        thesis = (
            f"Sharpe {trader.sharpe:.2f}, Calmar {trader.calmar:.2f}, "
            f"{trader.win_rate:.0%} win rate, degradation {trader.degradation:.0%}."
        )
        allocations.append(
            AllocationDecision(
                trader_id=trader.trader_id,
                display_name=trader.display_name,
                account=trader.account,
                weight_bps=weight,
                expected_edge_bps=int(trader.roi_30d * 10_000 / 2),
                risk_score=risk_score,
                action=action,
                thesis=thesis,
            )
        )

    exits = [
        AllocationDecision(
            trader_id=trader.trader_id,
            display_name=trader.display_name,
            account=trader.account,
            weight_bps=0,
            expected_edge_bps=int(trader.roi_30d * 10_000 / 3),
            risk_score=int(min(100, trader.degradation * 100 + trader.max_drawdown * 110)),
            action="exit",
            thesis=f"Degradation trigger: drawdown {trader.max_drawdown:.0%}, volatility {trader.volatility:.0%}.",
        )
        for trader in ranked
        if trader.degradation >= config["max_degradation"] or trader.max_drawdown >= config["max_drawdown"]
    ][:3]

    regime = "risk-on" if sum(t.roi_30d for t in ranked[:5]) / max(len(ranked[:5]), 1) > 0.14 else "selective"
    confidence = min(0.94, max(0.55, 0.62 + (sum(a.expected_edge_bps for a in allocations) / 10000) - (len(exits) * 0.025)))
    body = {
        "at": datetime.now(timezone.utc).isoformat(),
        "allocations": [allocation.model_dump() for allocation in allocations],
        "exits": [exit_decision.model_dump() for exit_decision in exits],
        "risk_profile": risk_profile,
        "wallet": wallet,
    }
    decision_hash = "0x" + hashlib.sha256(json.dumps(body, sort_keys=True).encode()).hexdigest()
    rationale = (
        "ArcMind selected leaders with durable risk-adjusted edge, capped single-trader exposure, "
        "and excluded accounts showing drawdown or volatility degradation."
    )
    return AgentDecision(
        generated_at=datetime.now(timezone.utc),
        regime=regime,
        confidence=round(confidence, 3),
        total_allocated_bps=used_bps,
        rebalance_required=True,
        decision_hash=decision_hash,
        rationale=rationale,
        allocations=allocations,
        exits=exits,
        watchlist=ranked[:8],
        risk_profile=risk_profile,
        follower_wallet=wallet,
    )
