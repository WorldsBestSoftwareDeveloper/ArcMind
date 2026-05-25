import type { ReactNode } from "react";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { GlassCard } from "@/components/ui/glass-card";

export function AppFrame({ children }: { children: ReactNode }) {
  return (
    <GlassCard className="overflow-hidden p-0">
      <div className="grid min-h-[720px] lg:grid-cols-[220px_1fr]">
        <DashboardSidebar />
        <section className="min-w-0 p-5 sm:p-7">{children}</section>
      </div>
    </GlassCard>
  );
}
