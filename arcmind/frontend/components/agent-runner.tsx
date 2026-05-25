"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BrainCircuit, ExternalLink, Loader2, Play, Shield } from "lucide-react";
import { useAccount } from "wagmi";
import { getDecision, runAgent } from "@/lib/api";
import { Button } from "@/components/ui/button";

type RiskProfile = "conservative" | "moderate" | "aggressive";

export function AgentRunner() {
  const { address } = useAccount();
  const router = useRouter();
  const [riskProfile, setRiskProfile] = useState<RiskProfile>("moderate");
  const [publishOnchain, setPublishOnchain] = useState(false);
  const [status, setStatus] = useState("Select a risk profile and run the allocation agent.");
  const [publishTx, setPublishTx] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const normalizedPublishTx = publishTx ? (publishTx.startsWith("0x") ? publishTx : `0x${publishTx}`) : null;

  async function run() {
    setPending(true);
    setPublishTx(null);
    try {
      const result = await runAgent({ wallet: address, risk_profile: riskProfile, publish_onchain: publishOnchain });
      const publish = result.publish?.submitted ? ` Published: ${result.publish.tx_hash?.slice(0, 10)}...` : "";
      setPublishTx(result.publish?.tx_hash ?? null);
      setStatus(`${result.decision.allocations.length} leaders selected. Execution mode: ${result.execution.mode}.${publish || ` ${result.publish?.message ?? ""}`}`);
      window.dispatchEvent(new CustomEvent("arcmind:agent-run"));
      router.refresh();
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        const latest = await getDecision();
        if (latest.decision_hash !== "0x") {
          setStatus(`${latest.allocations.length} leaders selected. Latest decision ${latest.decision_hash.slice(0, 10)}... refreshed from backend.`);
          window.dispatchEvent(new CustomEvent("arcmind:agent-run"));
          router.refresh();
        } else {
          setStatus("Agent request timed out. No stored decision is available yet; refresh leaders and try again.");
        }
      } else {
        const message = error instanceof Error ? error.message : "Unknown backend error";
        setStatus(`Agent run failed. ${message.slice(0, 180)}`);
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="rounded-md border border-cyan-300/20 bg-cyan-300/10 p-4">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-white">
            <BrainCircuit size={16} className="text-arc-cyan" />
            Allocation Agent
          </div>
          <div className="mt-1 text-xs text-cyan-100/80">Ranks leaders, applies risk limits, and stages execution intents.</div>
        </div>
        <Shield size={18} className="text-arc-cyan" />
      </div>
      <div className="mb-3 grid grid-cols-3 rounded-md border border-white/10 bg-slate-950/60 p-1 text-xs">
        {(["conservative", "moderate", "aggressive"] as RiskProfile[]).map((profile) => (
          <button
            key={profile}
            onClick={() => setRiskProfile(profile)}
            className={`rounded px-2 py-2 capitalize transition ${riskProfile === profile ? "bg-arc-blue text-white" : "text-slate-400 hover:text-white"}`}
          >
            {profile}
          </button>
        ))}
      </div>
      <label className="mb-3 flex items-center justify-between rounded-md border border-white/10 bg-slate-950/40 px-3 py-2 text-xs text-slate-300">
        Publish decision on Arc
        <input type="checkbox" checked={publishOnchain} onChange={(event) => setPublishOnchain(event.target.checked)} className="accent-cyan-300" />
      </label>
      <Button onClick={run} disabled={pending} className="w-full">
        {pending ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
        Run Agent
      </Button>
      <div className="mt-3 text-xs text-cyan-50/80">{status}</div>
      {normalizedPublishTx ? (
        <a
          href={`https://testnet.arcscan.app/tx/${normalizedPublishTx}`}
          target="_blank"
          className="mt-3 flex items-center justify-center gap-2 rounded-md border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-xs font-medium text-cyan-100 transition hover:border-cyan-200/50 hover:bg-cyan-300/15"
        >
          <ExternalLink size={13} />
          Verify rebalance on Arc
        </a>
      ) : null}
    </div>
  );
}
