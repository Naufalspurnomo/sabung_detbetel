import { NextRequest, NextResponse } from "next/server";
import { addArgument } from "@/lib/matchup-store";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = (await request.json().catch(() => ({}))) as {
    userId?: string;
    characterTitle?: string;
    content?: string;
  };

  if (!body.characterTitle || !body.content) {
    return NextResponse.json(
      { error: "characterTitle dan content argumen wajib diisi" },
      { status: 400 }
    );
  }

  try {
    const argument = addArgument({
      debateId: params.id,
      userId: body.userId,
      characterTitle: body.characterTitle,
      content: body.content
    });

    return NextResponse.json(argument, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gagal menambah argumen" },
      { status: 404 }
    );
  }
}
