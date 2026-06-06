import { NextResponse } from "next/server";
import { judgeDebateById } from "@/lib/matchup-store";

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const debate = judgeDebateById(params.id);
    return NextResponse.json(debate);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gagal menjalankan wasit" },
      { status: 404 }
    );
  }
}
