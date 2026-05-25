from app.models import AgentDecision


def approve_execution(decision: AgentDecision) -> tuple[bool, list[str]]:
    reasons: list[str] = []
    if not decision.allocations:
        reasons.append("No allocations selected.")
    if decision.total_allocated_bps > 9_500:
        reasons.append("Total deployment exceeds 95%.")
    for allocation in decision.allocations:
        if allocation.risk_score > 75:
            reasons.append(f"{allocation.display_name} risk score exceeds limit.")
        if allocation.weight_bps > 5_000:
            reasons.append(f"{allocation.display_name} exceeds max single-leader exposure.")
    return (len(reasons) == 0, reasons)
