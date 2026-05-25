import type { AgentDecision, AgentRunResponse, DashboardSnapshot, LeaderboardResponse } from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const emptyDecision: AgentDecision = {
  generated_at: new Date(0).toISOString(),
  regime: "unavailable",
  confidence: 0,
  total_allocated_bps: 0,
  rebalance_required: false,
  decision_hash: "0x",
  rationale: "No live agent decision is available yet. Start the backend and run the allocation agent.",
  allocations: [],
  exits: [],
  watchlist: [],
  risk_profile: "moderate",
  follower_wallet: undefined
};

const emptyDashboard: DashboardSnapshot = {
  tvl: 0,
  active_followers: 0,
  ai_return: 0,
  blind_copy_return: 0,
  max_drawdown: 0,
  confidence: 0,
  latest_decision: emptyDecision,
  app_metrics: {
    total_tvl: 0,
    active_followers: 0,
    tracked_leaders: 0,
    latest_decision_hash: null
  }
};

async function request<T>(path: string, fallback: T): Promise<T> {
  try {
    const response = await fetch(`${API_URL}${path}`, { cache: "no-store" });
    if (!response.ok) return fallback;
    return (await response.json()) as T;
  } catch {
    return fallback;
  }
}

export function getDashboard(): Promise<DashboardSnapshot> {
  return request<DashboardSnapshot>("/api/dashboard", emptyDashboard);
}

export function getLeaders(): Promise<LeaderboardResponse> {
  return request<LeaderboardResponse | unknown>("/api/leaders", {
    ok: false,
    source: "hyperliquid",
    network: "testnet",
    message: "Backend is unavailable. Start the FastAPI server to fetch live Hyperliquid data.",
    rows: []
  }).then((value) => {
    if (Array.isArray(value)) {
      return {
        ok: true,
        source: "hyperliquid",
        network: "testnet",
        message: "Fetched live leader rows from the backend.",
        rows: value
      } as LeaderboardResponse;
    }
    const feed = value as Partial<LeaderboardResponse>;
    return {
      ok: Boolean(feed.ok),
      source: feed.source ?? "hyperliquid",
      network: feed.network ?? "testnet",
      message: feed.message ?? "No live leader feed is available.",
      rows: Array.isArray(feed.rows) ? feed.rows : []
    };
  });
}

export function getDecision(): Promise<AgentDecision> {
  return request<AgentDecision>("/api/agent/latest", emptyDecision);
}

export async function runAgent(input: { wallet?: string; risk_profile: "conservative" | "moderate" | "aggressive"; publish_onchain?: boolean }): Promise<AgentRunResponse> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 45000);
  const response = await fetch(`${API_URL}/api/agent/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    signal: controller.signal
  }).finally(() => window.clearTimeout(timeout));
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Agent run failed");
  }
  return (await response.json()) as AgentRunResponse;
}

export async function getActivity(): Promise<{ rows: Array<Record<string, string | number | null>> }> {
  return request<{ rows: Array<Record<string, string | number | null>> }>("/api/activity", { rows: [] });
}

export async function getAgentStatus(): Promise<{ paused: boolean; scheduler_enabled: boolean; scheduler_interval_seconds: number }> {
  return request<{ paused: boolean; scheduler_enabled: boolean; scheduler_interval_seconds: number }>("/api/agent/status", {
    paused: false,
    scheduler_enabled: false,
    scheduler_interval_seconds: 21600
  });
}

export async function setAgentPaused(paused: boolean): Promise<{ paused: boolean }> {
  const response = await fetch(`${API_URL}/api/agent/pause`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ paused })
  });
  if (!response.ok) throw new Error("Unable to update agent pause state");
  return (await response.json()) as { paused: boolean };
}
