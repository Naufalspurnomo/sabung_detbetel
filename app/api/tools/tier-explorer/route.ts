import { NextRequest, NextResponse } from "next/server";
import { fallbackCharacters } from "@/lib/mock-data";

export async function GET(request: NextRequest) {
  const tier = request.nextUrl.searchParams.get("tier") ?? "";
  const normalizedTier = tier.trim().toLowerCase();
  const characters = fallbackCharacters.filter((character) =>
    normalizedTier
      ? character.tier.toLowerCase().includes(normalizedTier)
      : true
  );

  return NextResponse.json({
    tier: tier || "all",
    characters
  });
}
