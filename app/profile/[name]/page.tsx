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
    <main className="container-shell py-10">
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <CharacterCard character={profile} />
        <section className="surface rounded-lg p-5">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">
            Data yang dibaca AI
          </p>
          <h1 className="mt-2 text-4xl font-black text-white">{profile.name}</h1>
          <dl className="mt-5 grid gap-4 sm:grid-cols-2">
            {[
              ["Seri", profile.series],
              ["Tier", profile.tier],
              ["Attack Potency", profile.attackPotency],
              ["Speed", profile.speed],
              ["Durability", profile.durability],
              ["Kecerdasan", profile.intelligence]
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-white/10 p-4">
                <dt className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                  {label}
                </dt>
                <dd className="mt-2 text-sm font-semibold leading-6 text-slate-200">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
          <div className="mt-5">
            <h2 className="text-lg font-black text-white">Ability / hax</h2>
            <div className="mt-3 flex flex-wrap gap-2">
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
          <div className="mt-5 rounded-lg border border-amber-300/20 bg-amber-300/10 p-4">
            <h2 className="text-sm font-black text-amber-100">
              Dipakai untuk analisis, bukan cuma dilihat
            </h2>
            <p className="mt-2 text-sm leading-6 text-amber-50/80">
              Profil ini menjadi bahan wasit: stat dipakai untuk gap tier,
              ability dipakai untuk hax check, dan sumber dipakai untuk menilai
              apakah argumen user didukung atau masih butuh bukti.
            </p>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href={`/matchup?char1=${encodeURIComponent(profile.pageTitle)}`}
              className="rounded-md bg-white px-4 py-2 text-sm font-black text-slate-950 hover:bg-slate-200"
            >
              Jadikan matchup
            </Link>
            <a
              href={profile.wikiUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-md border border-white/10 px-4 py-2 text-sm font-bold text-slate-200 hover:bg-white/10"
            >
              Buka sumber
            </a>
          </div>
        </section>
      </div>

      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-2xl font-black text-white">Bukti yang diekstrak</h2>
          <span className="text-sm font-semibold text-slate-500">
            Starter set berbasis sumber
          </span>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {feats.map((feat) => (
            <FeatCard key={feat.id} feat={feat} />
          ))}
        </div>
      </section>
    </main>
  );
}
