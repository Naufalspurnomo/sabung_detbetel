"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import "./globals.css";

const navItems = [
  { href: "/search", label: "Cari", icon: "🔍" },
  { href: "/matchup", label: "Debat", icon: "⚔️" },
  { href: "/debates", label: "Arena", icon: "🏟️" },
  { href: "/tools/ibr-analyzer", label: "IBR", icon: "📡" },
  { href: "/tools/respect-rt", label: "Alat", icon: "🛠️" },
  { href: "/settings", label: "Pengaturan", icon: "⚙️" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Lock body scroll when menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <html lang="id">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#090a0f" />
      </head>
      <body>
        {/* ── Header ── */}
        <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-arena-950/80 backdrop-blur-xl">
          <nav className="container-shell flex h-14 items-center justify-between gap-3 sm:h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 shrink-0">
              <span className="grid size-8 place-items-center rounded-md border border-red-400/40 bg-red-500/20 text-xs font-black text-red-100 sm:size-9 sm:text-sm">
                VS
              </span>
              <span>
                <span className="block text-xs font-black uppercase tracking-[0.18em] text-white sm:text-sm">
                  VSBattle AI
                </span>
                <span className="hidden text-xs text-slate-400 sm:block">
                  Wasit debat berbasis VSB
                </span>
              </span>
            </Link>

            {/* Desktop nav */}
            <div className="hidden items-center gap-1 md:flex">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-md px-3 py-2 text-sm font-semibold transition hover:bg-white/10 hover:text-white ${
                    pathname === item.href
                      ? "bg-white/10 text-white"
                      : "text-slate-400"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Right side: Panel + Hamburger */}
            <div className="flex items-center gap-2">
              <Link
                href="/dashboard"
                className="hidden rounded-md border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/20 sm:block"
              >
                Panel
              </Link>

              {/* Hamburger button — mobile only */}
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="relative z-50 flex size-10 items-center justify-center rounded-md text-slate-300 transition hover:bg-white/10 hover:text-white md:hidden"
                aria-label={menuOpen ? "Tutup menu" : "Buka menu"}
              >
                <div className="flex flex-col items-center gap-[5px]">
                  <span
                    className={`block h-[2px] w-5 rounded-full bg-current transition-all duration-300 ${
                      menuOpen ? "translate-y-[7px] rotate-45" : ""
                    }`}
                  />
                  <span
                    className={`block h-[2px] w-5 rounded-full bg-current transition-all duration-300 ${
                      menuOpen ? "opacity-0" : ""
                    }`}
                  />
                  <span
                    className={`block h-[2px] w-5 rounded-full bg-current transition-all duration-300 ${
                      menuOpen ? "-translate-y-[7px] -rotate-45" : ""
                    }`}
                  />
                </div>
              </button>
            </div>
          </nav>
        </header>

        {/* ── Mobile Nav Overlay ── */}
        {menuOpen && (
          <div className="mobile-nav-overlay flex flex-col md:hidden">
            <div className="flex h-14 items-center justify-end px-4">
              <button
                onClick={() => setMenuOpen(false)}
                className="flex size-10 items-center justify-center rounded-md text-slate-300 hover:bg-white/10 hover:text-white"
                aria-label="Tutup menu"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <nav className="flex-1 flex flex-col items-center justify-center gap-2 px-6 pb-20">
              {navItems.map((item, i) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex w-full max-w-xs items-center gap-3 rounded-xl px-5 py-4 text-center text-lg font-bold transition ${
                    pathname === item.href
                      ? "bg-white/15 text-white"
                      : "text-slate-300 hover:bg-white/10 hover:text-white"
                  }`}
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <span className="text-xl">{item.icon}</span>
                  {item.label}
                </Link>
              ))}

              <div className="mt-6 w-full max-w-xs border-t border-white/10 pt-6">
                <Link
                  href="/dashboard"
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-4 text-lg font-bold text-white transition hover:bg-white/20"
                >
                  <span className="text-xl">📊</span>
                  Panel
                </Link>
              </div>
            </nav>
          </div>
        )}

        {/* ── Main Content ── */}
        {children}
      </body>
    </html>
  );
}
