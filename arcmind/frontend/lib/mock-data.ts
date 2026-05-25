import type { DashboardSnapshot, TraderMetrics } from "@/lib/types";

export const performanceSeries = [
  { day: "D1", ai: 100, blind: 100 },
  { day: "D5", ai: 104, blind: 102 },
  { day: "D10", ai: 108, blind: 105 },
  { day: "D15", ai: 112, blind: 106 },
  { day: "D20", ai: 116, blind: 108 },
  { day: "D25", ai: 115, blind: 106 },
  { day: "D30", ai: 119, blind: 109 }
];

export const riskSeries = [
  { name: "Sharpe", value: 82 },
  { name: "Calmar", value: 74 },
  { name: "Consistency", value: 88 },
  { name: "Drawdown", value: 31 },
  { name: "Degradation", value: 18 }
];

export const fallbackTraders: TraderMetrics[] = [
  { trader_id: "hl-6dfa91", display_name: "Delta Clerk", account: "0x6df...a91", pnl_30d: 182430, roi_30d: 0.284, max_drawdown: 0.073, win_rate: 0.64, volume_30d: 88200000, volatility: 0.19, consistency: 0.91, sharpe: 1.49, calmar: 3.89, degradation: 0.13 },
  { trader_id: "hl-92bf13", display_name: "Basis Cartographer", account: "0x92b...f13", pnl_30d: 129880, roi_30d: 0.231, max_drawdown: 0.052, win_rate: 0.59, volume_30d: 61500000, volatility: 0.15, consistency: 0.87, sharpe: 1.54, calmar: 4.44, degradation: 0.09 },
  { trader_id: "hl-a77c44", display_name: "Funding Harvester", account: "0xa77...c44", pnl_30d: 71120, roi_30d: 0.121, max_drawdown: 0.038, win_rate: 0.62, volume_30d: 44100000, volatility: 0.12, consistency: 0.83, sharpe: 1.01, calmar: 3.18, degradation: 0.07 },
  { trader_id: "hl-04188e", display_name: "Momentum Nine", account: "0x041...88e", pnl_30d: 212500, roi_30d: 0.412, max_drawdown: 0.241, win_rate: 0.51, volume_30d: 172000000, volatility: 0.34, consistency: 0.48, sharpe: 1.21, calmar: 1.71, degradation: 0.55 }
];

export const fallbackDashboard: DashboardSnapshot = {
  tvl: 842500,
  active_followers: 1284,
  ai_return: 18.7,
  blind_copy_return: 9.4,
  max_drawdown: 6.8,
  confidence: 0.86,
  latest_decision: {
    generated_at: new Date().toISOString(),
    regime: "risk-on",
    confidence: 0.86,
    total_allocated_bps: 8500,
    rebalance_required: true,
    decision_hash: "0x9c0ecf6f7e4farcminedecision",
    rationale: "ArcMind selected leaders with durable risk-adjusted edge, capped single-trader exposure, and excluded accounts showing drawdown or volatility degradation.",
    allocations: [
      { trader_id: "hl-92bf13", display_name: "Basis Cartographer", account: "0x92b...f13", weight_bps: 3100, expected_edge_bps: 1155, risk_score: 12, action: "increase", thesis: "Highest Calmar score with steady funding capture and controlled volatility." },
      { trader_id: "hl-6dfa91", display_name: "Delta Clerk", account: "0x6df...a91", weight_bps: 2900, expected_edge_bps: 1420, risk_score: 18, action: "maintain", thesis: "Strong Sharpe and consistency, capped below max due to rising velocity." },
      { trader_id: "hl-a77c44", display_name: "Funding Harvester", account: "0xa77...c44", weight_bps: 2500, expected_edge_bps: 605, risk_score: 9, action: "increase", thesis: "Low drawdown diversifier improves portfolio stability." }
    ],
    exits: [
      { trader_id: "hl-04188e", display_name: "Momentum Nine", account: "0x041...88e", weight_bps: 0, expected_edge_bps: 700, risk_score: 71, action: "exit", thesis: "Degradation trigger from drawdown expansion and lower win-rate persistence." }
    ],
    watchlist: fallbackTraders
  }
};
