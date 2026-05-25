import type { AgentDecision } from "@/lib/types";

function timeLabel(base: Date, offsetSeconds: number) {
  return new Date(base.getTime() + offsetSeconds * 1000).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

export function AiThoughtTerminal({ decision }: { decision: AgentDecision }) {
  const base = new Date(decision.generated_at);
  const selected = decision.allocations.length;
  const exits = decision.exits.length;
  const top = decision.allocations[0];
  const deployed = decision.total_allocated_bps / 100;
  const topLeader = top ? `${top.display_name} ${top.account.slice(0, 6)}...${top.account.slice(-4)}` : "none";
  const simulatedEdge = selected
    ? decision.allocations.reduce((sum, allocation) => sum + allocation.expected_edge_bps * allocation.weight_bps, 0) / Math.max(decision.total_allocated_bps, 1) / 100
    : 0;
  const rows = [
    ["collect", `Read ${decision.watchlist.length} Hyperliquid leader wallets and current Arc vault state.`],
    ["score", `Ranked candidates for ${decision.risk_profile ?? "moderate"} risk using Sharpe, Calmar, drawdown, consistency, and fill quality.`],
    ["filter", exits > 0 ? `Flagged ${exits} degraded leader${exits === 1 ? "" : "s"} for exit.` : "No degradation exits triggered."],
    ["allocate", selected > 0 ? `Selected ${selected} leaders, deployed ${deployed.toFixed(1)}%; top allocation ${topLeader}.` : "No eligible leaders selected."],
    ["impact", selected > 0 ? `Simulated edge ${simulatedEdge >= 0 ? "+" : ""}${simulatedEdge.toFixed(2)}% from current weights before live execution.` : "Impact pending until leaders are selected."],
    ["publish", decision.decision_hash === "0x" ? "Waiting for first live agent run." : `Decision hash ${decision.decision_hash.slice(0, 12)}... prepared for Arc rebalance publication.`]
  ];

  return (
    <div className="overflow-hidden rounded-md border border-white/10 bg-slate-950/70 font-mono text-xs shadow-inner">
      <div className="border-b border-white/10 px-4 py-2 text-slate-500">arcmind-agent.log</div>
      <div className="space-y-1 p-4">
        {rows.map(([phase, line], index) => (
          <div key={phase} className="grid gap-2 rounded border border-transparent px-2 py-1.5 transition hover:border-cyan-300/10 hover:bg-cyan-300/[0.035] sm:grid-cols-[82px_80px_1fr]">
            <span className="text-slate-600">{timeLabel(base, index * 8)}</span>
            <span className="text-cyan-300">[{phase}]</span>
            <span className="text-slate-300">{line}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
