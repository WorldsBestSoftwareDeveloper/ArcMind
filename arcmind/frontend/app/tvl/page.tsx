import { Database, ExternalLink, Wallet } from "lucide-react";
import { AppFrame } from "@/components/layout/app-frame";
import { LiveVaultValue } from "@/components/live-vault-value";
import { PageHeader } from "@/components/page-header";
import { Shell } from "@/components/layout/shell";
import { GlassCard } from "@/components/ui/glass-card";
import { getDashboard } from "@/lib/api";

const vault = process.env.NEXT_PUBLIC_ARCMIND_VAULT_ADDRESS;

export const dynamic = "force-dynamic";

export default async function TvlPage() {
  const snapshot = await getDashboard();
  return (
    <Shell>
      <AppFrame>
        <PageHeader
          kicker={<><Database size={14} /> Vault metrics</>}
          title="TVL"
          copy="Live ArcMindVault balances from Arc Testnet. This page is intentionally focused on vault health rather than trading simulation."
        />
        <div className="grid gap-5 lg:grid-cols-[1fr_.8fr]">
          <GlassCard>
            <div className="text-xs uppercase tracking-[0.12em] text-slate-500">Total value locked</div>
            <div className="mt-4">
              <LiveVaultValue fallback={snapshot.tvl} />
            </div>
            <div className="mt-3 text-sm text-slate-400">USDC held by ArcMindVault on Arc Testnet.</div>
          </GlassCard>
          <GlassCard>
            <div className="mb-4 flex items-center gap-2 text-white">
              <Wallet size={16} className="text-arc-cyan" />
              Vault
            </div>
            <div className="break-all font-mono text-sm text-cyan-100">{vault}</div>
            <a
              href={`https://testnet.arcscan.app/address/${vault}`}
              target="_blank"
              className="mt-4 inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 hover:text-white"
            >
              View on explorer <ExternalLink size={14} />
            </a>
          </GlassCard>
        </div>
      </AppFrame>
    </Shell>
  );
}
