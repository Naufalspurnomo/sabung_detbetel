import { NextResponse } from "next/server";
import { getCharacterFeats } from "@/lib/vs-wiki-client";

export async function GET(
  _request: Request,
  { params }: { params: { name: string } }
) {
  const feats = await getCharacterFeats(params.name);
  return NextResponse.json({ feats });
}
