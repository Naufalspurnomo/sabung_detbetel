import Link from "next/link";
import { AbilityTag } from "@/components/AbilityTag";
import { CharacterCard } from "@/components/CharacterCard";
import { FeatCard } from "@/components/FeatCard";
import { getCharacterFeats, getCharacterProfile } from "@/lib/vs-wiki-client";

type ProfilePageProps = {
  params: {
    name: string;
  };
};

export default async function ProfilePage({ params }: ProfilePageProps) {
  const [profile, feats] = await Promise.all([
    getCharacterProfile(params.name),
    getCharacterFeats(params.name)
  ]);

  return (
    <main className="container-shell py-6 sm:py-10">
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <CharacterCard character={profile} />
        <section className="surface rounded-lg p-4 sm:p-5">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500 sm:text-sm">
            Data yang dibaca AI
          </p>
          <h1 className="mt-2 text-2xl font-black text-white sm:text-3xl lg:text-4xl">
            {profile.name}
          </h1>
          <dl className="mt-4 grid gap-3 sm:mt-5 sm:grid-cols-2 sm:gap-4">
            {[
              ["Seri", profile.series],
              ["Tier", profile.tier],
              ["Attack Potency", profile.attackPotency],
              ["Speed", profile.speed],
              ["Durability", profile.durability],
              ["Kecerdasan", profile.intelligence]
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-lg border border-white/10 p-3 sm:p-4"
              >
                <dt className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500 sm:text-xs">
                  {label}
                </dt>
                <dd className="mt-1.5 text-xs font-semibold leading-5 text-slate-200 sm:mt-2 sm:text-sm sm:leading-6">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
          <div className="mt-4 sm:mt-5">
            <h2 className="text-base font-black text-white sm:text-lg">
              Ability / hax
            </h2>
            <div className="mt-2 flex flex-wrap gap-1.5 sm:mt-3 sm:gap-2">
              {profile.abilities.length ? (
                profile.abilities.map((ability) => (
                  <AbilityTag key={ability} ability={ability} />
                ))
              ) : (
                <p className="text-sm text-slate-500">
                  Ability belum berhasil diparse dari profil.
                </p>
              )}
            </div>
          </div>
          <div className="mt-4 rounded-lg border border-amber-300/20 bg-amber-300/10 p-3 sm:mt-5 sm:p-4">
            <h2 className="text-xs font-black text-amber-100 sm:text-sm">
              Dipakai untuk analisis, bukan cuma dilihat
            </h2>
            <p className="mt-2 text-xs leading-5 text-amber-50/80 sm:text-sm sm:leading-6">
              Profil ini menjadi bahan wasit: stat dipakai untuk gap tier,
              ability dipakai untuk hax check, dan sumber dipakai untuk menilai
              apakah argumen user didukung atau masih butuh bukti.
            </p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 sm:mt-5 sm:gap-3">
            <Link
              href={`/matchup?char1=${encodeURIComponent(profile.pageTitle)}`}
              className="rounded-md bg-white px-4 py-2.5 text-xs font-black text-slate-950 transition hover:bg-slate-200 active:scale-95 sm:text-sm"
            >
              Jadikan matchup
            </Link>
            <a
              href={profile.wikiUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-md border border-white/10 px-4 py-2.5 text-xs font-bold text-slate-200 transition hover:bg-white/10 active:scale-95 sm:text-sm"
            >
              Buka sumber
            </a>
          </div>
        </section>
      </div>

      <section className="mt-6 sm:mt-8">
        <div className="mb-3 flex items-center justify-between gap-3 sm:mb-4 sm:gap-4">
          <h2 className="text-xl font-black text-white sm:text-2xl">
            Bukti yang diekstrak
          </h2>
          <span className="text-xs font-semibold text-slate-500 sm:text-sm">
            Starter set berbasis sumber
          </span>
        </div>
        <div className="grid gap-3 sm:gap-4 md:grid-cols-3">
          {feats.map((feat) => (
            <FeatCard key={feat.id} feat={feat} />
          ))}
        </div>
      </section>
    </main>
  );
}
