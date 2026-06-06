import { NextRequest, NextResponse } from "next/server";
import { generateCharacterProfile } from "@/lib/content-tools";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    name?: string;
    series?: string;
    description?: string;
    feats?: string;
  };

  if (!body.name || !body.series) {
    return NextResponse.json(
      { error: "name dan series wajib diisi" },
      { status: 400 }
    );
  }

  return NextResponse.json({
    profile: generateCharacterProfile({
      name: body.name,
      series: body.series,
      description: body.description ?? "",
      feats: body.feats ?? ""
    })
  });
}
