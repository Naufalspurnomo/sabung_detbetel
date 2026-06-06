import { NextResponse } from "next/server";
import { testAIConnection } from "@/lib/llm";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { apiUrl, apiKey, model } = body;

    if (!apiUrl || !apiKey || !model) {
      return NextResponse.json(
        { ok: false, error: "Missing apiUrl, apiKey, or model" },
        { status: 400 }
      );
    }

    const result = await testAIConnection({ apiUrl, apiKey, model });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
