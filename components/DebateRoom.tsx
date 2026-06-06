"use client";

import { FormEvent, useEffect, useState } from "react";
import { CharacterCard } from "./CharacterCard";
import { DebateMessage } from "./DebateMessage";
import { VerdictCard } from "./VerdictCard";
import type { Debate } from "@/lib/types";

type DebateRoomProps = {
  debateId: string;
  initialDebate?: Debate;
};

export function DebateRoom({ debateId, initialDebate }: DebateRoomProps) {
  const [debate, setDebate] = useState<Debate | undefined>(initialDebate);
  const [side, setSide] = useState<"char1" | "char2">("char1");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(!initialDebate);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!debate) {
      void refresh();
    }
  }, []);

  async function refresh() {
    setLoading(true);
    try {
      const response = await fetch(`/api/matchup/${debateId}`);
      if (!response.ok) {
        throw new Error("Ruang debat tidak ditemukan");
      }
      setDebate((await response.json()) as Debate);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Gagal memuat ruang debat"
      );
    } finally {
      setLoading(false);
    }
  }

  async function submitArgument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!debate || !content.trim()) {
      return;
    }

    const characterTitle =
      side === "char1" ? debate.char1.pageTitle : debate.char2.pageTitle;

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/matchup/${debateId}/argue`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ characterTitle, content })
      });

      if (!response.ok) {
        throw new Error("Gagal mengirim argumen");
      }

      setContent("");
      await refresh();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Gagal mengirim argumen"
      );
    } finally {
      setLoading(false);
    }
  }

  async function judge() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/matchup/${debateId}/judge`, {
        method: "POST"
      });

      if (!response.ok) {
        throw new Error("Gagal menjalankan wasit AI");
      }

      setDebate((await response.json()) as Debate);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Gagal menjalankan wasit AI"
      );
    } finally {
      setLoading(false);
    }
  }

  if (loading && !debate) {
    return (
      <div className="surface rounded-lg p-6 text-sm font-semibold text-slate-300">
        Memuat ruang debat...
      </div>
    );
  }

  if (!debate) {
    return (
      <div className="surface rounded-lg p-6">
        <h1 className="text-2xl font-black text-white">
          Ruang debat tidak ditemukan
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Penyimpanan ruang debat masih sementara di MVP ini. Buat matchup baru
          kalau room sudah hilang.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-2">
        <CharacterCard character={debate.char1} side="red" compact />
        <CharacterCard character={debate.char2} side="blue" compact />
      </div>

      <form onSubmit={submitArgument} className="surface rounded-lg p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-grid grid-cols-2 rounded-md border border-white/10 bg-black/20 p-1">
            <button
              type="button"
              onClick={() => setSide("char1")}
              className={`rounded px-4 py-2 text-sm font-black ${
                side === "char1"
                  ? "bg-red-500 text-white"
                  : "text-slate-300 hover:bg-white/10"
              }`}
            >
              Argumen Pihak 1
            </button>
            <button
              type="button"
              onClick={() => setSide("char2")}
              className={`rounded px-4 py-2 text-sm font-black ${
                side === "char2"
                  ? "bg-blue-500 text-white"
                  : "text-slate-300 hover:bg-white/10"
              }`}
            >
              Argumen Pihak 2
            </button>
          </div>
          <button
            type="button"
            onClick={judge}
            disabled={loading}
            className="rounded-md border border-amber-300/30 bg-amber-300/10 px-4 py-2 text-sm font-black text-amber-100 hover:bg-amber-300/20 disabled:opacity-60"
          >
            Jalankan wasit
          </button>
        </div>
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Contoh: Ultra Instinct memberi Goku gerakan otonom, dan gap AP Low 2-C membuat Saitama tidak aman untuk scaling naik sebelum terkena serangan penentu."
          rows={5}
          className="focus-ring mt-4 w-full resize-y rounded-md border border-white/10 bg-black/30 p-4 text-sm leading-6 text-white placeholder:text-slate-600"
        />
        <button
          type="submit"
          disabled={loading}
          className="mt-3 min-h-11 rounded-md bg-white px-5 text-sm font-black text-slate-950 hover:bg-slate-200 disabled:opacity-60"
        >
          Kirim argumen
        </button>
        {error && <p className="mt-3 text-sm text-red-200">{error}</p>}
      </form>

      <section className="space-y-3">
        {debate.arguments.map((argument) => (
          <DebateMessage
            key={argument.id}
            argument={argument}
            side={
              argument.characterTitle === debate.char1.pageTitle ? "red" : "blue"
            }
          />
        ))}
      </section>

      {debate.verdict && <VerdictCard verdict={debate.verdict} />}
    </div>
  );
}
