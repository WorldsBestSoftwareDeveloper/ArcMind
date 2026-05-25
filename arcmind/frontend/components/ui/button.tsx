import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
};

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium transition duration-200 focus:outline-none focus:ring-2 focus:ring-arc-cyan/50 disabled:pointer-events-none disabled:opacity-50",
        variant === "primary" && "bg-arc-blue text-white shadow-[0_12px_30px_rgba(59,130,246,.24)] hover:-translate-y-0.5 hover:bg-blue-400 hover:shadow-[0_18px_45px_rgba(34,211,238,.26)]",
        variant === "secondary" && "border border-cyan-300/25 bg-white/8 text-cyan-100 hover:-translate-y-0.5 hover:bg-white/12 hover:shadow-[0_14px_38px_rgba(34,211,238,.12)]",
        variant === "ghost" && "text-slate-300 hover:bg-white/8 hover:text-white",
        className
      )}
      {...props}
    />
  );
}
