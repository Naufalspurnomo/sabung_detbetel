import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    id: "guest",
    name: "Petarung Tamu",
    plan: "free",
    dailyJudgmentsRemaining: 3
  });
}
