import Link from "next/link";
import { WalletButton } from "@/components/layout/wallet-button";
import { BrandMark } from "@/components/brand-mark";

const links = [
  { href: "/tvl", label: "TVL" },
  { href: "https://docs.arc.io/arc/references/connect-to-arc", label: "Docs" },
  { href: "https://faucet.circle.com/", label: "Faucet" }
];

export function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 text-white">
          <BrandMark className="h-9 w-9" />
          <span className="font-semibold">ArcMind</span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} target={link.href.startsWith("http") ? "_blank" : undefined} className="rounded-md px-3 py-2 text-sm text-slate-300 transition hover:bg-white/8 hover:text-white">
              {link.label}
            </Link>
          ))}
        </nav>
        <WalletButton />
      </div>
    </header>
  );
}
