export type TraderMetrics = {
  trader_id: string;
  display_name: string;
  account: string;
  pnl_30d: number;
  roi_30d: number;
  max_drawdown: number;
  win_rate: number;
  volume_30d: number;
  volatility: number;
  consistency: number;
  sharpe: number;
  calmar: number;
  degradation: number;
};

export type LeaderboardResponse = {
  ok: boolean;
  source: string;
  network: string;
  message: string;
  rows: TraderMetrics[];
};

export type AllocationDecision = {
  trader_id: string;
  display_name: string;
  account: string;
  weight_bps: number;
  expected_edge_bps: number;
  risk_score: number;
  action: "increase" | "maintain" | "reduce" | "exit";
  thesis: string;
};

export type AgentDecision = {
  generated_at: string;
  regime: string;
  confidence: number;
  total_allocated_bps: number;
  rebalance_required: boolean;
  decision_hash: string;
  rationale: string;
  allocations: AllocationDecision[];
  exits: AllocationDecision[];
  watchlist: TraderMetrics[];
  risk_profile?: string;
  follower_wallet?: string | null;
};

export type DashboardSnapshot = {
  tvl: number;
  active_followers: number;
  ai_return: number;
  blind_copy_return: number;
  max_drawdown: number;
  confidence: number;
  latest_decision: AgentDecision;
  app_metrics?: {
    total_tvl: number;
    active_followers: number;
    tracked_leaders: number;
    latest_decision_hash?: string | null;
  } | null;
};

export type AgentRunResponse = {
  decision: AgentDecision;
  execution: {
    mode: string;
    submitted: boolean;
    orders: Array<Record<string, string | number | boolean>>;
    message: string;
  };
  publish?: {
    submitted: boolean;
    tx_hash?: string;
    message: string;
  };
};
