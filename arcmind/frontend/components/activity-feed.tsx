"use client";

import { Activity, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import { getActivity } from "@/lib/api";

export function ActivityFeed() {
  const [rows, setRows] = useState<Array<Record<string, string | number | null>>>([]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      const result = await getActivity();
      if (mounted) setRows(result.rows);
    }
    load();
    window.addEventListener("arcmind:agent-run", load);
    const timer = window.setInterval(load, 8000);
    return () => {
      mounted = false;
      window.removeEventListener("arcmind:agent-run", load);
      window.clearInterval(timer);
    };
  }, []);

  if (rows.length > 0) {
    return (
      <div className="grid gap-3">
        {rows.map((row, index) => (
          <div key={`${row.tx_hash ?? row.timestamp ?? index}`} className="flex min-w-0 items-center gap-3 rounded-md border border-white/8 bg-white/[0.035] p-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-cyan-300/10 text-arc-cyan">
              <Activity size={15} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm text-white">{String(row.title ?? "Activity")}</div>
              <div className="truncate text-xs text-slate-500">{String(row.detail ?? "")}</div>
            </div>
            {row.tx_hash ? (
              <a
                href={`https://testnet.arcscan.app/tx/${String(row.tx_hash).startsWith("0x") ? row.tx_hash : `0x${row.tx_hash}`}`}
                target="_blank"
                title="Verify on Arc"
                className="shrink-0 rounded-md border border-cyan-300/15 bg-cyan-300/10 p-2 text-cyan-200 hover:border-cyan-200/50"
              >
                <ExternalLink size={14} />
              </a>
            ) : null}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-md border border-white/10 bg-white/[0.035] p-6 text-center">
      <Activity className="mx-auto text-arc-cyan" size={18} />
      <div className="mt-3 text-sm font-medium text-white">No live activity yet</div>
      <div className="mt-1 text-xs leading-5 text-slate-500">
        Deposits, agent runs, and on-chain rebalance events will appear here once they are recorded.
      </div>
    </div>
  );
}
