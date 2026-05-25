const segments = [
  ["Trend Following", "42%", "bg-arc-blue"],
  ["DeFi Yield", "28%", "bg-arc-cyan"],
  ["Market Making", "18%", "bg-violet-500"],
  ["Arbitrage", "12%", "bg-sky-300"]
];

export function AllocationDonut() {
  return (
    <div className="flex items-center gap-6">
      <div className="donut relative h-32 w-32 shrink-0 rounded-full shadow-glow">
        <div className="absolute inset-7 rounded-full bg-slate-950" />
      </div>
      <div className="grid flex-1 gap-3 text-sm">
        {segments.map(([label, value, color]) => (
          <div key={label} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2 text-slate-300">
              <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
              {label}
            </span>
            <span className="text-white">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
