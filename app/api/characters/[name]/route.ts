import { NextResponse } from "next/server";
import { getCharacterProfile } from "@/lib/vs-wiki-client";

export async function GET(
  _request: Request,
  { params }: { params: { name: string } }
) {
  const profile = await getCharacterProfile(params.name);
  return NextResponse.json(profile);
}
