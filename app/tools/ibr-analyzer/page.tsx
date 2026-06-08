"use client";

import { useState } from "react";

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
// Component
// ──────────────────────────────────────────

export default function IbrAnalyzerPage() {
  const [postUrl, setPostUrl] = useState("");
  const [pastedHtml, setPastedHtml] = useState("");
  const [inputMode, setInputMode] = useState<"url" | "paste">("url");
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [extractedPost, setExtractedPost] = useState<FbPost | null>(null);
  const [fetchMethod, setFetchMethod] = useState<"fetched" | "pasted" | null>(null);

  // Step 1: Extract post content
  async function handleExtract() {
    if (!postUrl.trim()) return;

    // In paste mode, need HTML
    if (inputMode === "paste" && pastedHtml.length < 100) {
      setError("Paste HTML halaman Facebook minimal 100 karakter.");
      return;
    }

    // In URL mode, need cookies
    if (inputMode === "url") {
      const fbCookies = getFbCookies();
      if (!fbCookies) {
        setError(
          "Facebook cookie belum diisi. Buka halaman Pengaturan untuk mengisi cookie Facebook kamu."
        );
        return;
      }
    }

    setLoading(true);
    setError("");
    setExtractedPost(null);
    setResult(null);

    try {
      const body: Record<string, string> = {
        url: postUrl.trim(),
      };

      if (inputMode === "url") {
        body.cookies = getFbCookies() || "";
      } else {
        body.html = pastedHtml;
      }

      const res = await fetch("/api/fb-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        // If server fetch failed with fallback flag, suggest paste mode
        if (data.fallback && inputMode === "url") {
          setError(
            `${data.error}\n\n👉 Coba mode "Paste HTML" di bawah — buka postingan di browser HP/komputer, Ctrl+A → Ctrl+C, lalu paste di kolom yang tersedia.`
          );
          return;
        }
        setError(data.error || "Gagal mengambil postingan");
        return;
      }

      setExtractedPost(data.post);
      setFetchMethod(data.method || "fetched");
    } catch (err) {
      setError(
        `Network error: ${err instanceof Error ? err.message : "Unknown"}`
      );
    } finally {
      setLoading(false);
    }
  }

  // Step 2: AI Analysis
  async function handleAnalyze() {
    if (!extractedPost) return;

    const config = getAiConfig();
    if (!config) {
      setError(
        "API key belum diisi. Buka halaman Pengaturan untuk mengkonfigurasi AI."
      );
      return;
    }

    setAnalyzing(true);
    setError("");

    try {
      const res = await fetch("/api/fb-post/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          post: extractedPost,
          config,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setError(data.error || "Gagal menganalisis postingan");
        return;
      }

      setResult({
        post: extractedPost,
        analysis: data.analysis,
      });
    } catch (err) {
      setError(
        `Network error: ${err instanceof Error ? err.message : "Unknown"}`
      );
    } finally {
      setAnalyzing(false);
    }
  }

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
          Paste link postingan dari grup Facebook IBR. AI akan membaca teks,
          gambar, dan link dalam postingan, lalu memberikan analisis Death Battle
          berbasis data VS Battles Wiki.
        </p>
      </div>

      {/* Mode Toggle */}
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setInputMode("url")}
          className={`rounded-lg px-4 py-2 text-sm font-bold transition ${
            inputMode === "url"
              ? "bg-red-500 text-white"
              : "bg-white/5 text-slate-400 hover:bg-white/10"
          }`}
        >
          🔗 Ambil via URL
        </button>
        <button
          onClick={() => setInputMode("paste")}
          className={`rounded-lg px-4 py-2 text-sm font-bold transition ${
            inputMode === "paste"
              ? "bg-red-500 text-white"
              : "bg-white/5 text-slate-400 hover:bg-white/10"
          }`}
        >
          📋 Paste HTML
        </button>
      </div>

      {/* Input Form */}
      <div className="max-w-2xl">
        {/* URL Input (always shown) */}
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
            onKeyDown={(e) => e.key === "Enter" && handleExtract()}
          />
          <button
            onClick={handleExtract}
            disabled={loading || !postUrl.trim()}
            className="shrink-0 rounded-lg bg-red-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-400 active:scale-95 disabled:opacity-40"
          >
            {loading ? "Mengambil..." : inputMode === "url" ? "Ambil Postingan" : "Proses HTML"}
          </button>
        </div>

        {/* Paste HTML textarea (only in paste mode) */}
        {inputMode === "paste" && (
          <div className="mt-3">
            <textarea
              value={pastedHtml}
              onChange={(e) => {
                setPastedHtml(e.target.value);
                setError("");
              }}
              placeholder={`Cara pakai:
1. Buka postingan Facebook di browser HP/komputer
2. Tekan Ctrl+A (select all) atau Select All di HP
3. Tekan Ctrl+C (copy)
4. Paste di sini (Ctrl+V)

Atau kalau mau lebih akurat:
1. Klik kanan → View Page Source
2. Ctrl+A → Ctrl+C
3. Paste di sini`}
              className="h-40 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:border-red-400/50 focus:outline-none focus:ring-1 focus:ring-red-400/30"
            />
            <p className="mt-1 text-xs text-slate-500">
              {pastedHtml.length > 0
                ? `${pastedHtml.length} karakter terpaste`
                : "Paste isi halaman postingan Facebook di sini"}
            </p>
          </div>
        )}

        {/* Info for URL mode */}
        {inputMode === "url" && (
          <p className="mt-2 text-xs text-slate-500">
            Cookie Facebook diperlukan untuk akses grup private. Isi di{" "}
            <a href="/settings" className="text-red-400 hover:underline">
              Pengaturan
            </a>
            . Jika gagal, coba mode <strong className="text-slate-400">Paste HTML</strong>.
          </p>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mt-4 max-w-2xl rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300 sm:mt-5 whitespace-pre-wrap">
          {error}
        </div>
      )}

      {/* Extracted Post Preview */}
      {extractedPost && !result && (
        <div className="mt-6 max-w-2xl space-y-4 sm:mt-8 sm:space-y-5">
          <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-bold text-white">
                  {extractedPost.author}
                </p>
                <p className="text-xs text-slate-500">
                  {extractedPost.timestamp}
                  {fetchMethod === "pasted" && (
                    <span className="ml-2 text-green-400">✓ via paste</span>
                  )}
                </p>
              </div>
              <a
                href={extractedPost.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-red-400 hover:underline"
              >
                Buka di FB →
              </a>
            </div>

            {/* Text */}
            {extractedPost.text && (
              <div className="mt-4 rounded-md bg-black/30 p-3 sm:p-4">
                <p className="whitespace-pre-wrap break-words text-sm text-slate-300">
                  {extractedPost.text}
                </p>
              </div>
            )}

            {/* Images */}
            {extractedPost.images.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                  Gambar ({extractedPost.images.length})
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {extractedPost.images.slice(0, 6).map((img, i) => (
                    <div
                      key={i}
                      className="aspect-square overflow-hidden rounded-md border border-white/10 bg-black/30"
                    >
                      {img.includes("mbasic.facebook.com/photo.php") ? (
                        <div className="flex h-full items-center justify-center p-2 text-center text-xs text-slate-500">
                          Foto FB (klik untuk lihat)
                        </div>
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={img}
                          alt={`Image ${i + 1}`}
                          className="h-full w-full object-cover"
                          crossOrigin="anonymous"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Links */}
            {extractedPost.links.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                  Link dalam postingan ({extractedPost.links.length})
                </p>
                <div className="space-y-1">
                  {extractedPost.links.slice(0, 5).map((link, i) => (
                    <a
                      key={i}
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block truncate text-xs text-blue-400 hover:underline"
                    >
                      {link}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Summary */}
            <div className="mt-4 rounded-md border border-blue-500/20 bg-blue-500/5 px-3 py-2">
              <p className="text-xs text-slate-400">
                Terdeteksi: <strong className="text-slate-300">{extractedPost.text.length}</strong> karakter teks,{" "}
                <strong className="text-slate-300">{extractedPost.images.length}</strong> gambar,{" "}
                <strong className="text-slate-300">{extractedPost.links.length}</strong> link
              </p>
            </div>
          </div>

          {/* Analyze Button */}
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="w-full rounded-lg bg-red-500 py-3.5 text-sm font-black text-white transition hover:bg-red-400 active:scale-[0.98] disabled:opacity-40"
          >
            {analyzing
              ? "AI sedang menganalisis..."
              : "Analisis dengan AI (Death Battle)"}
          </button>
        </div>
      )}

      {/* AI Analysis Result */}
      {result && (
        <div className="mt-6 max-w-3xl space-y-4 sm:mt-8 sm:space-y-5">
          {/* Post Summary */}
          <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4 sm:p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Postingan dari {result.post.author}
            </p>
            <p className="mt-2 line-clamp-3 text-sm text-slate-400">
              {result.post.text.substring(0, 300)}
              {result.post.text.length > 300 && "..."}
            </p>
            <div className="mt-2 flex gap-3 text-xs text-slate-500">
              <span>{result.post.images.length} gambar</span>
              <span>{result.post.links.length} link</span>
            </div>
          </div>

          {/* AI Analysis */}
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4 sm:p-6">
            <h2 className="text-base font-black text-white sm:text-lg">
              Hasil Analisis AI
            </h2>
            <div className="mt-4 prose prose-invert prose-sm max-w-none">
              <AnalysisRenderer text={result.analysis} />
            </div>
          </div>

          {/* Reset */}
          <button
            onClick={() => {
              setResult(null);
              setExtractedPost(null);
              setPostUrl("");
              setPastedHtml("");
              setFetchMethod(null);
            }}
            className="rounded-lg border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/10 active:scale-95"
          >
            Analisis Postingan Lain
          </button>
        </div>
      )}
    </main>
  );
}

// ──────────────────────────────────────────
// Analysis Renderer (markdown-like)
// ──────────────────────────────────────────

function AnalysisRenderer({ text }: { text: string }) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith("### ")) {
      elements.push(
        <h3 key={i} className="mt-4 mb-2 text-base font-bold text-red-300">
          {line.replace("### ", "")}
        </h3>
      );
    } else if (line.startsWith("## ")) {
      elements.push(
        <h2 key={i} className="mt-5 mb-2 text-lg font-black text-white">
          {line.replace("## ", "")}
        </h2>
      );
    } else if (line.startsWith("# ")) {
      elements.push(
        <h1 key={i} className="mt-6 mb-3 text-xl font-black text-white">
          {line.replace("# ", "")}
        </h1>
      );
    } else if (line.startsWith("- ")) {
      elements.push(
        <li key={i} className="ml-4 text-sm text-slate-300">
          {renderInline(line.replace("- ", ""))}
        </li>
      );
    } else if (line.match(/^\d+\.\s/)) {
      elements.push(
        <li key={i} className="ml-4 list-decimal text-sm text-slate-300">
          {renderInline(line.replace(/^\d+\.\s/, ""))}
        </li>
      );
    } else if (line.startsWith("> ")) {
      elements.push(
        <blockquote
          key={i}
          className="border-l-2 border-red-400/40 pl-4 italic text-slate-400"
        >
          {renderInline(line.replace("> ", ""))}
        </blockquote>
      );
    } else if (line.trim() === "") {
      elements.push(<br key={i} />);
    } else {
      elements.push(
        <p key={i} className="text-sm text-slate-300">
          {renderInline(line)}
        </p>
      );
    }
  }

  return <>{elements}</>;
}

function renderInline(text: string): React.ReactNode {
  // Bold
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-bold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    // Inline code
    const codeParts = part.split(/(`[^`]+`)/g);
    return codeParts.map((cp, j) => {
      if (cp.startsWith("`") && cp.endsWith("`")) {
        return (
          <code
            key={`${i}-${j}`}
            className="rounded bg-white/10 px-1.5 py-0.5 text-xs text-red-300"
          >
            {cp.slice(1, -1)}
          </code>
        );
      }
      return <span key={`${i}-${j}`}>{cp}</span>;
    });
  });
}

// ──────────────────────────────────────────
// Helpers — read from localStorage
// ──────────────────────────────────────────

function getFbCookies(): string | null {
  try {
    const stored = localStorage.getItem("vsbattle-ai-config");
    if (!stored) return null;
    const config = JSON.parse(stored);

    // New format: separate c_user and xs fields
    if (config.fb_c_user && config.fb_xs) {
      return `c_user=${config.fb_c_user}; xs=${config.fb_xs}`;
    }

    // Legacy format: single fbCookies string
    if (config.fbCookies) {
      return config.fbCookies;
    }

    return null;
  } catch {
    return null;
  }
}

function getAiConfig(): {
  apiUrl: string;
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
} | null {
  try {
    const stored = localStorage.getItem("vsbattle-ai-config");
    if (!stored) return null;
    const config = JSON.parse(stored);
    if (!config.apiKey) return null;
    return {
      apiUrl: config.apiUrl || "https://api.groq.com/openai/v1/chat/completions",
      apiKey: config.apiKey,
      model: config.model || "llama-3.3-70b-versatile",
      maxTokens: parseInt(config.maxTokens) || 4096,
      temperature: parseFloat(config.temperature) || 0.2,
    };
  } catch {
    return null;
  }
}
