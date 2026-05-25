import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <span className={cn("relative flex h-10 w-10 items-center justify-center rounded-md border border-cyan-300/20 bg-slate-950/60 shadow-glow", className)}>
      <svg viewBox="0 0 44 44" className="h-8 w-8" aria-hidden="true">
        <defs>
          <linearGradient id="arcMindMark" x1="9" y1="5" x2="36" y2="38" gradientUnits="userSpaceOnUse">
            <stop stopColor="#22D3EE" />
            <stop offset="0.52" stopColor="#3B82F6" />
            <stop offset="1" stopColor="#8B5CF6" />
          </linearGradient>
        </defs>
        <path d="M22 5 39 36h-8.2L22 19.5 13.2 36H5L22 5Z" fill="url(#arcMindMark)" />
        <path d="M17.5 30.5h9.2L22 22l-4.5 8.5Z" fill="#020617" opacity="0.92" />
        <path d="M12 36c5.8-5.8 14.2-5.8 20 0" stroke="#22D3EE" strokeWidth="2.4" strokeLinecap="round" fill="none" opacity="0.9" />
      </svg>
    </span>
  );
}
