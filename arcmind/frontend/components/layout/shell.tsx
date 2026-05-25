import type { ReactNode } from "react";
import { Nav } from "@/components/layout/nav";

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <Nav />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
