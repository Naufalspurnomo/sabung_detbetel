import { NextResponse } from "next/server";
import { listDebates } from "@/lib/matchup-store";

export async function GET() {
  return NextResponse.json({
    debates: listDebates()
  });
}
