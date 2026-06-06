import { NextRequest } from "next/server";

const allowedHosts = new Set([
  "static.wikia.nocookie.net",
  "static.wikia.com",
  "vignette.wikia.nocookie.net",
  "i.imgur.com",
  "imgur.com",
  "cdn.discordapp.com",
  "media.discordapp.net"
]);

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return new Response("url wajib diisi", { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return new Response("url tidak valid", { status: 400 });
  }

  if (!["https:"].includes(parsed.protocol)) {
    return new Response("hanya gambar https yang diizinkan", { status: 400 });
  }

  if (!allowedHosts.has(parsed.hostname.toLowerCase())) {
    return new Response("host gambar tidak diizinkan", { status: 400 });
  }

  const response = await fetch(parsed.toString(), {
    headers: {
      "User-Agent": "VSBattleAI/0.1 image proxy"
    },
    next: { revalidate: 604800 }
  });

  if (!response.ok) {
    return new Response("sumber gambar gagal dimuat", { status: 502 });
  }

  return new Response(await response.arrayBuffer(), {
    headers: {
      "Content-Type": response.headers.get("Content-Type") ?? "image/jpeg",
      "Cache-Control": "public, s-maxage=604800, stale-while-revalidate=86400"
    }
  });
}
