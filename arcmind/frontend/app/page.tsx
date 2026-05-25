import Link from "next/link";
import { ArrowRight, BrainCircuit, LineChart, ShieldCheck } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { Shell } from "@/components/layout/shell";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";

export default function LandingPage() {
  return (
    <Shell>
      <section className="grid min-h-[calc(100vh-120px)] items-center gap-10 py-6 lg:grid-cols-[.9fr_1.1fr]">
        <div className="max-w-2xl">
          <div className="mb-8 flex items-center gap-3">
            <BrandMark />
            <div>
              <div className="text-xl font-semibold text-white">ArcMind</div>
              <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Autonomous social alpha</div>
            </div>
          </div>

          <div className="mb-5 inline-flex items-center gap-2 rounded-md border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-xs text-cyan-100">
            <span className="ai-pulse h-2 w-2 rounded-full bg-arc-cyan" />
            Arc vaults, Hyperliquid intelligence, USDC-native execution flow
          </div>

          <h1 className="max-w-xl text-4xl font-semibold leading-[1.05] text-white sm:text-5xl">
            Copy trading with a risk desk built in.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-slate-400">
            ArcMind ranks leaders, sizes exposure, watches for degradation, and stages portfolio changes before blind copying turns into unmanaged risk.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/dashboard">
              <Button className="w-full sm:w-auto">
                Open app <ArrowRight size={16} />
              </Button>
            </Link>
            <Link href="/leaders">
              <Button variant="secondary" className="w-full sm:w-auto">
                Review leaders
              </Button>
            </Link>
          </div>

          <div className="mt-10 grid gap-3 text-sm sm:grid-cols-3">
            {[
              [BrainCircuit, "Risk profiles", "Conservative to aggressive allocation logic."],
              [LineChart, "Leader ranking", "Sharpe, Calmar, drawdown, consistency."],
              [ShieldCheck, "Vault controls", "USDC deposits anchored on Arc Testnet."]
            ].map(([Icon, title, copy]) => (
              <div key={title as string} className="rounded-md border border-white/10 bg-white/[0.035] p-4 transition hover:-translate-y-0.5 hover:border-cyan-300/30 hover:bg-white/[0.06]">
                <Icon size={17} className="text-arc-cyan" />
                <div className="mt-3 font-medium text-white">{title as string}</div>
                <div className="mt-1 leading-5 text-slate-500">{copy as string}</div>
              </div>
            ))}
          </div>
        </div>

        <GlassCard className="market-grid overflow-hidden p-0">
          <div className="relative min-h-[520px] p-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <div className="text-sm text-slate-500">ArcMind strategy index</div>
                <div className="mt-1 text-2xl font-semibold text-white">+18.7%</div>
              </div>
              <div className="rounded-md border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-xs text-emerald-200">
                Live vault ready
              </div>
            </div>

            <svg className="spark-line absolute bottom-24 left-6 right-6 h-72 w-[calc(100%-3rem)]" viewBox="0 0 720 280" fill="none">
              <path d="M0 226 C72 194 106 230 158 171 C218 103 261 182 320 125 C384 62 432 151 496 86 C564 18 612 90 720 42" stroke="#22D3EE" strokeWidth="3" />
              <path d="M0 246 C82 222 123 236 184 204 C253 168 292 211 362 159 C446 96 496 136 554 114 C620 90 650 103 720 74" stroke="#3B82F6" strokeWidth="2" opacity=".8" />
              <path d="M0 226 C72 194 106 230 158 171 C218 103 261 182 320 125 C384 62 432 151 496 86 C564 18 612 90 720 42 L720 280 L0 280 Z" fill="url(#heroFill)" opacity=".22" />
              <defs>
                <linearGradient id="heroFill" x1="360" y1="42" x2="360" y2="280">
                  <stop stopColor="#22D3EE" />
                  <stop offset="1" stopColor="#020617" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>

            <div className="absolute bottom-6 left-6 right-6 grid grid-cols-3 gap-3 border-t border-white/10 pt-4 text-sm">
              <div>
                <div className="text-slate-500">Network</div>
                <div className="mt-1 text-white">Arc Testnet</div>
              </div>
              <div>
                <div className="text-slate-500">Asset</div>
                <div className="mt-1 text-white">USDC</div>
              </div>
              <div>
                <div className="text-slate-500">Mode</div>
                <div className="mt-1 text-white">Dry-run execution</div>
              </div>
            </div>
          </div>
        </GlassCard>
      </section>
    </Shell>
  );
}
