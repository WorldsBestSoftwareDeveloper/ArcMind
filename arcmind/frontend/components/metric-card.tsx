import { GlassCard } from "@/components/ui/glass-card";

export function MetricCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <GlassCard className="overflow-hidden">
      <div className="text-sm text-slate-400">{label}</div>
      <div className="mt-3 text-3xl font-semibold text-white">{value}</div>
      <div className="mt-2 text-sm text-cyan-200">{sub}</div>
    </GlassCard>
  );
}
