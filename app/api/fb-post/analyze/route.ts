/**
 * Facebook Post AI Analyzer
 *
 * Takes extracted post content + images and sends to AI for Death Battle analysis.
 * Uses the same AI config as the main matchup system.
 */

import { NextRequest, NextResponse } from "next/server";

// ──────────────────────────────────────────
// Types
// ──────────────────────────────────────────

interface FbPost {
  url: string;
  author: string;
  text: string;
  images: string[];
  links: string[];
  timestamp: string;
}

interface RequestBody {
  post: FbPost;
  config: {
    apiUrl: string;
    apiKey: string;
    model: string;
    maxTokens: number;
    temperature: number;
  };
}

// ──────────────────────────────────────────
// POST handler
// ──────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as RequestBody;
    const { post, config } = body;

    if (!post || !config?.apiKey) {
      return NextResponse.json(
        { error: "Data postingan dan config AI wajib diisi" },
        { status: 400 }
      );
    }

    // Build the analysis prompt
    const systemPrompt = `Kamu adalah AI analis Death Battle untuk komunitas IBR (Infinite Battle Reborn). Kamu ahli dalam menganalisis postingan debat tentang siapa yang menang dalam pertarungan karakter fiksi.

Kemampuan kamu:
- Membaca dan memahami konten postingan Facebook (teks, caption, diskusi)
- Mengenali karakter anime/manga/game/comic dari deskripsi dan screenshot
- Menganalisis argumen debat berbasis data VS Battles Wiki
- Menggunakan rumus fisika nyata untuk menghitung feat (KE = ½mv², GBE, F = ma)
- Memberikan penilaian adil berdasarkan tier, stat, hax, dan scaling

Aturan Death Battle:
1. Feats > Statements — bukti nyata lebih kuat dari klaim
2. No outside help — masing-masing karakter fight solo
3. Both at peak — gunakan versi terkuat yang sah
4. Death required — harus ada pemenang, bukan draw

Format tiering VS Battles Wiki:
- 9-C (Street) → 9-B (Wall) → 9-A (Small Building) → 8-C (Building) → High 8-C → 8-B → 8-A → Low 7-C → 7-C → High 7-C → Low 7-B → 7-B → 7-A → High 7-A → 6-C → High 6-C → Low 6-B → 6-B → 6-A → High 6-A → 5-C → Low 5-B → 5-B → 5-A → High 5-A → Low 4-C → 4-C → High 4-C → Low 4-B → 4-B → High 4-B → Low 4-A → 4-A → High 4-A → 3-C → High 3-C → Low 3-B → 3-B → High 3-B → Low 3-A → 3-A → High 3-A → Low 2-C → 2-C → Low 2-B → 2-B → Low 2-A → 2-A → 2-A → High 2-A → 1-C → Low 1-B → 1-B → 1-B+ → High 1-B → Low 1-A → 1-A → High 1-A → 0

Kamu harus:
1. Identifikasi karakter yang diperdebatkan dari konteks postingan
2. Cari data tier/stat dari pengetahuan VS Battles Wiki kamu
3. Analisis argumen yang diberikan di postingan
4. Berikan penilaian siapa yang menang dengan reasoning yang solid
5. Tunjukkan perhitungan jika ada feat yang bisa dihitung

Selalu gunakan bahasa Indonesia untuk penjelasan, istilah teknis tetap bahasa Inggris.`;

    const userMessage = buildUserMessage(post);

    // Call AI
    const response = await fetch(config.apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        temperature: config.temperature ?? 0.2,
        max_tokens: config.maxTokens ?? 4096,
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      console.error("[fb-analyze] AI error:", response.status, errText);
      return NextResponse.json(
        { error: `AI error: HTTP ${response.status}` },
        { status: 502 }
      );
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const analysis = data.choices?.[0]?.message?.content;
    if (!analysis) {
      return NextResponse.json(
        { error: "AI tidak memberikan respons" },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true, analysis });
  } catch (err) {
    console.error("[fb-analyze] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}

// ──────────────────────────────────────────
// Build user message from post
// ──────────────────────────────────────────

function buildUserMessage(post: FbPost): string {
  const parts: string[] = [];

  parts.push(`## Postingan dari grup IBR (Infinite Battle Reborn)`);
  parts.push(`Author: ${post.author}`);
  parts.push(`Waktu: ${post.timestamp}`);
  parts.push(`Link: ${post.url}`);
  parts.push("");

  if (post.text) {
    parts.push(`### Isi Postingan:`);
    parts.push(post.text);
    parts.push("");
  }

  if (post.images.length > 0) {
    parts.push(`### Gambar dalam postingan (${post.images.length}):`);
    post.images.forEach((img, i) => {
      if (img.startsWith("https://mbasic.facebook.com")) {
        parts.push(`- Gambar ${i + 1}: [Foto Facebook - perlu diakses via browser]`);
      } else {
        parts.push(`- Gambar ${i + 1}: ${img}`);
      }
    });
    parts.push("");
    parts.push(
      "Catatan: Gambar di atas kemungkinan berisi screenshot karakter, stat, atau argumen debat. Analisis berdasarkan konteks teks dan deskripsi yang tersedia."
    );
    parts.push("");
  }

  if (post.links.length > 0) {
    parts.push(`### Link dalam postingan (${post.links.length}):`);
    post.links.forEach((link, i) => {
      parts.push(`- Link ${i + 1}: ${link}`);
    });
    parts.push("");
  }

  parts.push(`### Tugas Analisis:`);
  parts.push(`1. Identifikasi karakter yang diperdebatkan`);
  parts.push(`2. Tentukan versi/key masing-masing karakter`);
  parts.push(`3. Cari data tier dan stat dari VS Battles Wiki`);
  parts.push(`4. Analisis siapa yang menang berdasarkan data`);
  parts.push(`5. Berikan penilaian dengan format:`);
  parts.push(`   - **Pemenang**: [nama karakter]`);
  parts.push(`   - **Tier Karakter 1** vs **Tier Karakter 2**`);
  parts.push(`   - **Key Factor**: alasan utama pemenang menang`);
  parts.push(`   - **Difficulty**: No Diff / Low Diff / Mid Diff / High Diff / Extreme Diff`);
  parts.push(`   - **Penjelasan**: 3-5 paragraf reasoning`);
  parts.push(`   - **Verdict terhadap argumen di postingan**: apakah argumen di postingan benar atau salah`);

  return parts.join("\n");
}
