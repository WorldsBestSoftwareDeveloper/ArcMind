import { BrainCircuit, RefreshCw, ShieldAlert, SlidersHorizontal } from "lucide-react";
import { AgentRunner } from "@/components/agent-runner";
import { AllocationTable } from "@/components/allocation-table";
import { RiskRadar } from "@/components/charts/risk-radar";
import { AppFrame } from "@/components/layout/app-frame";
import { PageHeader } from "@/components/page-header";
import { Shell } from "@/components/layout/shell";
import { StrategyControls } from "@/components/strategy-controls";
import { GlassCard } from "@/components/ui/glass-card";
import { getDecision } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function StrategyPage() {
  const decision = await getDecision();
  const rows = [...decision.allocations, ...decision.exits];

  return (
    <Shell>
      <AppFrame>
        <PageHeader
          kicker={<><BrainCircuit size={14} /> Allocation engine</>}
          title="Strategy Control"
          copy="Tune follower risk profile, run the agent, and inspect the exact allocation decisions before execution."
        />

        <div className="grid min-w-0 gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">
        <div className="min-w-0 space-y-5">
          <GlassCard>
            <div className="section-title mb-4">Risk model</div>
            <RiskRadar />
          </GlassCard>
          <StrategyControls />
          <AgentRunner />
        </div>

        <div className="min-w-0 space-y-5">
          <div className="grid gap-3 md:grid-cols-3">
            {[
              [SlidersHorizontal, "Deployed", `${(decision.total_allocated_bps / 100).toFixed(0)}%`],
              [ShieldAlert, "Exit triggers", `${decision.exits.length}`],
              [RefreshCw, "Cadence", "6h"]
            ].map(([Icon, title, text]) => (
              <div key={title as string} className="terminal-panel rounded-md p-4 transition hover:border-cyan-300/25">
                <div className="flex items-center justify-between">
                  <div className="text-xs uppercase tracking-[0.12em] text-slate-500">{title as string}</div>
                  <Icon className="text-arc-cyan" size={16} />
                </div>
                <div className="mt-3 font-mono text-2xl text-white">{text as string}</div>
              </div>
            ))}
          </div>

          <GlassCard>
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <div className="section-title">Latest decision</div>
                <div className="mt-1 font-mono text-xs text-slate-500">{decision.decision_hash.slice(0, 18)}...{decision.decision_hash.slice(-8)}</div>
              </div>
              <span className="rounded-md border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-xs text-cyan-100">
                {(decision.confidence * 100).toFixed(0)}% confidence
              </span>
            </div>
            <div className="mb-4 rounded-md border border-white/10 bg-white/[0.035] p-4 text-sm leading-6 text-slate-300">
              {decision.rationale}
            </div>
            <AllocationTable rows={rows} />
          </GlassCard>
        </div>
        </div>
      </AppFrame>
    </Shell>
  );
}
