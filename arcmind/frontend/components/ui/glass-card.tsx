import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function GlassCard({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("liquid-card p-5 transition duration-300 hover:-translate-y-0.5 hover:border-cyan-300/35 hover:shadow-[0_26px_90px_rgba(2,6,23,.58),0_0_42px_rgba(34,211,238,.12),inset_0_1px_0_rgba(255,255,255,.12)]", className)} {...props} />;
}
