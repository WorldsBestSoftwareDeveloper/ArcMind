import type { ReactNode } from "react";

export function PageHeader({ kicker, title, copy, action }: { kicker: ReactNode; title: string; copy: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 border-b border-white/10 pb-5 md:flex-row md:items-end">
      <div>
        <div className="page-kicker">{kicker}</div>
        <h1 className="page-title">{title}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">{copy}</p>
      </div>
      {action}
    </div>
  );
}
