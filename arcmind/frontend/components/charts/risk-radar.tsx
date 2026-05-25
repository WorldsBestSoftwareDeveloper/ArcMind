"use client";

import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer } from "recharts";
import { riskSeries } from "@/lib/mock-data";

export function RiskRadar() {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={riskSeries}>
          <PolarGrid stroke="rgba(148,163,184,.2)" />
          <PolarAngleAxis dataKey="name" tick={{ fill: "#cbd5e1", fontSize: 12 }} />
          <Radar dataKey="value" stroke="#22D3EE" fill="#22D3EE" fillOpacity={0.26} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
