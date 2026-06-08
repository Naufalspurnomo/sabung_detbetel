/**
 * Facebook Post Fetcher API
 *
 * Fetches and parses Facebook private group posts using user's cookies.
 * Tries multiple Facebook domains: mbasic → m → www → web.
 * Extracts: text content, images, embedded links, author, timestamp.
 */

import { NextRequest, NextResponse } from "next/server";

// ──────────────────────────────────────────
// Types
// ──────────────────────────────────────────

interface FbPostData {
  url: string;
  author: string;
  text: string;
  images: string[];
  links: string[];
  timestamp: string;
  html: string; // raw HTML for AI analysis
}

interface RequestBody {
  url: string;
  cookies: string; // "c_user=...; xs=..."
  html?: string; // optional: user-pasted HTML fallback
}

// ──────────────────────────────────────────
// POST handler
// ──────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as RequestBody;
    const { url, cookies, html: pastedHtml } = body;

    if (!url) {
      return NextResponse.json({ error: "URL wajib diisi" }, { status: 400 });
    }

    // Mode 1: User pasted HTML directly (fallback when server fetch fails)
    if (pastedHtml && pastedHtml.length > 100) {
      const post = parsePost(pastedHtml, url);
      return NextResponse.json({ ok: true, post, method: "pasted" });
    }

    // Mode 2: Server-side fetch with cookies
    if (!cookies) {
      return NextResponse.json(
        { error: "Facebook cookie wajib diisi. Buka Settings untuk mengisi cookie." },
        { status: 400 }
      );
    }

    // Try multiple Facebook domains
    const domains = [
      "mbasic.facebook.com",
      "m.facebook.com",
      "web.facebook.com",
      "www.facebook.com",
    ];

    let html = "";
    let usedDomain = "";

    for (const domain of domains) {
      const tryUrl = toFacebookUrl(url, domain);
      if (!tryUrl) continue;

      const result = await fetchFacebookPage(tryUrl, cookies);
      if (!result) continue;

      // Check for error pages
      if (isBlockedPage(result)) {
        console.log(`[fb-post] ${domain} returned blocked page, trying next...`);
        continue;
      }

      if (isLoginPage(result)) {
        return NextResponse.json(
          { error: "Cookie Facebook expired. Silakan update cookie di Settings." },
          { status: 401 }
        );
      }

      html = result;
      usedDomain = domain;
      break;
    }

    if (!html) {
      return NextResponse.json(
        {
          error: "Facebook memblokir request dari server. Gunakan mode 'Paste HTML' — buka postingan di browser kamu, Ctrl+A select all, Ctrl+C copy, lalu paste di kolom yang tersedia.",
          fallback: true,
        },
        { status: 422 }
      );
    }

    // Parse the post content
    const post = parsePost(html, url);

    return NextResponse.json({ ok: true, post, method: "fetched", domain: usedDomain });
  } catch (err) {
    console.error("[fb-post] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}

// ──────────────────────────────────────────
// URL normalization
// ──────────────────────────────────────────

function toFacebookUrl(url: string, targetDomain: string): string | null {
  try {
    const parsed = new URL(url);
    if (
      parsed.hostname.includes("facebook.com") ||
      parsed.hostname.includes("fb.com")
    ) {
      parsed.hostname = targetDomain;
      return parsed.toString();
    }
    return null;
  } catch {
    return null;
  }
}

// ──────────────────────────────────────────
// Fetch with cookies
// ──────────────────────────────────────────

async function fetchFacebookPage(
  url: string,
  cookies: string
): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        Cookie: cookies,
        // Desktop Chrome UA — more reliable than mobile for mbasic
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Cache-Control": "no-cache",
        "Sec-Ch-Ua": '"Chromium";v="126", "Google Chrome";v="126", "Not-A.Brand";v="8"',
        "Sec-Ch-Ua-Mobile": "?0",
        "Sec-Ch-Ua-Platform": '"Windows"',
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "same-origin",
        "Sec-Fetch-User": "?1",
        "Upgrade-Insecure-Requests": "1",
      },
      redirect: "follow",
    });

    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

// ──────────────────────────────────────────
// Detect error pages
// ──────────────────────────────────────────

function isLoginPage(html: string): boolean {
  return (
    html.includes("login.php") ||
    html.includes('name="email"') ||
    html.includes('id="login_form"') ||
    html.includes("Session Expired")
  );
}

function isBlockedPage(html: string): boolean {
  return (
    html.includes("Facebook tidak tersedia di browser ini") ||
    html.includes("Facebook is not available in this browser") ||
    html.includes("Dapatkan Facebook Lite") ||
    html.includes("Get Facebook Lite") ||
    html.includes("download our app") ||
    // mbasic sometimes redirects to a "use the app" page
    html.includes("c_basic_tertiary_redirect") ||
    // Check if page is suspiciously short (likely error page)
    html.length < 2000
  );
}

