"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import type { SearchResult } from "@/lib/types";

type SearchPayload = {
  query: string;
  results: SearchResult[];
};

export function CharacterSearch() {
  const [query, setQuery] = useState("Goku");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/characters/search?q=${encodeURIComponent(query)}`
      );
      const payload = (await response.json()) as SearchPayload;
      setResults(payload.results);
    } catch {
      setError("Pencarian gagal. Coba nama karakter lain.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <form onSubmit={onSubmit} className="surface rounded-lg p-4">
        <label className="block text-sm font-black text-white">
          Cari karakter
        </label>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Saitama, Goku, Superman..."
            className="focus-ring min-h-12 flex-1 rounded-md border border-white/10 bg-black/30 px-4 text-white placeholder:text-slate-600"
          />
          <button
            type="submit"
            disabled={loading}
            className="min-h-12 rounded-md bg-white px-5 text-sm font-black text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Mencari" : "Cari"}
          </button>
        </div>
        {error && <p className="mt-3 text-sm text-red-200">{error}</p>}
      </form>

      <div className="grid gap-3">
        {results.map((result) => (
          <Link
            key={result.title}
            href={`/profile/${encodeURIComponent(result.title)}`}
            className="rounded-lg border border-white/10 bg-white/5 p-4 transition hover:border-white/20 hover:bg-white/10"
          >
            <h3 className="text-lg font-black text-white">{result.title}</h3>
            <p className="mt-1 text-sm leading-6 text-slate-400">
              {result.snippet || "Buka profil yang sudah diparse."}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
