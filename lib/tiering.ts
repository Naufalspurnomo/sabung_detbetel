const tierOrder = [
  "11-C",
  "Low 11-B",
  "11-B",
  "High 11-B",
  "11-A",
  "10-C",
  "10-B",
  "10-A",
  "9-C",
  "9-B",
  "9-A",
  "8-C",
  "High 8-C",
  "8-B",
  "8-A",
  "Low 7-C",
  "7-C",
  "High 7-C",
  "7-B",
  "7-A",
  "High 7-A",
  "6-C",
  "High 6-C",
  "6-B",
  "High 6-B",
  "6-A",
  "High 6-A",
  "5-C",
  "Low 5-B",
  "5-B",
  "5-A",
  "Low 4-C",
  "4-C",
  "High 4-C",
  "4-B",
  "4-A",
  "3-C",
  "3-B",
  "3-A",
  "Low 2-C",
  "2-C",
  "2-B",
  "2-A",
  "Low 1-C",
  "1-C",
  "High 1-C",
  "1-B",
  "High 1-B",
  "1-A",
  "High 1-A",
  "0"
] as const;

const tierRanks = new Map<string, number>(
  tierOrder.map((tier, index) => [tier.toLowerCase(), index])
);

const speedOrder = [
  "Below Average Human",
  "Average Human",
  "Athletic Human",
  "Peak Human",
  "Superhuman",
  "Subsonic",
  "Transonic",
  "Supersonic",
  "Hypersonic",
  "Massively Hypersonic",
  "Relativistic",
  "Relativistic+",
  "Speed of Light",
  "FTL",
  "FTL+",
  "Massively FTL",
  "Massively FTL+",
  "Infinite",
  "Immeasurable",
  "Irrelevant"
] as const;

const speedSynonyms: Record<string, string> = {
  sol: "Speed of Light",
  lightspeed: "Speed of Light",
  "faster-than-light": "FTL",
  mftl: "Massively FTL",
  "mftl+": "Massively FTL+"
};

export function resolveTierRank(tierText: string): number | null {
  const normalized = tierText.replace(/\s+/g, " ").trim().toLowerCase();
  const matches = [...tierRanks.entries()]
    .filter(([tier]) => normalized.includes(tier))
    .sort((a, b) => b[0].length - a[0].length);

  if (!matches.length) {
    return null;
  }

  return Math.max(...matches.map(([, rank]) => rank));
}

export function getTierLabel(rank: number | null): string {
  if (rank === null) {
    return "Unknown";
  }

  return tierOrder[Math.max(0, Math.min(rank, tierOrder.length - 1))];
}

export function compareTier(char1Tier: string, char2Tier: string) {
  const char1Rank = resolveTierRank(char1Tier);
  const char2Rank = resolveTierRank(char2Tier);

  if (char1Rank === null || char2Rank === null) {
    return {
      winner: "unknown" as const,
      delta: 0,
      char1Rank,
      char2Rank
    };
  }

  if (char1Rank === char2Rank) {
    return {
      winner: "tie" as const,
      delta: 0,
      char1Rank,
      char2Rank
    };
  }

  return {
    winner: char1Rank > char2Rank ? ("char1" as const) : ("char2" as const),
    delta: Math.abs(char1Rank - char2Rank),
    char1Rank,
    char2Rank
  };
}

export function resolveSpeedRank(speedText: string): number | null {
  const normalized = speedText.replace(/\s+/g, " ").trim().toLowerCase();
  const synonymMatch = Object.entries(speedSynonyms).find(([key]) =>
    normalized.includes(key)
  );

  if (synonymMatch) {
    return speedOrder.findIndex((speed) => speed === synonymMatch[1]);
  }

  const matches = speedOrder
    .map((speed, index) => ({ speed, index }))
    .filter(({ speed }) => normalized.includes(speed.toLowerCase()))
    .sort((a, b) => b.speed.length - a.speed.length);

  if (!matches.length) {
    return null;
  }

  return Math.max(...matches.map((match) => match.index));
}

export function compareSpeed(char1Speed: string, char2Speed: string) {
  const char1Rank = resolveSpeedRank(char1Speed);
  const char2Rank = resolveSpeedRank(char2Speed);

  if (char1Rank === null || char2Rank === null) {
    return {
      winner: "unknown" as const,
      delta: 0,
      char1Rank,
      char2Rank
    };
  }

  if (char1Rank === char2Rank) {
    return {
      winner: "tie" as const,
      delta: 0,
      char1Rank,
      char2Rank
    };
  }

  return {
    winner: char1Rank > char2Rank ? ("char1" as const) : ("char2" as const),
    delta: Math.abs(char1Rank - char2Rank),
    char1Rank,
    char2Rank
  };
}

export function tierScore(tierText: string): number {
  return resolveTierRank(tierText) ?? 0;
}

export function tierPercent(tierText: string): number {
  const rank = resolveTierRank(tierText);
  if (rank === null) {
    return 0;
  }

  return Math.round((rank / (tierOrder.length - 1)) * 100);
}

export function tierColorClass(tierText: string): string {
  const rank = resolveTierRank(tierText);

  if (rank === null) {
    return "bg-slate-500";
  }

  if (rank >= resolveTierRank("1-A")!) {
    return "bg-tier-outer";
  }

  if (rank >= resolveTierRank("3-C")!) {
    return "bg-tier-cosmic";
  }

  if (rank >= resolveTierRank("5-B")!) {
    return "bg-tier-planet";
  }

  return "bg-tier-street";
}
