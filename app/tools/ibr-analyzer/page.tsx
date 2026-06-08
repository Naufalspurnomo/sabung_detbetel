"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";

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

export default function IbrAnalyzerPage() {
  return (
    <Suspense fallback={<div className="container-shell py-10 text-slate-500">Loading...</div>}>
      <IbrAnalyzerInner />
    </Suspense>
  );
}

// ──────────────────────────────────────────

function IbrAnalyzerInner() {
  const searchParams = useSearchParams();

  // ── State ──
  const [postUrl, setPostUrl] = useState("");
  const [postText, setPostText] = useState("");
  const [inputMode, setInputMode] = useState<"paste" | "url">("paste");
  const [step, setStep] = useState<"input" | "preview" | "result">("input");
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [extractedPost, setExtractedPost] = useState<FbPost | null>(null);

  // ── Auto-fill from bookmarklet query params ──
  useEffect(() => {
    const bkHtml = searchParams.get("html");
    const bkUrl = searchParams.get("url");
    if (bkHtml && bkUrl) {
      setPostUrl(bkUrl);
      setInputMode("url");
      // Auto-extract from bookmarklet
      handleExtractFromHtml(bkUrl, bkHtml);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // ── Extract from pasted HTML ──
  const handleExtractFromHtml = useCallback(async (url: string, html: string) => {
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
        setError(data.error || "Gagal memproses");
        return;
      }
      setExtractedPost(data.post);
      setStep("preview");
    } catch (e) {
      setError("Error: " + (e instanceof Error ? e.message : "Unknown"));
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Handle paste text submission ──
  function handlePasteTextSubmit() {
    const text = postText.trim();
    if (text.length < 20) {
      setError("Teks terlalu pendek. Paste minimal 20 karakter dari postingan Facebook.");
      return;
    }
    setError("");

    // Build a minimal FbPost from pasted text
    const post: FbPost = {
      url: postUrl.trim() || "",
      author: extractAuthor(text),
      text: cleanPastedText(text),
      images: [],
      links: extractLinks(text),
      timestamp: "",
    };
    setExtractedPost(post);
    setStep("preview");
  }

  // ── Handle URL fetch ──
  async function handleUrlFetch() {
    if (!postUrl.trim()) return;

    const fbCookies = getFbCookies();
    if (!fbCookies) {
      setError("Cookie belum diisi. Buka Pengaturan → Facebook Cookie.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/fb-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: postUrl, cookies: fbCookies }),
      });
      const data = await res.json();

      if (!data.ok) {
        setError(data.error || "Gagal mengambil postingan");
        return;
      }

      setExtractedPost(data.post);
      setStep("preview");
    } catch (e) {
      setError("Error: " + (e instanceof Error ? e.message : "Unknown"));
    } finally {
      setLoading(false);
    }
  }

  // ── Step 2: Analyze with AI ──
  async function handleAnalyze() {
    if (!extractedPost) return;

    const aiConfig = getAiConfig();
    if (!aiConfig.apiKey) {
      setError("API key belum diisi. Buka Pengaturan → AI API Key.");
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
      setStep("result");
    } catch (e) {
      setError("Error: " + (e instanceof Error ? e.message : "Unknown"));
    } finally {
      setAnalyzing(false);
    }
  }

  // ── Reset ──
  function handleReset() {
    setStep("input");
    setResult(null);
    setExtractedPost(null);
    setPostUrl("");
    setPostText("");
    setError("");
  }

  // ── Bookmarklet code (desktop only) ──
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

      {/* ═══════════ STEP 1: INPUT ═══════════ */}
      {step === "input" && (
        <>
          {/* Mode Toggle */}
          <div className="mb-5 flex flex-wrap gap-2">
            {(
              [
                ["paste", "📋 Teks Postingan", "Copy-paste dari FB app"],
                ["url", "🔗 URL + Cookie", "Ambil otomatis dari server"],
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

          {/* ─── Paste Text Mode (Primary — works on mobile) ─── */}
          {inputMode === "paste" && (
            <div className="max-w-2xl space-y-3">
              <div className="rounded-lg border border-white/10 bg-gradient-to-br from-red-500/5 to-orange-500/5 p-4">
                <h3 className="text-sm font-bold text-white">📱 Cara ambil dari HP</h3>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                  {[
                    "1. Buka postingan di FB",
                    "2. Klik titik tiga (⋯)",
                    "3. Copy text postingan",
                    "4. Paste di bawah",
                  ].map((s, i) => (
                    <span key={i} className="flex items-center gap-1">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-500/50" />
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <textarea
                value={postText}
                onChange={(e) => {
                  setPostText(e.target.value);
                  setError("");
                }}
                placeholder={`Paste teks postingan di sini...\n\nContoh:\nMenurut kalian Goku vs Saitama siapa yang menang?\nGoku udah multiverse level bro\nSaitama gagal dimensinya sendiri...`}
                className="h-44 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:border-red-400/50 focus:outline-none focus:ring-1 focus:ring-red-400/30 resize-y"
              />

              <input
                type="url"
                value={postUrl}
                onChange={(e) => setPostUrl(e.target.value)}
                placeholder="Link postingan (opsional, untuk referensi)"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:border-red-400/50 focus:outline-none focus:ring-1 focus:ring-red-400/30"
              />

              <div className="flex items-center gap-3">
                <button
                  onClick={handlePasteTextSubmit}
                  disabled={!postText.trim()}
                  className="rounded-lg bg-gradient-to-r from-red-500 to-orange-500 px-6 py-3 text-sm font-bold text-white transition hover:from-red-400 hover:to-orange-400 active:scale-95 disabled:opacity-40"
                >
                  ⚔️ Lanjut Analisis
                </button>
                {postText.length > 0 && (
                  <span className="text-xs text-slate-500">{postText.length} karakter</span>
                )}
              </div>
            </div>
          )}

          {/* ─── URL Mode (Advanced) ─── */}
          {inputMode === "url" && (
            <div className="max-w-2xl space-y-3">
              <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
                <h3 className="text-sm font-bold text-white">🔗 Server Fetch</h3>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                  Server coba ambil langsung dari Facebook. Perlu cookie yang valid.
                  Kadang gagal karena Facebook block IP server.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  type="url"
                  value={postUrl}
                  onChange={(e) => {
                    setPostUrl(e.target.value);
                    setError("");
                  }}
                  placeholder="https://www.facebook.com/groups/IBR/posts/..."
                  className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-600 focus:border-red-400/50 focus:outline-none focus:ring-1 focus:ring-red-400/30"
                  onKeyDown={(e) => e.key === "Enter" && handleUrlFetch()}
                />
                <button
                  onClick={handleUrlFetch}
                  disabled={loading || !postUrl.trim()}
                  className="shrink-0 rounded-lg bg-red-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-400 active:scale-95 disabled:opacity-40"
                >
                  {loading ? "Mengambil..." : "Ambil"}
                </button>
              </div>

              <p className="text-xs text-slate-500">
                Cookie diperlukan. Isi di{" "}
                <a href="/settings" className="text-red-400 hover:underline">
                  Pengaturan
                </a>{" "}
                → Facebook Cookie.
              </p>
            </div>
          )}

          {/* ─── Desktop Bookmarklet (collapsed) ─── */}
          <details className="mt-6 max-w-2xl">
            <summary className="cursor-pointer text-xs text-slate-600 hover:text-slate-400 transition">
              💻 Desktop: Pasang Bookmarklet (sekali setup, tinggal klik)
            </summary>
            <div className="mt-3 rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-orange-500/5 p-4">
              <p className="text-sm text-slate-400 leading-relaxed">
                Bookmarklet = tombol di bookmark bar. Klik di postingan FB manapun
                → data langsung masuk ke sini.
              </p>
              <div className="mt-3 space-y-2">
                {[
                  { n: "1", text: "Drag tombol ke bookmark bar browser" },
                  { n: "2", text: "Buka postingan FB" },
                  { n: "3", text: 'Klik bookmark "Kirim ke DetBetel"' },
                  { n: "4", text: "Halaman ini terbuka otomatis!" },
                ].map((s) => (
                  <div key={s.n} className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-[10px] font-bold text-amber-300">
                      {s.n}
                    </span>
                    {s.text}
                  </div>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <a
                  href={bookmarkletCode}
                  onClick={(e) => e.preventDefault()}
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/plain", bookmarkletCode);
                  }}
                  draggable="true"
                  className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-amber-500/25 transition cursor-grab active:cursor-grabbing select-none"
                >
                  📌 Kirim ke DetBetel
                  <span className="text-[10px] font-normal text-white/70">← drag ↑</span>
                </a>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(bookmarkletCode);
                    alert("Code copied! Buat bookmark baru, paste di kolom URL-nya.");
                  }}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[11px] text-slate-500 hover:bg-white/10 hover:text-slate-300 transition"
                >
                  📋 Copy code
                </button>
              </div>
            </div>
          </details>
        </>
      )}

      {/* ═══════════ STEP 2: PREVIEW ═══════════ */}
      {step === "preview" && extractedPost && (
        <div className="max-w-2xl space-y-4">
          <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-bold text-white">{extractedPost.author}</p>
                {extractedPost.timestamp && (
                  <p className="text-xs text-slate-500">{extractedPost.timestamp}</p>
                )}
              </div>
              {extractedPost.url && (
                <a
                  href={extractedPost.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-red-400 hover:underline truncate max-w-[200px]"
                >
                  Lihat di Facebook →
                </a>
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

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="rounded-lg bg-gradient-to-r from-red-500 to-orange-500 px-8 py-3.5 text-sm font-bold text-white transition hover:from-red-400 hover:to-orange-400 active:scale-[0.98] disabled:opacity-40"
            >
              {analyzing ? "AI sedang menganalisis..." : "⚔️ Analisis Death Battle"}
            </button>
            <button
              onClick={handleReset}
              className="rounded-lg border border-white/10 bg-white/5 px-5 py-3 text-sm text-slate-400 hover:bg-white/10 hover:text-white transition"
            >
              ← Kembali
            </button>
          </div>
        </div>
      )}

      {/* ═══════════ STEP 3: RESULT ═══════════ */}
      {step === "result" && result && (
        <div className="max-w-3xl space-y-4">
          <div className="rounded-lg border border-white/10 bg-white/[0.02] p-5 sm:p-6">
            <h2 className="text-lg font-bold text-white">
              Hasil Analisis — {result.post.author}
            </h2>
            {result.post.url && (
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
            )}

            <div className="prose-invert prose-sm mt-4 max-w-none text-slate-300">
              {result.analysis.split("\n").map((line, i) => {
                if (line.startsWith("# "))
                  return (
                    <h2 key={i} className="mt-6 mb-2 text-lg font-bold text-white">
                      {line.slice(2)}
                    </h2>
                  );
                if (line.startsWith("## "))
                  return (
                    <h3 key={i} className="mt-5 mb-1.5 text-base font-bold text-white">
                      {line.slice(3)}
                    </h3>
                  );
                if (line.startsWith("### "))
                  return (
                    <h4 key={i} className="mt-4 mb-1 text-sm font-bold text-white">
                      {line.slice(4)}
                    </h4>
                  );
                if (line.startsWith("**") && line.endsWith("**"))
                  return (
                    <p key={i} className="mt-3 font-bold text-white">
                      {line.replace(/\*\*/g, "")}
                    </p>
                  );
                if (line.startsWith("- "))
                  return (
                    <li key={i} className="ml-4 text-sm">
                      {line.slice(2)}
                    </li>
                  );
                if (line.trim() === "") return <br key={i} />;
                return (
                  <p key={i} className="text-sm leading-relaxed">
                    {line}
                  </p>
                );
              })}
            </div>
          </div>

          <button
            onClick={handleReset}
            className="rounded-lg border border-white/10 bg-white/5 px-5 py-2.5 text-sm text-slate-400 hover:bg-white/10 hover:text-white transition"
          >
            ← Analisis postingan lain
          </button>
        </div>
      )}

      {/* ═══════════ ERROR ═══════════ */}
      {error && (
        <div className="mt-4 max-w-2xl rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}
    </main>
  );
}

// ──────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────

/** Try to extract author name from pasted text */
function extractAuthor(text: string): string {
  // First line might be the author name
  const lines = text.split("\n").filter((l) => l.trim());
  if (lines.length > 0 && lines[0].length < 50 && !lines[0].includes(".")) {
    return lines[0].trim();
  }
  return "Unknown";
}

/** Clean up pasted text from Facebook copy artifacts */
function cleanPastedText(text: string): string {
  return text
    .replace(/\n{3,}/g, "\n\n")
    .replace(/^(Like|Comment|Share|Suka|Komentar|Bagikan).*$/gim, "")
    .replace(/^\d+[hdms]\s*$/gim, "") // "2h", "3d", etc.
    .replace(/^·\s*$/gm, "")
    .replace(/^See more$/gim, "")
    .replace(/^Lihat selengkapnya$/gim, "")
    .replace(/^All reactions:.*$/gim, "")
    .replace(/^\d+\s*(reactions?|comments?|shares?|komentar|bagikan).*$/gim, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Extract URLs from pasted text */
function extractLinks(text: string): string[] {
  const matches = text.matchAll(/(https?:\/\/[^\s<>\"']+)/gi);
  return [...new Set([...matches].map((m) => m[1]))];
}

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
