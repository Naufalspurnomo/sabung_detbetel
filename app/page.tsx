import Link from "next/link";
import { CharacterCard } from "@/components/CharacterCard";
import { VerdictCard } from "@/components/VerdictCard";
import { judgeDebate } from "@/lib/judge";
import { fallbackCharacters } from "@/lib/mock-data";

export default function HomePage() {
  const [goku, saitama] = fallbackCharacters;
  const demoVerdict = judgeDebate({
    char1: goku,
    char2: saitama,
    arguments: [
      {
        id: "demo-a",
        debateId: "demo",
        userId: "demo",
        characterTitle: goku.pageTitle,
        content:
          "Ultra Instinct memberi Goku gerakan otonom dan tier Low 2-C membuat gap AP mentah.",
        createdAt: new Date().toISOString()
      },
      {
        id: "demo-b",
        debateId: "demo",
        userId: "demo",
        characterTitle: saitama.pageTitle,
        content:
          "Saitama tidak punya limiter, jadi dia bisa terus berkembang kalau pertarungan cukup lama.",
        createdAt: new Date().toISOString()
      }
    ]
  });

  return (
    <main>
      <section className="border-b border-slate-800/80">
        <div className="container-shell grid min-h-[calc(100vh-64px)] items-center gap-10 py-10 lg:grid-cols-[0.92fr_1.08fr]">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.24em] text-red-200">
              Wasit debat Death Battle berbasis VSB
            </p>
            <h1 className="mt-4 max-w-3xl text-5xl font-black leading-[1.02] text-white sm:text-6xl">
              VSBattle AI
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
              Bukan sekadar pembaca profil. VSBattle AI menarik data VS Battles
              Wiki, memecah klaim argumen, mengecek tier/AP/speed/hax, lalu
              memberi putusan dengan sumber yang bisa dicek.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/matchup"
                className="rounded-md bg-white px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-slate-200"
              >
                Mulai debat
              </Link>
              <Link
                href="/search"
                className="rounded-md border border-white/20 bg-white/10 px-5 py-3 text-sm font-black text-white transition hover:bg-white/20"
              >
                Cari karakter
              </Link>
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {[
                ["1", "Ambil data", "Data VSB ditarik dan diparse."],
                ["2", "Cek klaim", "Argumen dicocokkan ke tier, AP, speed, hax."],
                ["3", "Putuskan", "Putusan keluar dengan keyakinan dan sumber."]
              ].map(([step, title, copy]) => (
                <div key={step} className="rounded-lg border border-white/10 bg-white/5 p-4">
                  <span className="grid size-7 place-items-center rounded-md bg-white text-xs font-black text-slate-950">
                    {step}
                  </span>
                  <p className="mt-3 text-sm font-black text-white">{title}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-400">{copy}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <CharacterCard character={goku} side="red" compact />
              <CharacterCard character={saitama} side="blue" compact />
            </div>
            <VerdictCard verdict={demoVerdict} />
          </div>
        </div>
      </section>

      <section className="container-shell grid gap-4 py-10 md:grid-cols-3">
        {[
          {
            title: "Ambil data VSB langsung",
            copy: "Pencarian memakai MediaWiki API Fandom. Kalau upstream gagal, MVP memakai seed terbatas agar flow tetap bisa dites."
          },
          {
            title: "Bukan nebak pemenang",
            copy: "Wasit membandingkan tier, AP, speed, durability, hax, lalu menilai apakah argumen user didukung data atau butuh sumber."
          },
          {
            title: "Beda dari profil biasa",
            copy: "Profil VSB cuma menampilkan data. Di sini data itu dipakai untuk membongkar klaim debat dan membuat verdict yang konsisten."
          }
        ].map((item) => (
          <article key={item.title} className="rounded-lg border border-white/10 p-5">
            <h2 className="text-lg font-black text-white">{item.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">{item.copy}</p>
          </article>
        ))}
      </section>


    </main>
  );
}
