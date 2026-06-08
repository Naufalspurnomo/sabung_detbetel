"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "vsbattle-ai-config";

interface AIConfigForm {
  apiUrl: string;
  apiKey: string;
  model: string;
  maxTokens: string;
  temperature: string;
  fb_c_user: string;
  fb_xs: string;
}

const defaults: AIConfigForm = {
  apiUrl: "https://api.groq.com/openai/v1/chat/completions",
  apiKey: "",
  model: "llama-3.3-70b-versatile",
  maxTokens: "4096",
  temperature: "0.2",
  fb_c_user: "",
  fb_xs: "",
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
        // Backward compat: parse old fbCookies format "c_user=...; xs=..."
        if (!parsed.fb_c_user && parsed.fbCookies) {
          const match = parsed.fbCookies.match(/c_user=(\d+);\s*xs=([^\s;]+)/);
          if (match) {
            parsed.fb_c_user = match[1];
            parsed.fb_xs = match[2];
          }
          delete parsed.fbCookies;
        }
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
    <main className="container-shell py-6 sm:py-10">
      <div className="mb-5 sm:mb-7">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500 sm:text-sm">
          Konfigurasi
        </p>
        <h1 className="mt-2 text-2xl font-black text-white sm:text-3xl lg:text-4xl">
          Pengaturan AI
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400 sm:mt-3 sm:text-base">
          Masukkan API key dan URL provider AI kamu. Mendukung semua provider
          OpenAI-compatible: Groq, OpenAI, OpenRouter, atau model lokal.
        </p>
      </div>

      <div className="max-w-xl space-y-4 sm:space-y-5">
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
            🔑 Facebook Cookie (untuk IBR Analyzer)
          </h3>
          <p className="mt-1 text-xs text-slate-400">
            Diperlukan untuk akses postingan grup private IBR. Cookie disimpan
            di browser kamu saja.
          </p>

          {/* c_user */}
          <div className="mt-3">
            <label className="mb-1.5 block text-sm font-semibold text-slate-300">
              c_user
            </label>
            <input
              type="text"
              value={form.fb_c_user}
              onChange={(e) => handleChange("fb_c_user", e.target.value)}
              placeholder="100062168283472"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-600 focus:border-red-400/50 focus:outline-none focus:ring-1 focus:ring-red-400/30"
            />
            <p className="mt-1 text-xs text-slate-500">
              Angka ID Facebook kamu
            </p>
          </div>

          {/* xs */}
          <div className="mt-3">
            <label className="mb-1.5 block text-sm font-semibold text-slate-300">
              xs
            </label>
            <input
              type="password"
              value={form.fb_xs}
              onChange={(e) => handleChange("fb_xs", e.target.value)}
              placeholder="34%3AUx1hUXxLy_ubfQ%3A2%3A1780925289..."
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-600 focus:border-red-400/50 focus:outline-none focus:ring-1 focus:ring-red-400/30"
            />
            <p className="mt-1 text-xs text-slate-500">
              Session token Facebook
            </p>
          </div>

          <p className="mt-3 text-xs text-slate-500">
            Cara ambil: Buka Facebook → F12 → Application → Cookies →
            facebook.com → copy nilai <code className="text-red-300">c_user</code> dan{" "}
            <code className="text-red-300">xs</code>
          </p>

          {/* Status indicator */}
          {form.fb_c_user && form.fb_xs && (
            <p className="mt-2 text-xs text-green-400">
              ✓ Cookie terisi — siap digunakan di IBR Analyzer
            </p>
          )}
        </div>

        {/* Actions — stack on mobile */}
        <div className="flex flex-col gap-3 pt-2 sm:flex-row">
          <button
            onClick={handleSave}
            className="rounded-lg bg-red-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-400 active:scale-95 sm:py-2.5"
          >
            {saved ? "Tersimpan!" : "Simpan"}
          </button>
          <button
            onClick={handleTest}
            disabled={testing || !form.apiKey}
            className="rounded-lg border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/10 active:scale-95 disabled:opacity-40 sm:py-2.5"
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
            <li>• Knowledge base (517 entri) otomatis jadi context AI</li>
            <li>• Mendukung semua provider OpenAI-compatible</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
