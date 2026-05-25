from typing import TypedDict

from langgraph.graph import END, StateGraph

from app.agent.hyperliquid import fetch_leaderboard
from app.agent.scoring import build_decision
from app.models import AgentDecision, TraderMetrics


class AgentState(TypedDict, total=False):
    traders: list[TraderMetrics]
    decision: AgentDecision
    risk_profile: str
    wallet: str | None


async def collect_market_intelligence(state: AgentState) -> AgentState:
    state["traders"] = await fetch_leaderboard()
    return state


async def decide_allocations(state: AgentState) -> AgentState:
    state["decision"] = build_decision(state["traders"], state.get("risk_profile", "moderate"), state.get("wallet"))
    return state


def build_agent_graph():
    graph = StateGraph(AgentState)
    graph.add_node("collect_market_intelligence", collect_market_intelligence)
    graph.add_node("decide_allocations", decide_allocations)
    graph.set_entry_point("collect_market_intelligence")
    graph.add_edge("collect_market_intelligence", "decide_allocations")
    graph.add_edge("decide_allocations", END)
    return graph.compile()


async def run_agent(risk_profile: str = "moderate", wallet: str | None = None) -> AgentDecision:
    graph = build_agent_graph()
    result = await graph.ainvoke({"risk_profile": risk_profile, "wallet": wallet})
    return result["decision"]
