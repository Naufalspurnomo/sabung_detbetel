/**
 * Facebook Post Fetcher API
 *
 * Fetches and parses Facebook private group posts using user's cookies.
 * Uses mbasic.facebook.com for simpler HTML parsing.
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
  html: string; // raw mbasic HTML for AI analysis
}

interface RequestBody {
  url: string;
  cookies: string; // "c_user=...; xs=..."
}

// ──────────────────────────────────────────
// POST handler
// ──────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as RequestBody;
    const { url, cookies } = body;

    if (!url) {
      return NextResponse.json({ error: "URL wajib diisi" }, { status: 400 });
    }
    if (!cookies) {
      return NextResponse.json(
        { error: "Facebook cookie wajib diisi. Buka Settings untuk mengisi cookie." },
        { status: 400 }
      );
    }

    // Normalize URL to mbasic
    const mbasicUrl = toMbasicUrl(url);
    if (!mbasicUrl) {
      return NextResponse.json(
        { error: "URL Facebook tidak valid. Contoh: https://www.facebook.com/groups/ibr/posts/..." },
        { status: 400 }
      );
    }

    // Fetch the post page
    const html = await fetchFacebookPage(mbasicUrl, cookies);
    if (!html) {
      return NextResponse.json(
        { error: "Gagal mengambil postingan. Cookie mungkin expired atau postingan tidak bisa diakses." },
        { status: 422 }
      );
    }

    // Check if we got a login page (cookie expired)
    if (isLoginPage(html)) {
      return NextResponse.json(
        { error: "Cookie Facebook expired. Silakan update cookie di Settings." },
        { status: 401 }
      );
    }

    // Parse the post content
    const post = parsePost(html, url);

    return NextResponse.json({ ok: true, post });
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

function toMbasicUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    // Convert any facebook domain to mbasic
    if (
      parsed.hostname.includes("facebook.com") ||
      parsed.hostname.includes("fb.com")
    ) {
      parsed.hostname = "mbasic.facebook.com";
      // Remove www. if present
      parsed.hostname = parsed.hostname.replace("www.", "");
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
        "User-Agent":
          "Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
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
// Detect login page
// ──────────────────────────────────────────

function isLoginPage(html: string): boolean {
  return (
    html.includes("login.php") ||
    html.includes('name="email"') ||
    html.includes('id="login_form"') ||
    html.includes("Session Expired")
  );
}

// ──────────────────────────────────────────
// Parse mbasic.facebook.com post HTML
// ──────────────────────────────────────────

function parsePost(html: string, originalUrl: string): FbPostData {
  // Author — mbasic shows it in <strong> or <h3> inside story header
  const authorMatch =
    html.match(/<strong[^>]*>([^<]+)<\/strong>/i) ||
    html.match(/<h3[^>]*>[^<]*<a[^>]*>([^<]+)<\/a>/i);
  const author = authorMatch ? decodeEntities(authorMatch[1].trim()) : "Unknown";

  // Main post text — mbasic puts it in <div> with data-ft or story_body_container
  // Try multiple patterns
  let text = "";

  // Pattern 1: story body container
  const storyBodyMatch = html.match(
    /<div[^>]*class="[^"]*story_body_container[^"]*"[^>]*>([\s\S]*?)<\/div>\s*(?:<div[^>]*class="[^"]*(?:comment|like|share))/i
  );
  if (storyBodyMatch) {
    text = stripHtml(storyBodyMatch[1]);
  }

  // Pattern 2: data-ft div (main content area)
  if (!text) {
    const dataFtMatch = html.match(
      /<div[^>]*data-ft="[^"]*"[^>]*>([\s\S]*?)<\/div>\s*(?:<div|<\/section)/i
    );
    if (dataFtMatch) {
      text = stripHtml(dataFtMatch[1]);
    }
  }

  // Pattern 3: Brute force — find largest text block
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

  // Images — extract from <img> tags (mbasic uses photo.php links)
  const images: string[] = [];

  // Pattern 1: Direct img src
  const imgMatches = html.matchAll(/<img[^>]*src="([^"]*(?:scontent|fbcdn)[^"]*)"[^>]*>/gi);
  for (const match of imgMatches) {
    const src = decodeEntities(match[1]);
    if (!src.includes("/rsrc/") && !src.includes("emoji") && !src.includes("static")) {
      images.push(src);
    }
  }

  // Pattern 2: photo.php links (mbasic style)
  const photoLinks = html.matchAll(/href="(\/photo\.php\?[^"]+)"/gi);
  for (const match of photoLinks) {
    // These are relative URLs to full photos
    images.push(`https://mbasic.facebook.com${match[1]}`);
  }

  // Deduplicate
  const uniqueImages = [...new Set(images)];

  // Links — extract URLs from post text (external links shared in post)
  const links: string[] = [];
  const linkMatches = html.matchAll(
    /href="([^"]*(?:https?%3A%2F%2F|l\.facebook\.com\/l\.php)[^"]*)"/gi
  );
  for (const match of linkMatches) {
    try {
      const decoded = decodeURIComponent(match[1]);
      // Extract actual URL from facebook redirect
      const urlMatch = decoded.match(/u=(https?:\/\/[^&]+)/);
      if (urlMatch) {
        links.push(urlMatch[1]);
      } else if (decoded.startsWith("http")) {
        links.push(decoded);
      }
    } catch {
      // skip malformed URLs
    }
  }

  // Also extract links from text
  const textLinkMatches = text.matchAll(/(https?:\/\/[^\s<>"']+)/gi);
  for (const match of textLinkMatches) {
    if (!match[1].includes("facebook.com")) {
      links.push(match[1]);
    }
  }

  const uniqueLinks = [...new Set(links)];

  // Timestamp
  const timeMatch = html.match(
    /<abbr[^>]*>([^<]*(?:jam|jam yang lalu|hari|menit|detik|hour|minute|day|yesterday)[^<]*)<\/abbr>/i
  );
  const timestamp = timeMatch ? decodeEntities(timeMatch[1].trim()) : "Unknown";

  return {
    url: originalUrl,
    author,
    text: text.trim(),
    images: uniqueImages,
    links: uniqueLinks,
    timestamp,
    html: html.substring(0, 50000), // cap HTML size for AI analysis
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
