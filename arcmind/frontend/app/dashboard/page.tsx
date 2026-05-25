import { Bell, ChevronRight, Eye, Wallet } from "lucide-react";
import { ActivityFeed } from "@/components/activity-feed";
import { AgentRunner } from "@/components/agent-runner";
import { AllocationTable } from "@/components/allocation-table";
import { AllocationDonut } from "@/components/charts/allocation-donut";
import { PerformanceChart } from "@/components/charts/performance-chart";
import { LiveVaultValue } from "@/components/live-vault-value";
import { TimeframeSelector } from "@/components/timeframe-selector";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { Shell } from "@/components/layout/shell";
import { GlassCard } from "@/components/ui/glass-card";
import { VaultActions } from "@/components/vault-actions";
import { getDashboard } from "@/lib/api";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const snapshot = await getDashboard();

  return (
    <Shell>
      <GlassCard className="overflow-hidden p-0">
        <div className="grid min-h-[720px] min-w-0 lg:grid-cols-[220px_minmax(0,1fr)]">
          <DashboardSidebar />
          <section className="min-w-0 p-5 sm:p-7">
            <div className="mb-5 flex items-center justify-between gap-4 border-b border-white/10 pb-5">
              <div>
                <div className="page-kicker">Portfolio command</div>
                <div className="mt-2 flex flex-wrap items-end gap-x-4 gap-y-1">
                  <LiveVaultValue fallback={snapshot.tvl} />
                  <div className="pb-1 text-sm text-emerald-300">ArcMindVault live</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button className="flex h-10 w-10 items-center justify-center rounded-md border border-white/10 bg-white/5 text-slate-300" title="Notifications">
                  <Bell size={16} />
                </button>
                <div className="hidden rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 sm:block">
                  {snapshot.app_metrics?.latest_decision_hash ? "Decision anchored" : "Awaiting activity"}
                </div>
              </div>
            </div>

            <div className="mb-5 grid min-w-0 gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <VaultActions />
              <AgentRunner />
            </div>

            <div className="mb-4 flex items-center justify-between">
              <div className="section-title">Performance</div>
              <TimeframeSelector />
            </div>

            <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(280px,.9fr)]">
              <GlassCard className="min-w-0 overflow-hidden">
                <div className="mb-4 section-title">AI performance vs market</div>
                <PerformanceChart />
              </GlassCard>
              <GlassCard className="min-w-0 overflow-hidden">
                <div className="mb-6 section-title">Allocation</div>
                <AllocationDonut />
              </GlassCard>
            </div>

            <div className="mt-5 grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(280px,.9fr)]">
              <GlassCard className="min-w-0 overflow-hidden">
                <div className="mb-4 flex items-center justify-between">
                  <div className="section-title">Selected leaders</div>
                  <Link href="/leaders" className="flex items-center gap-1 rounded-md bg-white/5 px-3 py-1.5 text-xs text-slate-300">
                    <Eye size={13} /> View all
                  </Link>
                </div>
                <div className="grid gap-3">
                  {snapshot.latest_decision.allocations.slice(0, 3).map((allocation, index) => (
                    <div key={allocation.trader_id} className="grid min-w-0 grid-cols-[32px_minmax(0,1fr)_auto_20px] items-center gap-3 rounded-md border border-white/10 bg-white/[0.035] p-3 transition hover:bg-cyan-300/[0.035]">
                      <div className="font-mono text-sm text-slate-400">0{index + 1}</div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-white">{allocation.account}</div>
                        <div className="truncate text-xs text-slate-500">{allocation.display_name}</div>
                      </div>
                      <div className="whitespace-nowrap text-sm text-emerald-300">P-Score {100 - allocation.risk_score}</div>
                      <ChevronRight size={16} className="text-slate-500" />
                    </div>
                  ))}
                </div>
              </GlassCard>
              <GlassCard className="min-w-0 overflow-hidden">
                <div className="mb-4 section-title">Recent activity</div>
                <ActivityFeed />
              </GlassCard>
            </div>

            <GlassCard className="mt-5 min-w-0 overflow-hidden">
              <div className="mb-5 flex items-center gap-2 text-white">
                <Wallet size={16} className="text-arc-cyan" /> <span className="section-title">Current allocations</span>
              </div>
              <AllocationTable rows={snapshot.latest_decision.allocations} />
            </GlassCard>
          </section>
        </div>
      </GlassCard>

    </Shell>
  );
}
