import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "VSBattle AI",
  description:
    "Wasit AI untuk debat Death Battle berbasis data VS Battles Wiki."
};

const navItems = [
  { href: "/search", label: "Cari" },
  { href: "/matchup", label: "Debat" },
  { href: "/debates", label: "Arena" },
  { href: "/tools/ibr-analyzer", label: "IBR" },
  { href: "/tools/respect-rt", label: "Alat" },
  { href: "/settings", label: "Pengaturan" }
];

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-arena-950/80 backdrop-blur-xl">
          <nav className="container-shell flex min-h-16 items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-md border border-red-400/40 bg-red-500/20 font-black text-red-100">
                VS
              </span>
              <span>
                <span className="block text-sm font-black uppercase tracking-[0.18em] text-white">
                  VSBattle AI
                </span>
                <span className="block text-xs text-slate-400">
                  Wasit debat berbasis VSB
                </span>
              </span>
            </Link>
            <div className="hidden items-center gap-1 sm:flex">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-md px-3 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <Link
              href="/dashboard"
              className="rounded-md border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/20"
            >
              Panel
            </Link>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
