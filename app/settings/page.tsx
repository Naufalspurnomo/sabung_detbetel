"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "vsbattle-ai-config";

interface AIConfigForm {
  apiUrl: string;
  apiKey: string;
  model: string;
  maxTokens: string;
  temperature: string;
  fbCookies: string;
}

const defaults: AIConfigForm = {
  apiUrl: "https://api.groq.com/openai/v1/chat/completions",
  apiKey: "",
  model: "llama-3.3-70b-versatile",
  maxTokens: "4096",
  temperature: "0.2",
  fbCookies: "",
};

export default function SettingsPage() {
  const [form, setForm] = useState<AIConfigForm>(defaults);
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setForm({ ...defaults, ...parsed });
      }
    } catch {
      // ignore
    }
  }, []);

  function handleChange(field: keyof AIConfigForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
    setTestResult(null);
  }

  function handleSave() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleTest() {
    setTesting(true);
    setTestResult(null);

    try {
      const res = await fetch("/api/settings/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiUrl: form.apiUrl,
          apiKey: form.apiKey,
          model: form.model,
        }),
      });

      const data = await res.json();
      setTestResult({
        ok: data.ok,
        message: data.ok
          ? `Terhubung! Model: ${data.model || form.model}`
          : `Gagal: ${data.error || "Unknown error"}`,
      });
    } catch (err) {
      setTestResult({
        ok: false,
        message: `Error: ${err instanceof Error ? err.message : "Network error"}`,
      });
    } finally {
      setTesting(false);
    }
  }

  return (
    <main className="container-shell py-10">
      <div className="mb-7">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">
          Konfigurasi
        </p>
        <h1 className="mt-2 text-4xl font-black text-white">
          Pengaturan AI
        </h1>
        <p className="mt-3 max-w-2xl text-slate-400">
          Masukkan API key dan URL provider AI kamu. Mendukung semua provider
          OpenAI-compatible: Groq, OpenAI, OpenRouter, atau model lokal.
        </p>
      </div>

      <div className="max-w-xl space-y-5">
        {/* API URL */}
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-300">
            API URL
          </label>
          <input
            type="url"
            value={form.apiUrl}
            onChange={(e) => handleChange("apiUrl", e.target.value)}
            placeholder="https://api.groq.com/openai/v1/chat/completions"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-600 focus:border-red-400/50 focus:outline-none focus:ring-1 focus:ring-red-400/30"
          />
          <p className="mt-1 text-xs text-slate-500">
            Endpoint chat/completions. Contoh: Groq, OpenAI, OpenRouter, LM
            Studio, Ollama.
          </p>
        </div>

        {/* API Key */}
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-300">
            API Key
          </label>
          <input
            type="password"
            value={form.apiKey}
            onChange={(e) => handleChange("apiKey", e.target.value)}
            placeholder="gsk_... atau sk-..."
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-600 focus:border-red-400/50 focus:outline-none focus:ring-1 focus:ring-red-400/30"
          />
          <p className="mt-1 text-xs text-slate-500">
            Disimpan di browser kamu saja, tidak dikirim ke server kami.
          </p>
        </div>

        {/* Model */}
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-300">
            Model
          </label>
          <input
            type="text"
            value={form.model}
            onChange={(e) => handleChange("model", e.target.value)}
            placeholder="llama-3.3-70b-versatile"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-600 focus:border-red-400/50 focus:outline-none focus:ring-1 focus:ring-red-400/30"
          />
          <p className="mt-1 text-xs text-slate-500">
            Nama model sesuai provider. Contoh: gpt-4o, llama-3.3-70b-versatile,
            deepseek-r1.
          </p>
        </div>

        {/* Advanced */}
        <details className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
          <summary className="cursor-pointer text-sm font-semibold text-slate-400 hover:text-slate-200">
            Pengaturan Lanjutan
          </summary>
          <div className="mt-4 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-300">
                Max Tokens
              </label>
              <input
                type="number"
                value={form.maxTokens}
                onChange={(e) => handleChange("maxTokens", e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-red-400/50 focus:outline-none focus:ring-1 focus:ring-red-400/30"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-300">
                Temperature
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="2"
                value={form.temperature}
                onChange={(e) => handleChange("temperature", e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-red-400/50 focus:outline-none focus:ring-1 focus:ring-red-400/30"
              />
            </div>
          </div>
        </details>

        {/* Facebook Cookie — untuk IBR Analyzer */}
        <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4">
          <h3 className="text-sm font-bold text-blue-300">
            Facebook Cookie (untuk IBR Analyzer)
          </h3>
          <p className="mt-1 text-xs text-slate-400">
            Diperlukan untuk akses postingan grup private IBR. Cookie disimpan
            di browser kamu saja.
          </p>
          <label className="mt-3 mb-1.5 block text-sm font-semibold text-slate-300">
            c_user dan xs
          </label>
          <input
            type="password"
            value={form.fbCookies}
            onChange={(e) => handleChange("fbCookies", e.target.value)}
            placeholder="c_user=123456789; xs=abcdef%3D..."
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-600 focus:border-red-400/50 focus:outline-none focus:ring-1 focus:ring-red-400/30"
          />
          <p className="mt-1.5 text-xs text-slate-500">
            Cara ambil: Buka Facebook → F12 → Application → Cookies →
            facebook.com → copy nilai <code className="text-red-300">c_user</code> dan{" "}
            <code className="text-red-300">xs</code>, format:{" "}
            <code className="text-red-300">c_user=...; xs=...</code>
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={handleSave}
            className="rounded-lg bg-red-500 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-red-400"
          >
            {saved ? "Tersimpan!" : "Simpan"}
          </button>
          <button
            onClick={handleTest}
            disabled={testing || !form.apiKey}
            className="rounded-lg border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/10 disabled:opacity-40"
          >
            {testing ? "Menguji..." : "Tes Koneksi"}
          </button>
        </div>

        {/* Test Result */}
        {testResult && (
          <div
            className={`rounded-lg border px-4 py-3 text-sm ${
              testResult.ok
                ? "border-green-500/30 bg-green-500/10 text-green-300"
                : "border-red-500/30 bg-red-500/10 text-red-300"
            }`}
          >
            {testResult.message}
          </div>
        )}

        {/* Info Box */}
        <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4">
          <h3 className="text-sm font-bold text-blue-300">
            Cara Kerja
          </h3>
          <ul className="mt-2 space-y-1 text-xs text-slate-400">
            <li>• API key disimpan di localStorage browser kamu</li>
            <li>• Saat analisis matchup, key dikirim via header ke server</li>
            <li>• Server pakai key kamu untuk panggil AI provider</li>
            <li>• Knowledge base (298 entri) otomatis jadi context AI</li>
            <li>• Mendukung semua provider OpenAI-compatible</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
