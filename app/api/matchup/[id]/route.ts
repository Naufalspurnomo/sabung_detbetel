import { NextResponse } from "next/server";
import { getDebate } from "@/lib/matchup-store";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const debate = getDebate(params.id);

  if (!debate) {
    return NextResponse.json({ error: "Debat tidak ditemukan" }, { status: 404 });
  }

  return NextResponse.json(debate);
}
