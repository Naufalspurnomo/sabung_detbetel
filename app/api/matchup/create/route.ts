import { NextRequest, NextResponse } from "next/server";
import { createDebate } from "@/lib/matchup-store";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    char1?: string;
    char2?: string;
    creatorId?: string;
    opponentId?: string;
    mode?: "solo" | "duel";
  };

  if (!body.char1 || !body.char2) {
    return NextResponse.json(
      { error: "char1 dan char2 wajib diisi" },
      { status: 400 }
    );
  }

  const debate = await createDebate({
    char1Title: body.char1,
    char2Title: body.char2,
    creatorId: body.creatorId,
    opponentId: body.opponentId,
    mode: body.mode
  });

  return NextResponse.json(debate, { status: 201 });
}
