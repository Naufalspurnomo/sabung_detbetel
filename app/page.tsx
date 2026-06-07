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
      {/* ── Hero Section ── */}
      <section className="border-b border-slate-800/80">
        <div className="container-shell grid items-center gap-6 py-8 sm:gap-10 sm:py-10 lg:min-h-[calc(100vh-64px)] lg:grid-cols-[0.92fr_1.08fr]">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-red-200 sm:text-sm">
              Wasit debat Death Battle berbasis VSB
            </p>
            <h1 className="mt-3 text-4xl font-black leading-[1.02] text-white sm:mt-4 sm:text-5xl lg:text-6xl">
              VSBattle AI
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300 sm:mt-5 sm:text-lg sm:leading-8">
              Bukan sekadar pembaca profil. VSBattle AI menarik data VS Battles
              Wiki, memecah klaim argumen, mengecek tier/AP/speed/hax, lalu
              memberi putusan dengan sumber yang bisa dicek.
            </p>
            <div className="mt-5 flex flex-wrap gap-3 sm:mt-7">
              <Link
                href="/matchup"
                className="rounded-lg bg-white px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-slate-200 active:scale-95"
              >
                Mulai debat
              </Link>
              <Link
                href="/search"
                className="rounded-lg border border-white/20 bg-white/10 px-5 py-3 text-sm font-black text-white transition hover:bg-white/20 active:scale-95"
              >
                Cari karakter
              </Link>
            </div>

            {/* Steps */}
            <div className="mt-6 grid gap-2.5 sm:mt-8 sm:grid-cols-3 sm:gap-3">
              {[
                ["1", "Ambil data", "Data VSB ditarik dan diparse."],
                ["2", "Cek klaim", "Argumen dicocokkan ke tier, AP, speed, hax."],
                ["3", "Putuskan", "Putusan keluar dengan keyakinan dan sumber."]
              ].map(([step, title, copy]) => (
                <div key={step} className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/5 p-3 sm:block sm:p-4">
                  <span className="grid size-7 shrink-0 place-items-center rounded-md bg-white text-xs font-black text-slate-950">
                    {step}
                  </span>
                  <div className="sm:mt-3">
                    <p className="text-sm font-black text-white">{title}</p>
                    <p className="mt-0.5 text-xs leading-5 text-slate-400 sm:mt-1">{copy}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Demo cards */}
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <CharacterCard character={goku} side="red" compact />
              <CharacterCard character={saitama} side="blue" compact />
            </div>
            <VerdictCard verdict={demoVerdict} />
          </div>
        </div>
      </section>

      {/* ── Features Section ── */}
      <section className="container-shell grid gap-3 py-8 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 lg:py-10">
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
          <article key={item.title} className="rounded-lg border border-white/10 p-4 sm:p-5">
            <h2 className="text-base font-black text-white sm:text-lg">{item.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">{item.copy}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
