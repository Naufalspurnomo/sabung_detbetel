import { compareSpeed, compareTier } from "./tiering";
import type {
  ArgumentAnalysis,
  CharacterProfile,
  DebateArgument,
  SourceLink,
  StatAdvantage,
  Verdict
} from "./types";

const haxTerms = [
  "Time Manipulation",
  "Time Stop",
  "Existence Erasure",
  "Reality Warping",
  "Mind Manipulation",
  "Soul Manipulation",
  "Conceptual Manipulation",
  "Causality Manipulation",
  "Fate Manipulation",
  "BFR"
];

export function judgeDebate(input: {
  char1: CharacterProfile;
  char2: CharacterProfile;
  arguments: DebateArgument[];
}): Verdict {
  const tier = compareTier(input.char1.tier, input.char2.tier);
  const speed = compareSpeed(input.char1.speed, input.char2.speed);
  const char1Hax = countHax(input.char1);
  const char2Hax = countHax(input.char2);

  const statBreakdown: StatAdvantage[] = [
    {
      label: "Attack Potency",
      char1Value: input.char1.attackPotency,
      char2Value: input.char2.attackPotency,
      winner: tier.winner,
      reasoning: explainTier(tier.delta, tier.winner)
    },
    {
      label: "Speed",
      char1Value: input.char1.speed,
      char2Value: input.char2.speed,
      winner: speed.winner,
      reasoning: explainSpeed(speed.delta, speed.winner)
    },
    {
      label: "Durability",
      char1Value: input.char1.durability,
      char2Value: input.char2.durability,
      winner: tier.winner,
      reasoning:
        tier.winner === "tie"
          ? "Durability dianggap sebanding karena tier yang terparse berada di level yang sama."
          : "Durability mengikuti gap tier yang terparse, kecuali profil mencantumkan key durability yang berbeda."
    },
    {
      label: "Hax / Ability",
      char1Value: summarizeHax(input.char1),
      char2Value: summarizeHax(input.char2),
      winner:
        char1Hax === char2Hax
          ? "tie"
          : char1Hax > char2Hax
            ? "char1"
            : "char2",
      reasoning:
        "Ini hanya membandingkan ability/hax yang berhasil terparse. Mekanik detail tetap harus dicek dari profil dan sumber feat."
    }
  ];

  const score = {
    char1: scoreCharacter("char1", statBreakdown, tier.delta, speed.delta),
    char2: scoreCharacter("char2", statBreakdown, tier.delta, speed.delta)
  };

  const winnerSide = score.char1 >= score.char2 ? "char1" : "char2";
  const winner = winnerSide === "char1" ? input.char1 : input.char2;
  const loser = winnerSide === "char1" ? input.char2 : input.char1;
  const scoreGap = Math.abs(score.char1 - score.char2);

  const argumentAnalysis = input.arguments.map((argument) =>
    analyzeArgument(
      argument,
      argument.characterTitle === input.char1.pageTitle ? input.char1 : input.char2
    )
  );

  const sources = uniqueSources([
    ...input.char1.sourceLinks,
    ...input.char2.sourceLinks,
    ...argumentAnalysis.flatMap((analysis) => analysis.citedEvidence)
  ]);

  return {
    winnerTitle: winner.pageTitle,
    loserTitle: loser.pageTitle,
    difficulty: difficultyFromGap(scoreGap),
    confidence: confidenceFromGap(scoreGap, tier.delta),
    summary: `${winner.shortName} menang karena data profil yang berhasil diparse memberi win condition yang lebih kuat melawan ${loser.shortName}.`,
    keyFactor: keyFactor(winner, loser, tier.delta, speed.delta, winnerSide),
    statBreakdown,
    argumentAnalysis,
    sources,
    generatedAt: new Date().toISOString()
  };
}

export function analyzeArgument(
  argument: DebateArgument,
  character: CharacterProfile
): ArgumentAnalysis {
  const text = argument.content.toLowerCase();
  const evidence = character.sourceLinks;

  if (!argument.content.trim()) {
    return {
      status: "needs_source",
      summary: "Argumen kosong. Tidak ada klaim yang bisa dinilai.",
      citedEvidence: evidence
    };
  }

  if (/infinite|omnipotent|solo(s)? fiction|no[- ]?limit|limitless/.test(text)) {
    return {
      status: "partially_supported",
      summary:
        "Klaim growth, limitless, atau no-limiter harus dibuktikan dengan stat profil yang terukur. Tanpa itu, klaimnya hanya potensi, bukan output saat ini.",
      citedEvidence: evidence
    };
  }

  if (
    character.abilities.some((ability) =>
      text.includes(ability.toLowerCase().split(" ")[0])
    )
  ) {
    return {
      status: "supported",
      summary:
        "Argumen menyebut ability yang ada di profil. Dampaknya dalam fight masih bergantung pada range, aktivasi, resistance lawan, dan konteks speed.",
      citedEvidence: evidence
    };
  }

  if (/tier|ap|attack potency|speed|durability|hax|scaling/.test(text)) {
    return {
      status: "partially_supported",
      summary:
        "Argumen memakai istilah VSB, tetapi butuh stat profil, key, atau calc link spesifik agar benar-benar kuat.",
      citedEvidence: evidence
    };
  }

  return {
    status: "needs_source",
    summary:
      "Klaim ini belum nyambung langsung ke data profil yang terparse. Tambahkan stat profil, feat, scan, chapter, atau sumber calc blog.",
    citedEvidence: evidence
  };
}

