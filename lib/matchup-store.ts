import { judgeDebate } from "./judge";
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
  return [...debates.values()].sort((a, b) =>
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

export function judgeDebateById(id: string): Debate {
  const debate = debates.get(id);

  if (!debate) {
    throw new Error("Debat tidak ditemukan");
  }

  debate.verdict = judgeDebate({
    char1: debate.char1,
    char2: debate.char2,
    arguments: debate.arguments
  });
  debate.status = "judged";
  debate.judgedAt = new Date().toISOString();
  debates.set(debate.id, debate);

  return debate;
}
