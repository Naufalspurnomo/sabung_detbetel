import { NextResponse } from "next/server";
import { getCharacterProfile } from "@/lib/vs-wiki-client";

export async function GET(
  _request: Request,
  { params }: { params: { name: string } }
) {
  const profile = await getCharacterProfile(params.name);

  return NextResponse.json({
    character: profile.pageTitle,
    matchups: [
      {
        opponent: "Lawan dengan tier sebanding",
        result: "Perlu debat spesifik profil",
        source: profile.wikiUrl
      },
      {
        opponent: "Lawan hax tier lebih tinggi",
        result: "Bisa membalik gap stat mentah kalau aktivasi dan resistance cocok",
        source: profile.wikiUrl
      }
    ]
  });
}
