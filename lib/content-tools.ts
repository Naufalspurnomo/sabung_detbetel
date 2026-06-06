import type { CharacterProfile, Feat } from "./types";

export function generateRespectThread(
  profile: CharacterProfile,
  feats: Feat[]
): string {
  const groups = groupBy(feats, (feat) => feat.category);
  const sections = Object.entries(groups)
    .map(([category, categoryFeats]) => {
      const lines = categoryFeats
        .map(
          (feat) =>
            `- **${feat.title}:** ${feat.description} ([sumber](${feat.source.url}))`
        )
        .join("\n");
      return `## ${category}\n${lines}`;
    })
    .join("\n\n");

  return `# Respect ${profile.name} (${profile.series})\n\n**Tier:** ${profile.tier}\n**Speed:** ${profile.speed}\n**Durability:** ${profile.durability}\n\n${sections}\n\n---\nDibuat oleh VSBattle AI dari data profil VS Battles Wiki yang berhasil diparse. Verifikasi scan dan calc link sebelum diposting.`;
}

export function generateCharacterProfile(input: {
  name: string;
  series: string;
  description: string;
  feats: string;
}): string {
  return `{{Character Infobox
|name = ${input.name}
|series = ${input.series}
}}

'''${input.name}''' adalah konsep karakter custom dari ''${input.series}''.

==Summary==
${input.description || "Belum ada deskripsi."}

==Powers and Stats==
'''Tier:''' Unknown, kemungkinan bergantung pada feat yang dibuktikan

'''Name:''' ${input.name}

'''Origin:''' ${input.series}

'''Attack Potency:''' Perlu dihitung dari feat. Catatan feat: ${input.feats || "Belum ada"}

'''Speed:''' Unknown

'''Durability:''' Unknown

'''Powers and Abilities:''' Tambahkan ability spesifik beserta sumber.

'''Weaknesses:''' Unknown

==Notes==
Draft ini sengaja konservatif. Tambahkan feat terukur, scan, dan kalkulasi sebelum submit ke wiki.`;
}

function groupBy<T>(
  values: T[],
  key: (value: T) => string
): Record<string, T[]> {
  return values.reduce<Record<string, T[]>>((acc, item) => {
    const itemKey = key(item);
    acc[itemKey] = acc[itemKey] ?? [];
    acc[itemKey].push(item);
    return acc;
  }, {});
}
