"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type CreateResponse = {
  id?: string;
  error?: string;
};

export function MatchupSetup() {
  const router = useRouter();
  const [char1, setChar1] = useState("Son Goku (Dragon Ball Super)");
  const [char2, setChar2] = useState("Saitama");
  const [mode, setMode] = useState<"solo" | "duel">("solo");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/matchup/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ char1, char2, mode })
      });
      const payload = (await response.json()) as CreateResponse;

      if (!response.ok || !payload.id) {
        throw new Error(payload.error ?? "Gagal membuat matchup");
      }

      router.push(`/matchup/${payload.id}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Gagal membuat matchup");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="surface rounded-lg p-5">
      <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-end">
        <label className="block">
          <span className="text-xs font-black uppercase tracking-[0.16em] text-red-200">
            Pihak 1
          </span>
          <input
            value={char1}
            onChange={(event) => setChar1(event.target.value)}
            className="focus-ring mt-2 min-h-12 w-full rounded-md border border-red-400/20 bg-red-500/10 px-4 text-white"
          />
        </label>
        <div className="grid size-12 place-items-center rounded-md border border-white/10 bg-white/10 text-sm font-black text-white">
          VS
        </div>
        <label className="block">
          <span className="text-xs font-black uppercase tracking-[0.16em] text-blue-200">
            Pihak 2
          </span>
          <input
            value={char2}
            onChange={(event) => setChar2(event.target.value)}
            className="focus-ring mt-2 min-h-12 w-full rounded-md border border-blue-400/20 bg-blue-500/10 px-4 text-white"
          />
        </label>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
        <div className="inline-grid grid-cols-2 rounded-md border border-white/10 bg-black/20 p-1">
          {(["solo", "duel"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setMode(item)}
              className={`rounded px-4 py-2 text-sm font-black capitalize ${
                mode === item
                  ? "bg-white text-slate-950"
                  : "text-slate-300 hover:bg-white/10"
              }`}
            >
              {item === "solo" ? "Solo" : "Duel"}
            </button>
          ))}
        </div>
        <button
          type="submit"
          disabled={loading}
          className="min-h-12 rounded-md bg-white px-6 text-sm font-black text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Membuat" : "Mulai debat"}
        </button>
      </div>

      {error && <p className="mt-4 text-sm text-red-200">{error}</p>}
    </form>
  );
}
