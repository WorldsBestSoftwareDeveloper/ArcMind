import { ArrowRight, Sparkles } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { VaultActions } from "@/components/vault-actions";

export function DepositPanel() {
  return (
    <GlassCard className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm text-slate-400">Capital controls</div>
          <h3 className="mt-1 text-xl font-semibold text-white">Deposit USDC, follow AI</h3>
        </div>
        <span className="ai-pulse flex h-10 w-10 items-center justify-center rounded-md bg-cyan-300/12 text-arc-cyan">
          <Sparkles size={18} />
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ["1", "Connect wallet"],
          ["2", "Approve USDC"],
          ["3", "Enter AI vault"]
        ].map(([step, text]) => (
          <div key={step} className="rounded-md border border-white/10 bg-white/6 p-3">
            <div className="text-xs text-cyan-200">Step {step}</div>
            <div className="mt-1 text-sm text-slate-200">{text}</div>
          </div>
        ))}
      </div>
      <VaultActions />
      <div className="flex items-center gap-2 text-sm text-slate-400">
        Paymaster-ready flow <ArrowRight size={14} /> user gas can be abstracted into USDC.
      </div>
    </GlassCard>
  );
}
