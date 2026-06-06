import Link from "next/link";
import { listDebates } from "@/lib/matchup-store";
import { debateStatusLabel } from "@/lib/ui-labels";

export default function DebatesPage() {
  const debates = listDebates();

  return (
    <main className="container-shell py-10">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">
            Arena publik
          </p>
          <h1 className="mt-2 text-4xl font-black text-white">Debat</h1>
          <p className="mt-3 max-w-2xl text-slate-400">
            Arena MVP membaca debat aktif dari memori sementara. Schema Supabase
            sudah disiapkan untuk persistence production.
          </p>
        </div>
        <Link
          href="/matchup"
          className="rounded-md bg-white px-4 py-2 text-sm font-black text-slate-950 hover:bg-slate-200"
        >
          Debat baru
        </Link>
      </div>

      <div className="grid gap-3">
        {debates.length ? (
          debates.map((debate) => (
            <Link
              key={debate.id}
              href={`/matchup/${debate.id}`}
              className="rounded-lg border border-white/10 bg-white/5 p-4 hover:bg-white/10"
            >
              <h2 className="text-lg font-black text-white">
                {debate.char1.shortName} vs {debate.char2.shortName}
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                {debateStatusLabel(debate.status)} - {debate.arguments.length}{" "}
                argumen
              </p>
            </Link>
          ))
        ) : (
          <div className="surface rounded-lg p-6 text-sm text-slate-400">
            Belum ada debat publik.
          </div>
        )}
      </div>
    </main>
  );
}
