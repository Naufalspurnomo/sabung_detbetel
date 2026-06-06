import { judgeDebate } from "./judge";
import { tryLlmJudge } from "./llm";
import { resolveAIConfig } from "./ai-config";
import { getCharacterProfile } from "./vs-wiki-client";
import type { Debate, DebateArgument } from "./types";

declare global {
  // eslint-disable-next-line no-var
  var __vsbattleDebates: Map<string, Debate> | undefined;
}

const debates = globalThis.__vsbattleDebates ?? new Map<string, Debate>();
globalThis.__vsbattleDebates = debates;

export async function createDebate(input: {
  char1Title: string;
  char2Title: string;
  creatorId?: string;
  opponentId?: string;
  mode?: "solo" | "duel";
}): Promise<Debate> {
  const [char1, char2] = await Promise.all([
    getCharacterProfile(input.char1Title),
    getCharacterProfile(input.char2Title)
  ]);

  const debate: Debate = {
    id: crypto.randomUUID(),
    creatorId: input.creatorId ?? "guest",
    opponentId: input.opponentId,
    char1,
    char2,
    status: "active",
    mode: input.mode ?? "solo",
    arguments: [],
    createdAt: new Date().toISOString()
  };

  debates.set(debate.id, debate);
  return debate;
}

export function getDebate(id: string): Debate | undefined {
  return debates.get(id);
}

export function listDebates(): Debate[] {
  return Array.from(debates.values()).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );
}

export function addArgument(input: {
  debateId: string;
  userId?: string;
  characterTitle: string;
  content: string;
}): DebateArgument {
  const debate = debates.get(input.debateId);

  if (!debate) {
    throw new Error("Debat tidak ditemukan");
  }

  const argument: DebateArgument = {
    id: crypto.randomUUID(),
    debateId: input.debateId,
    userId: input.userId ?? "guest",
    characterTitle: input.characterTitle,
    content: input.content,
    createdAt: new Date().toISOString()
  };

  debate.arguments.push(argument);
  debates.set(debate.id, debate);
  return argument;
}

export async function judgeDebateById(
  id: string,
  request?: Request
): Promise<Debate> {
  const debate = debates.get(id);

  if (!debate) {
    throw new Error("Debat tidak ditemukan");
  }

  // Always run rule-based judge (instant, no API needed)
  const ruleVerdict = judgeDebate({
    char1: debate.char1,
    char2: debate.char2,
    arguments: debate.arguments
  });

  // Try AI-powered judge with knowledge base
  const config = resolveAIConfig(request);
  let aiResult = null;

  if (config) {
    aiResult = await tryLlmJudge({
      config,
      char1: debate.char1,
      char2: debate.char2,
      arguments: debate.arguments,
    });
  }

  // Merge: AI verdict overrides rule-based if available
  if (aiResult?.verdict) {
    debate.verdict = {
      ...ruleVerdict,
      ...aiResult.verdict,
      // Keep rule-based stat breakdown as fallback
      statBreakdown: aiResult.verdict.statBreakdown || ruleVerdict.statBreakdown,
      // Mark as AI-powered
      summary: aiResult.verdict.summary || ruleVerdict.summary,
    };
    debate.aiPowered = true;
    debate.aiUsage = aiResult.usage;
  } else {
    debate.verdict = ruleVerdict;
    debate.aiPowered = false;
  }

  debate.status = "judged";
  debate.judgedAt = new Date().toISOString();
  debates.set(debate.id, debate);

  return debate;
}
