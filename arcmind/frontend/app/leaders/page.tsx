import { Crown } from "lucide-react";
import { LeaderboardTable } from "@/components/leaderboard-table";
import { AppFrame } from "@/components/layout/app-frame";
import { PageHeader } from "@/components/page-header";
import { Shell } from "@/components/layout/shell";
import { getLeaders } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function LeadersPage() {
  const feed = await getLeaders();

  return (
    <Shell>
      <AppFrame>
        <PageHeader
          kicker={<><Crown size={14} /> Leader intelligence</>}
          title="Leaderboard"
          copy="Live Hyperliquid leader rows when available. Wallet addresses are shown so you can inspect and copy the source account."
        />
        <LeaderboardTable feed={feed} />
      </AppFrame>
    </Shell>
  );
}
