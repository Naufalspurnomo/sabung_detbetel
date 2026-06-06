import { NextRequest, NextResponse } from "next/server";
import { generateRespectThread } from "@/lib/content-tools";
import { getCharacterFeats, getCharacterProfile } from "@/lib/vs-wiki-client";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    character?: string;
  };

  if (!body.character) {
    return NextResponse.json(
      { error: "character wajib diisi" },
      { status: 400 }
    );
  }

  const [profile, feats] = await Promise.all([
    getCharacterProfile(body.character),
    getCharacterFeats(body.character)
  ]);

  return NextResponse.json({
    character: profile.pageTitle,
    markdown: generateRespectThread(profile, feats)
  });
}
