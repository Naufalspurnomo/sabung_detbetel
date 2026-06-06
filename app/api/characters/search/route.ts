import { NextRequest, NextResponse } from "next/server";
import { searchCharacters } from "@/lib/vs-wiki-client";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q") ?? "";
  const results = await searchCharacters(query);

  return NextResponse.json({
    query,
    results
  });
}
