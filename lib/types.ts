export type CacheMeta = {
  cached: boolean;
  cachedAt?: string;
  expiresAt?: string;
};

export type CharacterProfile = CacheMeta & {
  id: string;
  pageTitle: string;
  name: string;
  shortName: string;
  series: string;
  tier: string;
  attackPotency: string;
  speed: string;
  durability: string;
  intelligence: string;
  abilities: string[];
  weaknesses: string[];
  keys: string[];
  imageUrl?: string;
  wikiUrl: string;
  rawStats: Record<string, string>;
  sourceLinks: SourceLink[];
};

export type SourceLink = {
  label: string;
  url: string;
  type: "profile" | "calc" | "scan" | "wiki" | "external";
};

export type Feat = {
  id: string;
  category: "Strength" | "Speed" | "Durability" | "Hax" | "Scaling" | "Other";
  title: string;
  description: string;
  source: SourceLink;
  confidence: "high" | "medium" | "low";
};

export type DebateArgument = {
  id: string;
  debateId: string;
  userId: string;
  characterTitle: string;
  content: string;
  aiAnalysis?: ArgumentAnalysis;
  createdAt: string;
};

export type ArgumentAnalysis = {
  status: "supported" | "partially_supported" | "debunked" | "needs_source";
  summary: string;
  citedEvidence: SourceLink[];
};

export type Debate = {
  id: string;
  creatorId: string;
  opponentId?: string;
  char1: CharacterProfile;
  char2: CharacterProfile;
  status: "setup" | "active" | "judged" | "closed";
  mode: "solo" | "duel";
  arguments: DebateArgument[];
  verdict?: Verdict;
  createdAt: string;
  judgedAt?: string;
  aiPowered?: boolean;
  aiUsage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
};

export type StatAdvantage = {
  label: string;
  char1Value: string;
  char2Value: string;
  winner: "char1" | "char2" | "tie" | "unknown";
  reasoning: string;
};

export type Verdict = {
  winnerTitle: string;
  loserTitle: string;
  difficulty: "No Diff" | "Low Diff" | "Mid Diff" | "High Diff" | "Extreme Diff";
  confidence: "decisive" | "high" | "medium" | "low" | "narrow";
  summary: string;
  keyFactor: string;
  statBreakdown: StatAdvantage[];
  argumentAnalysis: ArgumentAnalysis[];
  sources: SourceLink[];
  generatedAt: string;
};

export type SearchResult = {
  title: string;
  snippet: string;
  url: string;
};
