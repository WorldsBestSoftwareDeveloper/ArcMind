"use client";

import { useState } from "react";

export function TimeframeSelector() {
  const [active, setActive] = useState("1D");
  return (
    <div className="inline-flex rounded-md border border-white/10 bg-white/5 p-1 text-xs text-slate-400">
      {["1D", "7D", "30D", "90D", "1Y", "All"].map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => setActive(item)}
          className={`rounded px-3 py-1.5 transition ${active === item ? "bg-arc-blue/25 text-white" : "hover:text-white"}`}
        >
          {item}
        </button>
      ))}
    </div>
  );
}
