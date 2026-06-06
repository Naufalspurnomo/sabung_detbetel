import type { Verdict } from "@/lib/types";
import {
  analysisStatusLabel,
  confidenceLabel,
  difficultyLabel,
  sideLabel
} from "@/lib/ui-labels";

type VerdictCardProps = {
  verdict: Verdict;
};

export function VerdictCard({ verdict }: VerdictCardProps) {
  return (
    <section className="surface rounded-lg p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-300">
            Putusan AI
          </p>
          <h2 className="mt-2 text-3xl font-black text-white">
            {verdict.winnerTitle} menang
          </h2>
          <p className="mt-2 text-sm font-semibold text-slate-300">
            {difficultyLabel(verdict.difficulty)} / keyakinan{" "}
            {confidenceLabel(verdict.confidence)}
          </p>
        </div>
        <span className="rounded-md border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-sm font-black text-amber-100">
          Wasit VSB
        </span>
      </div>

      <div className="mt-5 rounded-lg border border-emerald-300/20 bg-emerald-300/10 p-4">
        <p className="text-sm font-black text-emerald-100">Mode anti-halusinasi</p>
        <p className="mt-1 text-sm leading-6 text-emerald-50/80">
          Putusan ini hanya memakai profil yang berhasil diparse, aturan tiering
          lokal, dan sumber yang ditampilkan di bawah. Klaim yang tidak ketemu di
          data ditandai butuh sumber, bukan dipaksa jadi fakta.
        </p>
      </div>

      <p className="mt-5 text-base leading-7 text-slate-200">
        {verdict.summary}
      </p>
      <p className="mt-3 rounded-md border border-white/10 bg-white/5 p-3 text-sm font-semibold text-slate-200">
        Faktor penentu: {verdict.keyFactor}
      </p>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {verdict.statBreakdown.map((stat) => (
          <div key={stat.label} className="rounded-lg border border-white/10 p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-black text-white">{stat.label}</h3>
              <span className="rounded-md bg-white/10 px-2 py-1 text-xs font-bold text-slate-300">
                {sideLabel(stat.winner)}
              </span>
            </div>
            <dl className="mt-3 space-y-2 text-sm text-slate-300">
              <div>
                <dt className="font-bold text-red-200">Pihak 1</dt>
                <dd>{stat.char1Value}</dd>
              </div>
              <div>
                <dt className="font-bold text-blue-200">Pihak 2</dt>
                <dd>{stat.char2Value}</dd>
              </div>
            </dl>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              {stat.reasoning}
            </p>
          </div>
        ))}
      </div>

      {verdict.argumentAnalysis.length > 0 && (
        <div className="mt-5 space-y-3">
          <h3 className="text-lg font-black text-white">Analisis argumen</h3>
          {verdict.argumentAnalysis.map((analysis, index) => (
            <div
              key={`${analysis.status}-${index}`}
              className="rounded-lg border border-white/10 bg-black/20 p-4"
            >
              <span className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                {analysisStatusLabel(analysis.status)}
              </span>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                {analysis.summary}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        {verdict.sources.map((source) => (
          <a
            key={source.url}
            href={source.url}
            target="_blank"
            rel="noreferrer"
            className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-slate-200 hover:bg-white/10"
          >
            {source.label}
          </a>
        ))}
      </div>
    </section>
  );
}
