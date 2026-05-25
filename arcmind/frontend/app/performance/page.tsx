import { BarChart3, BrainCircuit, GitCompare, ShieldCheck, TrendingUp } from "lucide-react";
import { AiThoughtTerminal } from "@/components/ai-thought-terminal";
import { AiVsBlindComparison } from "@/components/ai-vs-blind-comparison";
import { PerformanceChart } from "@/components/charts/performance-chart";
import { AppFrame } from "@/components/layout/app-frame";
import { PageHeader } from "@/components/page-header";
import { Shell } from "@/components/layout/shell";
import { MetricCard } from "@/components/metric-card";
import { GlassCard } from "@/components/ui/glass-card";
import { getDashboard } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function PerformancePage() {
  const snapshot = await getDashboard();
  const spread = snapshot.ai_return - snapshot.blind_copy_return;
  return (
    <Shell>
      <AppFrame>
        <PageHeader
          kicker={<><BarChart3 size={14} /> Performance</>}
          title="Portfolio Analytics"
          copy="Shows live Arc vault state plus decision-implied AI vs blind-copy edge until execution history is deep enough for realized PnL."
        />
        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard label="ArcMind" value={`+${snapshot.ai_return}%`} sub="Latest allocation edge" />
          <MetricCard label="Blind copy" value={`+${snapshot.blind_copy_return}%`} sub="Equal-weight leader baseline" />
          <MetricCard label="Alpha spread" value={`${spread >= 0 ? "+" : ""}${spread.toFixed(1)}%`} sub="Decision-implied spread" />
        </div>
        <GlassCard className="mt-6">
          <div className="mb-5 flex items-center gap-2 text-white">
            <TrendingUp size={18} className="text-arc-cyan" /> Return curve
          </div>
          {snapshot.latest_decision.decision_hash === "0x" ? (
            <div className="rounded-md border border-white/10 bg-white/[0.035] p-8 text-center text-sm text-slate-400">
              No live performance history yet. Deposit, run the agent, and publish decisions to build this chart.
            </div>
          ) : (
            <PerformanceChart />
          )}
        </GlassCard>
        <div className="mt-6 grid gap-5 lg:grid-cols-[.9fr_1.1fr]">
          <GlassCard>
            <div className="mb-4 flex items-center gap-2 text-white">
              <BrainCircuit size={16} className="text-arc-cyan" />
              AI Thought Process
            </div>
            <AiThoughtTerminal decision={snapshot.latest_decision} />
          </GlassCard>
          <GlassCard>
            <div className="mb-4 flex items-center gap-2 text-white">
              <GitCompare size={16} className="text-arc-cyan" />
              AI Copy vs Blind Copy
            </div>
            <AiVsBlindComparison aiReturn={snapshot.ai_return} blindReturn={snapshot.blind_copy_return} />
          </GlassCard>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            ["Drawdown control", "Calculated from live allocation history."],
            ["Diversification", "Calculated from stored leader exposures."],
            ["USDC flow", "Backed by ArcMindVault deposits on Arc."]
          ].map(([title, copy]) => (
            <GlassCard key={title}>
              <ShieldCheck size={18} className="text-arc-cyan" />
              <div className="mt-3 font-semibold text-white">{title}</div>
              <p className="mt-2 text-sm leading-6 text-slate-400">{copy}</p>
            </GlassCard>
          ))}
        </div>
      </AppFrame>
    </Shell>
  );
}
