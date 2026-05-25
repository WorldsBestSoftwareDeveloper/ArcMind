"use client";

import { useEffect, useState } from "react";
import { Pause, Play, ShieldAlert, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAgentStatus, setAgentPaused } from "@/lib/api";

export function StrategyControls() {
  const [risk, setRisk] = useState(52);
  const [paused, setPaused] = useState(false);
  const [status, setStatus] = useState("Loading agent control state...");

  useEffect(() => {
    getAgentStatus().then((result) => {
      setPaused(result.paused);
      setStatus(result.paused ? "Autonomous scheduler is paused." : "Autonomous scheduler is allowed to run when enabled.");
    });
  }, []);

  async function togglePause(nextPaused: boolean) {
    try {
      const result = await setAgentPaused(nextPaused);
      setPaused(result.paused);
      setStatus(result.paused ? "Agent paused. Manual review mode is active." : "Agent resumed. Scheduler can run when enabled.");
    } catch {
      setStatus("Could not update agent pause state. Check backend status.");
    }
  }

  return (
    <div className="rounded-md border border-white/10 bg-white/5 p-4">
      <div className="mb-4 flex items-center gap-2 text-white">
        <SlidersHorizontal size={17} className="text-arc-cyan" />
        Risk Profile
      </div>
      <input
        aria-label="Risk level"
        type="range"
        min={0}
        max={100}
        value={risk}
        onChange={(event) => setRisk(Number(event.target.value))}
        className="w-full accent-cyan-300"
      />
      <div className="mt-2 flex justify-between text-xs text-slate-500">
        <span>Conservative</span>
        <span>Balanced {risk}%</span>
        <span>Aggressive</span>
      </div>
      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        <Button variant="secondary" onClick={() => togglePause(!paused)}>
          {paused ? <Play size={16} /> : <Pause size={16} />}
          {paused ? "Resume Agent" : "Pause Agent"}
        </Button>
        <Button variant="secondary" onClick={() => setStatus("Risk reduction staged. New allocations will favor lower drawdown leaders.")}>
          <ShieldAlert size={16} /> Reduce Risk
        </Button>
      </div>
      <div className="mt-3 text-xs text-slate-400">{status}</div>
    </div>
  );
}
