import asyncio

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.agent.graph import run_agent
from app.agent.hyperliquid import fetch_leaderboard, fetch_leaderboard_feed
from app.agent.scoring import build_decision, score_trader
from app.config import get_settings
from app.models import AgentRunRequest, DashboardSnapshot, FollowerProfile
from app.services.arc_chain import ArcChainService
from app.services.hyperliquid_execution import HyperliquidExecutionAdapter
from app.services.storage import storage

settings = get_settings()
app = FastAPI(title="ArcMind API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


async def scheduled_agent_loop() -> None:
    while True:
        try:
            if not storage.is_agent_paused():
                decision = await run_agent("moderate", None)
                storage.store_leaders(decision.watchlist, {leader.trader_id: score_trader(leader) for leader in decision.watchlist})
                storage.store_decision(decision)
                await HyperliquidExecutionAdapter().execute(decision)
        except Exception:
            pass
        await asyncio.sleep(settings.agent_scheduler_interval_seconds)


@app.on_event("startup")
async def startup() -> None:
    if settings.agent_scheduler_enabled:
        asyncio.create_task(scheduled_agent_loop())


@app.get("/health")
async def health() -> dict:
    return {
        "ok": True,
        "network": "Arc Testnet",
        "agent": "ArcMind Social Trading Intelligence",
        "hyperliquid_data_network": settings.hyperliquid_data_network,
        "hyperliquid_execution_network": settings.hyperliquid_execution_network,
        "hyperliquid_dry_run": settings.hyperliquid_dry_run,
        "leader_wallets_configured": len(settings.leader_address_list),
    }


@app.get("/api/leaders")
async def leaders():
    feed = await fetch_leaderboard_feed()
    leader_rows = feed.rows
    storage.store_leaders(leader_rows, {leader.trader_id: score_trader(leader) for leader in leader_rows})
    return feed


@app.post("/api/agent/run")
async def agent_run(request: AgentRunRequest):
    if request.wallet:
        storage.upsert_follower(request.wallet, request.risk_profile)
    cached_leaders = storage.latest_leaders()
    if len(cached_leaders) >= 3:
        decision = build_decision(cached_leaders, request.risk_profile, request.wallet)
        decision.rationale = (
            "ArcMind used the most recent live Hyperliquid leader snapshot for a responsive rebalance. "
            "Open Leaders to refresh the source wallet data before the next decision."
        )
    else:
        try:
            decision = await asyncio.wait_for(run_agent(request.risk_profile, request.wallet), timeout=12)
        except asyncio.TimeoutError:
            decision = build_decision(cached_leaders, request.risk_profile, request.wallet)
            decision.rationale = (
                "Live Hyperliquid fetch timed out, so ArcMind used the most recent stored leader snapshot "
                "to keep the rebalance loop responsive for the demo."
            )
    storage.store_leaders(decision.watchlist, {leader.trader_id: score_trader(leader) for leader in decision.watchlist})
    storage.store_decision(decision)
    execution = await HyperliquidExecutionAdapter().execute(decision)
    publish = ArcChainService().publish_rebalance(decision) if request.publish_onchain else {"submitted": False, "message": "On-chain publishing not requested."}
    return {"decision": decision, "execution": execution, "publish": publish}


@app.get("/api/agent/status")
async def agent_status():
    return {
        "paused": storage.is_agent_paused(),
        "scheduler_enabled": settings.agent_scheduler_enabled,
        "scheduler_interval_seconds": settings.agent_scheduler_interval_seconds,
    }


@app.post("/api/agent/pause")
async def agent_pause(payload: dict):
    paused = bool(payload.get("paused", True))
    storage.set_agent_paused(paused)
    return {"paused": paused}


@app.get("/api/agent/latest")
async def latest_agent_decision(wallet: str | None = None, risk_profile: str = "moderate"):
    stored = storage.latest_decision(wallet, risk_profile)
    if stored:
        return stored
    try:
        traders = await asyncio.wait_for(fetch_leaderboard(), timeout=20)
    except asyncio.TimeoutError:
        traders = storage.latest_leaders()
    decision = build_decision(traders, risk_profile, wallet)
    storage.store_leaders(traders, {leader.trader_id: score_trader(leader) for leader in traders})
    storage.store_decision(decision)
    return decision


@app.post("/api/followers", response_model=FollowerProfile)
async def upsert_follower(request: AgentRunRequest):
    wallet = request.wallet or "anonymous"
    return storage.upsert_follower(wallet, request.risk_profile)


@app.get("/api/metrics")
async def metrics():
    chain = ArcChainService().vault_summary()
    return storage.metrics(chain["tvl_usdc"], chain["latest_decision_hash"])


@app.get("/api/activity")
async def activity():
    chain_activity = ArcChainService().vault_activity()
    decision_activity = storage.recent_decision_activity()
    rows = [*chain_activity, *decision_activity]
    return {"rows": rows[:8]}


@app.get("/api/dashboard", response_model=DashboardSnapshot)
async def dashboard():
    decision = storage.latest_decision(None, None)
    if not decision:
        decision = await latest_agent_decision()
    chain = ArcChainService().vault_summary()
    app_metrics = storage.metrics(chain["tvl_usdc"], chain["latest_decision_hash"])
    allocated = max(decision.total_allocated_bps, 1)
    weighted_edge_bps = sum(allocation.expected_edge_bps * allocation.weight_bps for allocation in decision.allocations) / allocated
    blind_edge_bps = 0
    if decision.watchlist:
        blind_edge_bps = sum(int(leader.roi_30d * 10_000 / 2) for leader in decision.watchlist[: max(len(decision.allocations), 1)]) / max(
            min(len(decision.watchlist), max(len(decision.allocations), 1)),
            1,
        )
    max_drawdown = max([allocation.risk_score for allocation in decision.allocations] or [0]) / 5
    return DashboardSnapshot(
        tvl=chain["tvl_usdc"],
        active_followers=app_metrics.active_followers,
        ai_return=round(weighted_edge_bps / 100, 2),
        blind_copy_return=round(blind_edge_bps / 100, 2),
        max_drawdown=round(max_drawdown, 2),
        confidence=decision.confidence,
        latest_decision=decision,
        app_metrics=app_metrics,
    )
