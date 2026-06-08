"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";

// ──────────────────────────────────────────
// Types
// ──────────────────────────────────────────

interface FbPost {
  url: string;
  author: string;
  text: string;
  images: string[];
  links: string[];
  timestamp: string;
}

interface AnalysisResult {
  post: FbPost;
  analysis: string;
}

// ──────────────────────────────────────────
// Main wrapper (Suspense boundary for useSearchParams)
// ──────────────────────────────────────────

export default function IbrAnalyzerPage() {
  return (
    <Suspense fallback={<div className="container-shell py-10 text-slate-500">Loading...</div>}>
      <IbrAnalyzerInner />
    </Suspense>
  );
}

// ──────────────────────────────────────────
// Inner component
// ──────────────────────────────────────────

function IbrAnalyzerInner() {
  const searchParams = useSearchParams();

  const [postUrl, setPostUrl] = useState("");
  const [pastedHtml, setPastedHtml] = useState("");
  const [inputMode, setInputMode] = useState<"url" | "paste" | "bookmarklet">("url");
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [extractedPost, setExtractedPost] = useState<FbPost | null>(null);
  const [fetchMethod, setFetchMethod] = useState<"fetched" | "pasted" | null>(null);

  // ── Auto-fill from bookmarklet query params ──
  useEffect(() => {
    const bkHtml = searchParams.get("html");
    const bkUrl = searchParams.get("url");
    if (bkHtml && bkUrl) {
      setPostUrl(bkUrl);
      setPastedHtml(bkHtml);
      setInputMode("bookmarklet");
      // Auto-extract
      handleBookmarkletExtract(bkUrl, bkHtml);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // ── Extract from bookmarklet data ──
  const handleBookmarkletExtract = useCallback(async (url: string, html: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/fb-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, cookies: "", html }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error || "Gagal memproses HTML");
        return;
      }
      setExtractedPost(data.post);
      setFetchMethod("pasted");
    } catch (e) {
      setError("Error: " + (e instanceof Error ? e.message : "Unknown"));
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Step 1: Extract post content ──
  async function handleExtract() {
    if (!postUrl.trim()) return;

    if (inputMode === "paste" && pastedHtml.length < 100) {
      setError("Paste HTML halaman Facebook minimal 100 karakter.");
      return;
    }

    if (inputMode === "url") {
      const fbCookies = getFbCookies();
      if (!fbCookies) {
        setError("Facebook cookie belum diisi. Buka Pengaturan untuk mengisi cookie.");
        return;
      }
    }

    setLoading(true);
    setError("");

    try {
      const body: Record<string, string> = { url: postUrl };
      if (inputMode === "paste") body.html = pastedHtml;
      else body.cookies = getFbCookies() || "";

      const res = await fetch("/api/fb-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!data.ok) {
        if (data.fallback) {
          setError(
            `${data.error}\n\n👉 Coba mode "Bookmarklet" — sekali setup, tinggal klik di postingan FB.`
          );
          return;
        }
        setError(data.error || "Gagal mengambil postingan");
        return;
      }

      setExtractedPost(data.post);
      setFetchMethod(data.method);
    } catch (e) {
      setError("Network error: " + (e instanceof Error ? e.message : "Unknown"));
    } finally {
      setLoading(false);
    }
  }

  // ── Step 2: Analyze with AI ──
  async function handleAnalyze() {
    if (!extractedPost) return;

    const aiConfig = getAiConfig();
    if (!aiConfig.apiKey) {
      setError("API key belum diisi. Buka Pengaturan untuk mengisi API key.");
      return;
    }

    setAnalyzing(true);
    setError("");

    try {
      const res = await fetch("/api/ibr-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          post: extractedPost,
          apiKey: aiConfig.apiKey,
          baseUrl: aiConfig.baseUrl,
          model: aiConfig.model,
        }),
      });
      const data = await res.json();

      if (!data.ok) {
        setError(data.error || "Gagal analisis");
        return;
      }

      setResult({ post: extractedPost, analysis: data.analysis });
    } catch (e) {
      setError("Network error: " + (e instanceof Error ? e.message : "Unknown"));
    } finally {
      setAnalyzing(false);
    }
  }

  // ── Bookmarklet JS code ──
  const bookmarkletCode = `javascript:void(function(){var h=document.documentElement.outerHTML;var u=location.href;window.location.href='https://detbetel.netlify.app/tools/ibr-analyzer?url='+encodeURIComponent(u)+'&html='+encodeURIComponent(h)}())`;

  return (
    <main className="container-shell py-6 sm:py-10">
      {/* Header */}
      <div className="mb-5 sm:mb-7">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500 sm:text-sm">
          IBR — Infinite Battle Reborn
        </p>
        <h1 className="mt-2 text-2xl font-black text-white sm:text-3xl lg:text-4xl">
          Analisis Postingan Grup
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400 sm:mt-3 sm:text-base">
          Ambil postingan dari grup Facebook IBR, lalu AI akan menganalisisnya
          dengan data VS Battles Wiki.
        </p>
      </div>

      {/* ─── Mode Toggle ─── */}
      <div className="mb-5 flex flex-wrap gap-2">
        {(
          [
            ["url", "🔗 URL", "Server ambil dari Facebook"],
            ["bookmarklet", "🔖 Bookmarklet", "Sekali setup, tinggal klik"],
            ["paste", "📋 Manual", "Copy-paste HTML sendiri"],
          ] as const
        ).map(([mode, label, desc]) => (
          <button
            key={mode}
            onClick={() => {
              setInputMode(mode);
              setError("");
            }}
            className={`group relative rounded-lg px-4 py-2.5 text-sm font-bold transition ${
              inputMode === mode
                ? "bg-red-500 text-white shadow-lg shadow-red-500/20"
                : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200"
            }`}
          >
            {label}
            <span className="pointer-events-none absolute -bottom-7 left-1/2 z-10 whitespace-nowrap rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400 opacity-0 shadow-lg transition group-hover:opacity-100 -translate-x-1/2">
              {desc}
            </span>
          </button>
        ))}
      </div>

      {/* ─── URL Mode ─── */}
      {inputMode === "url" && (
        <div className="max-w-2xl">
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="url"
              value={postUrl}
              onChange={(e) => { setPostUrl(e.target.value); setError(""); }}
              placeholder="https://www.facebook.com/groups/IBR/posts/..."
              className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-600 focus:border-red-400/50 focus:outline-none focus:ring-1 focus:ring-red-400/30"
              onKeyDown={(e) => e.key === "Enter" && handleExtract()}
            />
            <button
              onClick={handleExtract}
              disabled={loading || !postUrl.trim()}
              className="shrink-0 rounded-lg bg-red-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-400 active:scale-95 disabled:opacity-40"
            >
              {loading ? "Mengambil..." : "Ambil Postingan"}
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Cookie Facebook diperlukan untuk grup private. Isi di{" "}
            <a href="/settings" className="text-red-400 hover:underline">Pengaturan</a>.
            {" "}Jika gagal, coba mode <strong className="text-slate-400">Bookmarklet</strong>.
          </p>
        </div>
      )}

      {/* ─── Bookmarklet Mode ─── */}
      {inputMode === "bookmarklet" && (
        <div className="max-w-2xl space-y-4">
          {/* Setup Card */}
          <div className="rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-orange-500/5 p-5">
            <h3 className="text-base font-bold text-amber-300">
              🔖 Bookmarklet — sekali setup, selamanya pakai
            </h3>
            <p className="mt-1.5 text-sm text-slate-400 leading-relaxed">
              Bookmarklet adalah tombol kecil di bookmark bar yang langsung
              kirim postingan FB ke app ini. Gak perlu copas, gak perlu cookie.
            </p>

            {/* Steps */}
            <div className="mt-4 space-y-3">
              {[
                { n: "1", text: "Drag tombol di bawah ke bookmark bar browser lo", icon: "⬇️" },
                { n: "2", text: "Buka postingan FB yang mau dianalisis", icon: "📱" },
                { n: "3", text: 'Klik bookmark "Kirim ke DetBetel" di bookmark bar', icon: "🖱️" },
                { n: "4", text: "Halaman ini terbuka otomatis dengan data terisi!", icon: "✨" },
              ].map((step) => (
                <div
                  key={step.n}
                  className="flex items-start gap-3 rounded-lg bg-white/5 px-3 py-2.5"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-xs font-bold text-amber-300">
                    {step.n}
                  </span>
                  <span className="text-sm text-slate-300">
                    {step.icon} {step.text}
                  </span>
                </div>
              ))}
            </div>

            {/* Drag button */}
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <a
                href={bookmarkletCode}
                onClick={(e) => e.preventDefault()}
                onDragStart={(e) => {
                  // Allow drag
                  e.dataTransfer.setData("text/plain", bookmarkletCode);
                }}
                draggable="true"
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-amber-500/25 transition hover:shadow-amber-500/40 cursor-grab active:cursor-grabbing select-none"
              >
                📌 Kirim ke DetBetel
                <span className="text-xs font-normal text-white/70">
                  ← drag ke bookmark bar ↑
                </span>
              </a>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(bookmarkletCode);
                  alert("Code copied! Buat bookmark baru, paste di kolom URL.");
                }}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-xs text-slate-400 hover:bg-white/10 hover:text-slate-200 transition"
              >
                📋 Copy code
              </button>
            </div>

            <p className="mt-3 text-[11px] text-slate-600">
              💡 Bookmark bar gak muncul? Tekan <kbd className="rounded bg-white/10 px-1 py-0.5 text-slate-400">Ctrl+Shift+B</kbd> di Chrome/Edge
            </p>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-xs text-slate-600">atau manual paste</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          {/* Manual paste fallback */}
          <div>
            <input
              type="url"
              value={postUrl}
              onChange={(e) => { setPostUrl(e.target.value); setError(""); }}
              placeholder="https://www.facebook.com/groups/IBR/posts/..."
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-600 focus:border-red-400/50 focus:outline-none focus:ring-1 focus:ring-red-400/30"
            />
            <textarea
              value={pastedHtml}
              onChange={(e) => { setPastedHtml(e.target.value); setError(""); }}
              placeholder="Paste HTML postingan di sini (View Page Source → Ctrl+A → Ctrl+C → Ctrl+V)"
              className="mt-2 h-32 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:border-red-400/50 focus:outline-none focus:ring-1 focus:ring-red-400/30"
            />
            <button
              onClick={handleExtract}
              disabled={loading || !postUrl.trim()}
              className="mt-2 rounded-lg bg-red-500 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-red-400 active:scale-95 disabled:opacity-40"
            >
              {loading ? "Memproses..." : "Proses"}
            </button>
          </div>
        </div>
      )}

      {/* ─── Paste Mode ─── */}
      {inputMode === "paste" && (
        <div className="max-w-2xl space-y-3">
          <input
            type="url"
            value={postUrl}
            onChange={(e) => { setPostUrl(e.target.value); setError(""); }}
            placeholder="https://www.facebook.com/groups/IBR/posts/..."
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-600 focus:border-red-400/50 focus:outline-none focus:ring-1 focus:ring-red-400/30"
          />
          <textarea
            value={pastedHtml}
            onChange={(e) => { setPastedHtml(e.target.value); setError(""); }}
            placeholder={`Cara pakai:\n1. Buka postingan Facebook di browser\n2. Tekan Ctrl+U (view source)\n3. Ctrl+A → Ctrl+C\n4. Paste di sini`}
            className="h-40 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:border-red-400/50 focus:outline-none focus:ring-1 focus:ring-red-400/30"
          />
          <div className="flex items-center gap-3">
            <button
              onClick={handleExtract}
              disabled={loading || !postUrl.trim()}
              className="rounded-lg bg-red-500 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-red-400 active:scale-95 disabled:opacity-40"
            >
              {loading ? "Memproses..." : "Proses HTML"}
            </button>
            <span className="text-xs text-slate-500">
              {pastedHtml.length > 0 ? `${pastedHtml.length} karakter` : ""}
            </span>
          </div>
        </div>
      )}

      {/* ─── Error ─── */}
      {error && (
        <div className="mt-4 max-w-2xl rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300 whitespace-pre-wrap">
          {error}
        </div>
      )}

      {/* ─── Extracted Post Preview ─── */}
      {extractedPost && !result && (
        <div className="mt-6 max-w-2xl space-y-4 sm:mt-8">
          <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-bold text-white">{extractedPost.author}</p>
                <p className="text-xs text-slate-500">{extractedPost.timestamp}</p>
              </div>
              {fetchMethod && (
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    fetchMethod === "fetched"
                      ? "bg-emerald-500/15 text-emerald-400"
                      : "bg-amber-500/15 text-amber-400"
                  }`}
                >
                  {fetchMethod === "fetched" ? "✓ Server fetch" : "📋 Pasted HTML"}
                </span>
              )}
            </div>

            <div className="mt-3 max-h-48 overflow-y-auto rounded-lg bg-black/20 p-3">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
                {extractedPost.text || "(Tidak ada teks)"}
              </p>
            </div>

            {extractedPost.images.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {extractedPost.images.slice(0, 4).map((img, i) => (
                  <div
                    key={i}
                    className="h-16 w-16 overflow-hidden rounded-lg bg-white/5 sm:h-20 sm:w-20"
                  >
                    <img
                      src={img}
                      alt={`Image ${i + 1}`}
                      className="h-full w-full object-cover"
                      onError={(e) => (e.currentTarget.style.display = "none")}
                    />
                  </div>
                ))}
                {extractedPost.images.length > 4 && (
                  <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-white/5 text-xs text-slate-500 sm:h-20 sm:w-20">
                    +{extractedPost.images.length - 4}
                  </div>
                )}
              </div>
            )}

            {extractedPost.links.length > 0 && (
              <div className="mt-3 space-y-1">
                <p className="text-xs font-bold text-slate-500 uppercase">Link ditemukan:</p>
                {extractedPost.links.slice(0, 3).map((link, i) => (
                  <a
                    key={i}
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block truncate text-xs text-red-400 hover:underline"
                  >
                    {link}
                  </a>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="w-full rounded-lg bg-gradient-to-r from-red-500 to-orange-500 py-3.5 text-sm font-bold text-white transition hover:from-red-400 hover:to-orange-400 active:scale-[0.98] disabled:opacity-40 sm:w-auto sm:px-8"
          >
            {analyzing ? "AI sedang menganalisis..." : "⚔️ Analisis Death Battle"}
          </button>
        </div>
      )}

      {/* ─── Analysis Result ─── */}
      {result && (
        <div className="mt-6 max-w-3xl space-y-4 sm:mt-8">
          <div className="rounded-lg border border-white/10 bg-white/[0.02] p-5 sm:p-6">
            <h2 className="text-lg font-bold text-white">
              Hasil Analisis — {result.post.author}
            </h2>
            <div className="mt-1 text-xs text-slate-500">
              Sumber:{" "}
              <a
                href={result.post.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-red-400 hover:underline"
              >
                Postingan Facebook
              </a>
            </div>

            <div className="prose-invert prose-sm mt-4 max-w-none text-slate-300">
              {result.analysis.split("\n").map((line, i) => {
                if (line.startsWith("# ")) return <h2 key={i} className="mt-6 mb-2 text-lg font-bold text-white">{line.slice(2)}</h2>;
                if (line.startsWith("## ")) return <h3 key={i} className="mt-5 mb-1.5 text-base font-bold text-white">{line.slice(3)}</h3>;
                if (line.startsWith("### ")) return <h4 key={i} className="mt-4 mb-1 text-sm font-bold text-white">{line.slice(4)}</h4>;
                if (line.startsWith("**") && line.endsWith("**")) return <p key={i} className="mt-3 font-bold text-white">{line.replace(/\*\*/g, "")}</p>;
                if (line.startsWith("- ")) return <li key={i} className="ml-4 text-sm">{line.slice(2)}</li>;
                if (line.trim() === "") return <br key={i} />;
                return <p key={i} className="text-sm leading-relaxed">{line}</p>;
              })}
            </div>
          </div>

          <button
            onClick={() => {
              setResult(null);
              setExtractedPost(null);
              setPostUrl("");
              setPastedHtml("");
            }}
            className="rounded-lg border border-white/10 bg-white/5 px-5 py-2.5 text-sm text-slate-400 hover:bg-white/10 hover:text-white transition"
          >
            ← Analisis postingan lain
          </button>
        </div>
      )}
    </main>
  );
}

// ──────────────────────────────────────────
// Helpers (read from localStorage)
// ──────────────────────────────────────────

function getFbCookies(): string | null {
  if (typeof window === "undefined") return null;
  const c_user = localStorage.getItem("fb_c_user");
  const xs = localStorage.getItem("fb_xs");
  if (c_user && xs) return `c_user=${c_user}; xs=${xs}`;
  const legacy = localStorage.getItem("fbCookies");
  if (legacy) return legacy;
  return null;
}

function getAiConfig(): { apiKey: string; baseUrl: string; model: string } {
  if (typeof window === "undefined")
    return { apiKey: "", baseUrl: "", model: "" };
  return {
    apiKey: localStorage.getItem("vsb_apiKey") || "",
    baseUrl: localStorage.getItem("vsb_baseUrl") || "",
    model: localStorage.getItem("vsb_model") || "",
  };
}