function scoreCharacter(
  side: "char1" | "char2",
  breakdown: StatAdvantage[],
  tierDelta: number,
  speedDelta: number
): number {
  return breakdown.reduce((score, stat) => {
    if (stat.winner === side) {
      const weight =
        stat.label === "Attack Potency"
          ? Math.max(3, tierDelta)
          : stat.label === "Speed"
            ? Math.max(1, speedDelta)
            : 1;
      return score + weight;
    }

    if (stat.winner === "tie") {
      return score + 0.5;
    }

    return score;
  }, 0);
}

function countHax(character: CharacterProfile): number {
  return character.abilities.filter((ability) =>
    haxTerms.some((term) => ability.toLowerCase().includes(term.toLowerCase()))
  ).length;
}

function summarizeHax(character: CharacterProfile): string {
  const hax = character.abilities.filter((ability) =>
    haxTerms.some((term) => ability.toLowerCase().includes(term.toLowerCase()))
  );

  if (!hax.length) {
    return character.abilities.slice(0, 4).join(", ") || "Tidak ada hax terparse";
  }

  return hax.slice(0, 6).join(", ");
}

function explainTier(
  delta: number,
  winner: "char1" | "char2" | "tie" | "unknown"
): string {
  if (winner === "unknown") {
    return "Salah satu atau kedua profil punya tier unknown atau belum berhasil diparse.";
  }

  if (winner === "tie") {
    return "Tier yang terparse sebanding. Win condition bergantung pada hax, skill, dan konteks matchup.";
  }

  if (delta >= 5) {
    return "Gap tier besar. AP mentah dan durability sangat condong ke karakter dengan tier lebih tinggi.";
  }

  if (delta >= 2) {
    return "Gap tier terasa. Karakter yang lebih rendah butuh hax reliable atau win condition speed.";
  }

  return "Keunggulan tier kecil. Masih bisa dibalik oleh tool spesifik matchup.";
}

function explainSpeed(
  delta: number,
  winner: "char1" | "char2" | "tie" | "unknown"
): string {
  if (winner === "unknown") {
    return "Salah satu atau kedua rating speed belum berhasil diparse.";
  }

  if (winner === "tie") {
    return "Rating speed yang terparse sebanding.";
  }

  if (delta >= 2) {
    return "Gap speed cukup besar untuk argumen blitz, selama range dan aktivasi memungkinkan.";
  }

  return "Ada edge speed, tetapi belum cukup sendirian untuk clean blitz.";
}

function keyFactor(
  winner: CharacterProfile,
  loser: CharacterProfile,
  tierDelta: number,
  speedDelta: number,
  winnerSide: "char1" | "char2"
): string {
  if (tierDelta >= 2) {
    return `Keunggulan tier ${winner.shortName} atas ${loser.shortName} adalah faktor utama.`;
  }

  const speedWinner =
    winnerSide === "char1"
      ? compareSpeed(winner.speed, loser.speed).winner === "char1"
      : compareSpeed(loser.speed, winner.speed).winner === "char2";

  if (speedDelta >= 2 && speedWinner) {
    return `Keunggulan speed ${winner.shortName} memberi win condition paling bersih.`;
  }

  return `Kombinasi stat, ability yang tercatat, dan asumsi yang lebih sedikit membuat ${winner.shortName} unggul.`;
}

function difficultyFromGap(gap: number): Verdict["difficulty"] {
  if (gap >= 7) {
    return "No Diff";
  }
  if (gap >= 5) {
    return "Low Diff";
  }
  if (gap >= 3) {
    return "Mid Diff";
  }
  if (gap >= 1.5) {
    return "High Diff";
  }
  return "Extreme Diff";
}

function confidenceFromGap(
  gap: number,
  tierDelta: number
): Verdict["confidence"] {
  if (tierDelta >= 5 || gap >= 7) {
    return "decisive";
  }
  if (gap >= 4) {
    return "high";
  }
  if (gap >= 2) {
    return "medium";
  }
  if (gap >= 1) {
    return "low";
  }
  return "narrow";
}

function uniqueSources(sources: SourceLink[]): SourceLink[] {
  const seen = new Set<string>();
  return sources.filter((source) => {
    if (seen.has(source.url)) {
      return false;
    }

    seen.add(source.url);
    return true;
  });
}
