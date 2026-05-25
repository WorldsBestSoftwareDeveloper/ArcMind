from datetime import datetime
from pydantic import BaseModel, Field


class TraderMetrics(BaseModel):
    trader_id: str
    display_name: str
    account: str
    pnl_30d: float
    roi_30d: float
    max_drawdown: float
    win_rate: float
    volume_30d: float
    volatility: float
    consistency: float
    sharpe: float
    calmar: float
    degradation: float


class LeaderboardResponse(BaseModel):
    ok: bool
    source: str
    network: str
    message: str
    rows: list[TraderMetrics]


class FollowerProfile(BaseModel):
    wallet: str
    risk_profile: str = Field(pattern="^(conservative|moderate|aggressive)$")
    target_deploy_bps: int = Field(ge=0, le=10_000)
    max_leader_bps: int = Field(ge=0, le=10_000)
    active: bool = True
    created_at: datetime
    updated_at: datetime


class AllocationDecision(BaseModel):
    trader_id: str
    display_name: str
    account: str
    weight_bps: int
    expected_edge_bps: int
    risk_score: int = Field(ge=0, le=100)
    action: str
    thesis: str


class AgentDecision(BaseModel):
    generated_at: datetime
    regime: str
    confidence: float = Field(ge=0, le=1)
    total_allocated_bps: int
    rebalance_required: bool
    decision_hash: str
    rationale: str
    allocations: list[AllocationDecision]
    exits: list[AllocationDecision]
    watchlist: list[TraderMetrics]
    risk_profile: str = "moderate"
    follower_wallet: str | None = None


class AgentRunRequest(BaseModel):
    wallet: str | None = None
    risk_profile: str = Field(default="moderate", pattern="^(conservative|moderate|aggressive)$")
    publish_onchain: bool = False


class AppMetrics(BaseModel):
    total_tvl: float
    active_followers: int
    tracked_leaders: int
    latest_decision_hash: str | None = None


class DashboardSnapshot(BaseModel):
    tvl: float
    active_followers: int
    ai_return: float
    blind_copy_return: float
    max_drawdown: float
    confidence: float
    latest_decision: AgentDecision
    app_metrics: AppMetrics | None = None
