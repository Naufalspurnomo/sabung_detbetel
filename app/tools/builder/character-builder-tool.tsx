"use client";

import { FormEvent, useState } from "react";

export function CharacterBuilderTool() {
  const [name, setName] = useState("Astra Prime");
  const [series, setSeries] = useState("Original");
  const [description, setDescription] = useState("");
  const [feats, setFeats] = useState("");
  const [profile, setProfile] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const response = await fetch("/api/tools/character-builder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, series, description, feats })
    });
    const payload = (await response.json()) as { profile?: string };
    setProfile(payload.profile ?? "");
    setLoading(false);
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
      <form onSubmit={onSubmit} className="surface space-y-4 rounded-lg p-5">
        <label className="block text-sm font-black text-white">
          Nama
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="focus-ring mt-2 min-h-12 w-full rounded-md border border-white/10 bg-black/30 px-4 text-white"
          />
        </label>
        <label className="block text-sm font-black text-white">
          Seri
          <input
            value={series}
            onChange={(event) => setSeries(event.target.value)}
            className="focus-ring mt-2 min-h-12 w-full rounded-md border border-white/10 bg-black/30 px-4 text-white"
          />
        </label>
        <label className="block text-sm font-black text-white">
          Deskripsi
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={4}
            className="focus-ring mt-2 w-full rounded-md border border-white/10 bg-black/30 p-4 text-white"
          />
        </label>
        <label className="block text-sm font-black text-white">
          Feat
          <textarea
            value={feats}
            onChange={(event) => setFeats(event.target.value)}
            rows={5}
            className="focus-ring mt-2 w-full rounded-md border border-white/10 bg-black/30 p-4 text-white"
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-white px-5 py-3 text-sm font-black text-slate-950 hover:bg-slate-200 disabled:opacity-60"
        >
          {loading ? "Membuat" : "Buat profil"}
        </button>
      </form>
      <textarea
        value={profile}
        readOnly
        rows={28}
        className="focus-ring rounded-lg border border-white/10 bg-black/40 p-4 font-mono text-sm leading-6 text-slate-200"
        placeholder="Draft wiki akan muncul di sini."
      />
    </div>
  );
}
