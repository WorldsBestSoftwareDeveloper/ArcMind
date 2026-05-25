import type { AllocationDecision } from "@/lib/types";

export function AllocationTable({ rows }: { rows: AllocationDecision[] }) {
  return (
    <div className="overflow-x-auto rounded-md border border-white/10">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="bg-white/[0.035] text-xs uppercase tracking-[0.08em] text-slate-500">
          <tr>
            <th className="px-5 py-3 font-medium">Trader</th>
            <th className="px-5 py-3 font-medium">Action</th>
            <th className="px-5 py-3 font-medium">Weight</th>
            <th className="px-5 py-3 font-medium">Sim PnL</th>
            <th className="px-5 py-3 font-medium">Risk</th>
            <th className="px-5 py-3 font-medium">Thesis</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${row.trader_id}-${row.action}`} className="border-t border-white/[0.06] transition hover:bg-cyan-300/[0.035]">
              <td className="px-5 py-4">
                <div className="font-medium text-white">{row.display_name}</div>
                <div className="font-mono text-xs text-slate-500">{row.account}</div>
              </td>
              <td className="px-5 py-4">
                <span className={`rounded-md border px-2 py-1 text-xs capitalize ${row.action === "exit" ? "border-rose-300/20 bg-rose-300/10 text-rose-100" : "border-cyan-300/20 bg-cyan-300/10 text-cyan-100"}`}>
                  {row.action}
                </span>
              </td>
              <td className="px-5 py-4 font-mono text-slate-200">{(row.weight_bps / 100).toFixed(1)}%</td>
              <td className={`px-5 py-4 font-mono ${row.expected_edge_bps >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                {row.expected_edge_bps >= 0 ? "+" : ""}
                {(row.expected_edge_bps / 100).toFixed(2)}%
              </td>
              <td className="px-5 py-4">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-cyan-300" style={{ width: `${Math.min(100, row.risk_score)}%` }} />
                  </div>
                  <span className="font-mono text-xs text-slate-400">{row.risk_score}</span>
                </div>
              </td>
              <td className="max-w-md px-5 py-4 text-slate-400">{row.thesis}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
