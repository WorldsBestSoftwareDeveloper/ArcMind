function Bar({ value, color }: { value: number; color: string }) {
  return (
    <div className="h-1.5 w-28 overflow-hidden rounded-full bg-white/10">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.max(4, Math.min(100, value))}%` }} />
    </div>
  );
}

const rows = [
  { label: "Selection quality", ai: "Risk-ranked", blind: "Equal mirror", aiScore: 82, blindScore: 42 },
  { label: "Capital sizing", ai: "Dynamic", blind: "Fixed", aiScore: 76, blindScore: 38 },
  { label: "Exit discipline", ai: "Degradation-aware", blind: "Manual", aiScore: 71, blindScore: 28 },
  { label: "Noise filtering", ai: "Signal-gated", blind: "Copies all", aiScore: 79, blindScore: 35 }
];

export function AiVsBlindComparison({ aiReturn = 0, blindReturn = 0 }: { aiReturn?: number; blindReturn?: number }) {
  const spread = aiReturn - blindReturn;
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-md border border-cyan-300/15 bg-cyan-300/10 p-3">
          <div className="text-xs text-cyan-100/70">Simulated AI PnL</div>
          <div className="mt-1 font-mono text-xl text-cyan-100">{aiReturn >= 0 ? "+" : ""}{aiReturn.toFixed(2)}%</div>
        </div>
        <div className="rounded-md border border-violet-300/15 bg-violet-300/10 p-3">
          <div className="text-xs text-violet-100/70">Blind baseline</div>
          <div className="mt-1 font-mono text-xl text-violet-100">{blindReturn >= 0 ? "+" : ""}{blindReturn.toFixed(2)}%</div>
        </div>
        <div className="rounded-md border border-emerald-300/15 bg-emerald-300/10 p-3">
          <div className="text-xs text-emerald-100/70">Simulated spread</div>
          <div className="mt-1 font-mono text-xl text-emerald-100">{spread >= 0 ? "+" : ""}{spread.toFixed(2)}%</div>
        </div>
      </div>
      <div className="overflow-hidden rounded-md border border-white/10">
      <div className="grid grid-cols-[1fr_1fr_1fr] border-b border-white/10 bg-white/[0.035] px-4 py-3 text-xs uppercase tracking-[0.08em] text-slate-500">
        <span>Metric</span>
        <span>AI Copy</span>
        <span>Blind Copy</span>
      </div>
      {rows.map((row) => (
        <div key={row.label} className="grid grid-cols-[1fr_1fr_1fr] items-center gap-4 border-b border-white/[0.06] px-4 py-4 text-sm last:border-b-0">
          <span className="text-slate-400">{row.label}</span>
          <span className="space-y-2 text-cyan-100">
            <span>{row.ai}</span>
            <Bar value={row.aiScore} color="bg-cyan-300" />
          </span>
          <span className="space-y-2 text-slate-500">
            <span>{row.blind}</span>
            <Bar value={row.blindScore} color="bg-violet-400" />
          </span>
        </div>
      ))}
      </div>
    </div>
  );
}
