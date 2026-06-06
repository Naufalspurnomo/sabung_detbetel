import { getCharacterProfile } from "@/lib/vs-wiki-client";

export async function GET(
  _request: Request,
  { params }: { params: { name: string } }
) {
  const profile = await getCharacterProfile(params.name);

  if (!profile.imageUrl) {
    return new Response("Gambar tidak ditemukan", { status: 404 });
  }

  const response = await fetch(profile.imageUrl, {
    headers: {
      "User-Agent": "VSBattleAI/0.1 image proxy"
    },
    next: { revalidate: 604800 }
  });

  if (!response.ok) {
    return new Response("Sumber gambar gagal dimuat", { status: 502 });
  }

  return new Response(await response.arrayBuffer(), {
    headers: {
      "Content-Type": response.headers.get("Content-Type") ?? "image/jpeg",
      "Cache-Control": "public, s-maxage=604800, stale-while-revalidate=86400"
    }
  });
}