// ──────────────────────────────────────────
// Parse Facebook post HTML (works with mbasic, m, www, web)
// ──────────────────────────────────────────

function parsePost(html: string, originalUrl: string): FbPostData {
  // Author
  const authorMatch =
    html.match(/<strong[^>]*>([^<]+)<\/strong>/i) ||
    html.match(/<h3[^>]*>[^<]*<a[^>]*>([^<]+)<\/a>/i) ||
    html.match(/"name":"([^"]+)"/);
  const author = authorMatch ? decodeEntities(authorMatch[1].trim()) : "Unknown";

  // Main post text — try multiple patterns
  let text = "";

  // Pattern 1: story body container (mbasic)
  const storyBodyMatch = html.match(
    /<div[^>]*class="[^"]*story_body_container[^"]*"[^]*?<\/div>\s*(?:<div[^>]*class="[^"]*(?:comment|like|share))/i
  );
  if (storyBodyMatch) {
    text = stripHtml(storyBodyMatch[1]);
  }

  // Pattern 2: data-ft div
  if (!text) {
    const dataFtMatch = html.match(
      /<div[^>]*data-ft="[^"]*"[^]*?<\/div>\s*(?:<div|<\/section)/i
    );
    if (dataFtMatch) {
      text = stripHtml(dataFtMatch[1]);
    }
  }

  // Pattern 3: Brute force — find largest meaningful text block
  if (!text || text.length < 20) {
    const allDivs = html.match(/<div[^>]*>([\s\S]*?)<\/div>/gi) || [];
    let longest = "";
    for (const div of allDivs) {
      const cleaned = stripHtml(div);
      if (cleaned.length > longest.length && cleaned.length < 5000) {
        longest = cleaned;
      }
    }
    text = longest;
  }

  // Images
  const images: string[] = [];

  // Pattern 1: scontent/fbcdn img src
  const imgMatches = html.matchAll(/<img[^>]*src="([^"]*(?:scontent|fbcdn)[^"]*)"[^>]*>/gi);
  for (const match of imgMatches) {
    const src = decodeEntities(match[1]);
    if (!src.includes("/rsrc/") && !src.includes("emoji") && !src.includes("static")) {
      images.push(src);
    }
  }

  // Pattern 2: photo.php links (mbasic)
  const photoLinks = html.matchAll(/href="(\/photo\.php\?[^"]+)"/gi);
  for (const match of photoLinks) {
    images.push(`https://mbasic.facebook.com${match[1]}`);
  }

  // Pattern 3: data-store JSON images (m.facebook.com)
  const dataStoreMatches = html.matchAll(/data-store="([^"]*)"/gi);
  for (const match of dataStoreMatches) {
    try {
      const decoded = decodeEntities(match[1]);
      const store = JSON.parse(decoded);
      if (store.src) images.push(store.src);
    } catch {
      // skip
    }
  }

  // Deduplicate
  const uniqueImages = [...new Set(images)];

  // Links
  const links: string[] = [];
  const linkMatches = html.matchAll(
    /href="([^"]*(?:https?%3A%2F%2F|l\.facebook\.com\/l\.php)[^"]*)"/gi
  );
  for (const match of linkMatches) {
    try {
      const decoded = decodeURIComponent(match[1]);
      const urlMatch = decoded.match(/u=(https?:\/\/[^&]+)/);
      if (urlMatch) {
        links.push(urlMatch[1]);
      } else if (decoded.startsWith("http")) {
        links.push(decoded);
      }
    } catch {
      // skip
    }
  }

  // Links from text
  const textLinkMatches = text.matchAll(/(https?:\/\/[^\s<>"']+)/gi);
  for (const match of textLinkMatches) {
    if (!match[1].includes("facebook.com")) {
      links.push(match[1]);
    }
  }

  const uniqueLinks = [...new Set(links)];

  // Timestamp
  const timeMatch = html.match(
    /<abbr[^>]*>([^<]*(?:jam|jam yang lalu|hari|menit|detik|hour|minute|day|yesterday)[^]*)<\/abbr>/i
  );
  const timestamp = timeMatch ? decodeEntities(timeMatch[1].trim()) : "Unknown";

  return {
    url: originalUrl,
    author,
    text: text.trim(),
    images: uniqueImages,
    links: uniqueLinks,
    timestamp,
    html: html.substring(0, 50000), // cap for AI analysis
  };
}

// ──────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function decodeEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}
