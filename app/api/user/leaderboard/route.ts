import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    leaderboard: [
      {
        userId: "guest",
        name: "Petarung Tamu",
        wins: 0,
        losses: 0,
        winRate: 0,
        totalDebates: 0,
        rank: 1
      }
    ]
  });
}
