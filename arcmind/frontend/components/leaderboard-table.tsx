"use client";

import { Copy, Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import type { LeaderboardResponse } from "@/lib/types";

function qualityLabel(degradation: number) {
  if (degradation < 0.16) return "Clean";
  if (degradation < 0.34) return "Watch";
  return "Degrading";
}

export function LeaderboardTable({ feed }: { feed: LeaderboardResponse }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "clean" | "watch" | "degrading">("all");

  const rows = useMemo(() => {
    return feed.rows.filter((leader) => {
      const haystack = `${leader.display_name} ${leader.account}`.toLowerCase();
      const matchesQuery = haystack.includes(query.toLowerCase());
      const label = qualityLabel(leader.degradation).toLowerCase();
      const matchesFilter = filter === "all" || label === filter;
      return matchesQuery && matchesFilter;
    });
  }, [feed.rows, filter, query]);

  return (
    <div>
      <div className="mb-4 flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div className={`rounded-md border px-3 py-2 text-xs ${feed.ok ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100" : "border-amber-300/20 bg-amber-300/10 text-amber-100"}`}>
          {feed.message}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="flex h-9 items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 text-xs text-slate-300">
            <Search size={14} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search address or name"
              className="w-48 bg-transparent text-slate-100 outline-none placeholder:text-slate-500"
            />
          </label>
          <label className="flex h-9 items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 text-xs text-slate-300">
            <SlidersHorizontal size={14} />
            <select value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)} className="bg-slate-950 text-slate-100 outline-none">
              <option value="all">All signals</option>
              <option value="clean">Clean</option>
              <option value="watch">Watch</option>
              <option value="degrading">Degrading</option>
            </select>
          </label>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-md border border-white/10 bg-white/[0.035] p-8 text-center text-sm text-slate-400">
          No live leaders match this view. Start the backend, verify Hyperliquid testnet connectivity, or run the agent.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border border-white/10">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="border-b border-white/10 bg-white/[0.035] text-xs uppercase tracking-[0.08em] text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">Rank</th>
                <th className="px-5 py-3 font-medium">Trader</th>
                <th className="px-5 py-3 font-medium">Wallet</th>
                <th className="px-5 py-3 font-medium">ROI 30D</th>
                <th className="px-5 py-3 font-medium">Drawdown</th>
                <th className="px-5 py-3 font-medium">Sharpe</th>
                <th className="px-5 py-3 font-medium">Calmar</th>
                <th className="px-5 py-3 font-medium">Consistency</th>
                <th className="px-5 py-3 font-medium">Signal</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((leader, index) => (
                <tr key={leader.trader_id} className="border-b border-white/[0.06] transition hover:bg-cyan-300/[0.035]">
                  <td className="px-5 py-4 font-mono text-slate-400">#{index + 1}</td>
                  <td className="px-5 py-4">
                    <div className="font-medium text-white">{leader.display_name}</div>
                    <div className="mt-0.5 text-xs text-slate-500">{leader.trader_id}</div>
                  </td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => navigator.clipboard.writeText(leader.account)}
                      className="flex max-w-[220px] items-center gap-2 truncate font-mono text-xs text-cyan-100 hover:text-white"
                      title={leader.account}
                    >
                      {leader.account}
                      <Copy size={12} />
                    </button>
                  </td>
                  <td className="px-5 py-4 font-mono text-emerald-300">+{(leader.roi_30d * 100).toFixed(1)}%</td>
                  <td className="px-5 py-4 font-mono text-slate-300">{(leader.max_drawdown * 100).toFixed(1)}%</td>
                  <td className="px-5 py-4 font-mono text-slate-300">{leader.sharpe.toFixed(2)}</td>
                  <td className="px-5 py-4 font-mono text-slate-300">{leader.calmar.toFixed(2)}</td>
                  <td className="px-5 py-4">
                    <div className="h-1.5 w-24 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-cyan-300" style={{ width: `${Math.round(leader.consistency * 100)}%` }} />
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`rounded-md border px-2 py-1 text-xs ${leader.degradation < 0.34 ? "border-cyan-300/20 bg-cyan-300/10 text-cyan-100" : "border-amber-300/20 bg-amber-300/10 text-amber-100"}`}>
                      {qualityLabel(leader.degradation)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
