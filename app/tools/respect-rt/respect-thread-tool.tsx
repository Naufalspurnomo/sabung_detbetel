"use client";

import { FormEvent, useState } from "react";

export function RespectThreadTool() {
  const [character, setCharacter] = useState("Saitama");
  const [markdown, setMarkdown] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const response = await fetch("/api/tools/respect-thread", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ character })
    });
    const payload = (await response.json()) as { markdown?: string };
    setMarkdown(payload.markdown ?? "");
    setLoading(false);
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
      <form onSubmit={onSubmit} className="surface rounded-lg p-5">
        <label className="block text-sm font-black text-white">
          Judul karakter
          <input
            value={character}
            onChange={(event) => setCharacter(event.target.value)}
            className="focus-ring mt-2 min-h-12 w-full rounded-md border border-white/10 bg-black/30 px-4 text-white"
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="mt-4 rounded-md bg-white px-5 py-3 text-sm font-black text-slate-950 hover:bg-slate-200 disabled:opacity-60"
        >
          {loading ? "Membuat" : "Buat markdown"}
        </button>
      </form>
      <textarea
        value={markdown}
        readOnly
        rows={22}
        className="focus-ring rounded-lg border border-white/10 bg-black/40 p-4 font-mono text-sm leading-6 text-slate-200"
        placeholder="Markdown respect thread akan muncul di sini."
      />
    </div>
  );
}
