import Link from "next/link";
import { fallbackCharacters } from "@/lib/mock-data";
import { TierMeter } from "@/components/TierMeter";

export default function TierExplorerPage() {
  const tiers = ["Low 2-C", "4-A", "4-B", "5-B"];

  return (
    <main className="container-shell py-10">
      <div className="mb-7">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">
          Peta tier
        </p>
        <h1 className="mt-2 text-4xl font-black text-white">Eksplorasi tier</h1>
        <p className="mt-3 max-w-2xl text-slate-400">
          Peta tier MVP memakai karakter populer sebagai seed. Endpoint API sudah
          siap disambungkan ke daftar tier berbasis Supabase.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <aside className="surface rounded-lg p-4">
          <h2 className="text-sm font-black uppercase tracking-[0.16em] text-slate-500">
            Tier
          </h2>
          <div className="mt-4 grid gap-2">
            {tiers.map((tier) => (
              <a
                key={tier}
                href={`/api/tools/tier-explorer?tier=${encodeURIComponent(tier)}`}
                className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm font-bold text-slate-200 hover:bg-white/10"
              >
                {tier}
              </a>
            ))}
          </div>
        </aside>
        <section className="grid gap-4 md:grid-cols-2">
          {fallbackCharacters.map((character) => (
            <Link
              key={character.id}
              href={`/profile/${encodeURIComponent(character.pageTitle)}`}
              className="rounded-lg border border-white/10 bg-white/5 p-5 hover:bg-white/10"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                    {character.series}
                  </p>
                  <h2 className="mt-1 text-xl font-black text-white">
                    {character.shortName}
                  </h2>
                </div>
                <span className="rounded-md border border-white/10 bg-white/10 px-2 py-1 text-sm font-black text-white">
                  {character.tier}
                </span>
              </div>
              <div className="mt-5">
                <TierMeter tier={character.tier} />
              </div>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}
