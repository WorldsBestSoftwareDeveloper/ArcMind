"use client";

import { BarChart3, BrainCircuit, Crown, Database, Gauge, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandMark } from "@/components/brand-mark";

const items: Array<[LucideIcon, string, string]> = [
  [Gauge, "Dashboard", "/dashboard"],
  [Crown, "Leaders", "/leaders"],
  [BrainCircuit, "Strategy", "/strategy"],
  [BarChart3, "Performance", "/performance"],
  [Database, "TVL", "/tvl"]
];

export function DashboardSidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden border-r border-white/10 bg-slate-950/35 p-4 lg:block">
      <div className="mb-8 flex items-center gap-2">
        <BrandMark className="h-8 w-8" />
        <span className="font-semibold text-white">ArcMind</span>
      </div>
      <nav className="grid gap-2">
        {items.map(([Icon, label, href]) => {
          const active = pathname === href;
          return (
          <Link
            key={label as string}
            href={href}
            className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm ${active ? "bg-arc-blue/25 text-white shadow-glow" : "text-slate-400"}`}
          >
            <Icon size={15} />
            {label as string}
          </Link>
        )})}
      </nav>
    </aside>
  );
}
