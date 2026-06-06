/**
 * LLM Integration
 *
 * OpenAI-compatible chat completion client.
 * Supports any provider (Groq, OpenAI, OpenRouter, local, etc.) via configurable API URL.
 * Integrates Death Battle knowledge base into system prompts.
 */

import type { AIConfig } from "./ai-config";
import type { CharacterProfile, DebateArgument, Verdict } from "./types";
import { buildKnowledgeSystemPrompt, enrichProfile } from "./knowledge-service";

// ═══════════════════════════════════════════
// Types
// ═══════════════════════════════════════════

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

interface LLMResponse {
  verdict: Partial<Verdict>;
  raw?: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// ═══════════════════════════════════════════
// Main Entry Point
// ═══════════════════════════════════════════

/**
 * Try to get an AI-powered verdict using user-configured or env-based LLM.
 * Returns null if no API is configured or if the call fails.
 */
export async function tryLlmJudge(input: {
  config: AIConfig | null;
  char1: CharacterProfile;
  char2: CharacterProfile;
  arguments: DebateArgument[];
}): Promise<LLMResponse | null> {
  if (!input.config) return null;

  const messages = buildMessages({
    char1: input.char1,
    char2: input.char2,
    arguments: input.arguments,
  });

  return callLLM({
    config: input.config,
    messages,
  });
}

/**
 * Test if an AI config is valid by making a simple completion call.
 */
export async function testAIConnection(config: AIConfig): Promise<{
  ok: boolean;
  model?: string;
  error?: string;
}> {
  try {
    const response = await fetch(config.apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: config.model,
        messages: [{ role: "user", content: "Say 'OK' in one word." }],
        max_tokens: 10,
        temperature: 0,
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      return {
        ok: false,
        error: `HTTP ${response.status}: ${body.slice(0, 200)}`,
      };
    }

    const data = (await response.json()) as {
      model?: string;
      choices?: Array<{ message?: { content?: string } }>;
    };

    return {
      ok: true,
      model: data.model || config.model,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

// ═══════════════════════════════════════════
// Message Builder
// ═══════════════════════════════════════════

function buildMessages(input: {
  char1: CharacterProfile;
  char2: CharacterProfile;
  arguments: DebateArgument[];
}): ChatMessage[] {
  // Build knowledge-enriched system prompt
  const knowledgePrompt = buildKnowledgeSystemPrompt();

  // Enrich character profiles with knowledge base data
  const enriched1 = enrichProfile(input.char1);
  const enriched2 = enrichProfile(input.char2);

  const systemPrompt = `${knowledgePrompt}

## Current Matchup Analysis

You are analyzing: **${input.char1.pageTitle}** vs **${input.char2.pageTitle}**

### Character 1: ${input.char1.pageTitle}
- Tier: ${input.char1.tier || "Unknown"}
- Attack Potency: ${input.char1.attackPotency || "Unknown"}
- Speed: ${input.char1.speed || "Unknown"}
- Durability: ${input.char1.durability || "Unknown"}
- Intelligence: ${input.char1.intelligence || "Unknown"}
- Abilities: ${input.char1.abilities.join(", ") || "None parsed"}
- Hax count: ${enriched1.haxCount} (${enriched1.haxList.join(", ") || "none"})
- Weaknesses: ${input.char1.weaknesses.join(", ") || "None parsed"}

### Character 2: ${input.char2.pageTitle}
- Tier: ${input.char2.tier || "Unknown"}
- Attack Potency: ${input.char2.attackPotency || "Unknown"}
- Speed: ${input.char2.speed || "Unknown"}
- Durability: ${input.char2.durability || "Unknown"}
- Intelligence: ${input.char2.intelligence || "Unknown"}
- Abilities: ${input.char2.abilities.join(", ") || "None parsed"}
- Hax count: ${enriched2.haxCount} (${enriched2.haxList.join(", ") || "none"})
- Weaknesses: ${input.char2.weaknesses.join(", ") || "None parsed"}

${input.arguments.length > 0 ? `### User Arguments\n${input.arguments.map((a, i) => `[${i + 1}] ${a.characterTitle}: ${a.content}`).join("\n")}` : ""}`;

  const userMessage = `Analyze this Death Battle matchup and return a JSON verdict.

Required JSON schema:
{
  "winnerTitle": "character name",
  "loserTitle": "character name",
  "difficulty": "No Diff" | "Low Diff" | "Mid Diff" | "High Diff" | "Extreme Diff",
  "confidence": "decisive" | "high" | "medium" | "low" | "narrow",
  "summary": "2-3 sentence explanation in Indonesian",
  "keyFactor": "the single most important factor",
  "statBreakdown": [
    {"label": "Attack Potency", "char1Value": "...", "char2Value": "...", "winner": "char1|char2|tie|unknown", "reasoning": "..."},
    {"label": "Speed", "char1Value": "...", "char2Value": "...", "winner": "...", "reasoning": "..."},
    {"label": "Durability", "char1Value": "...", "char2Value": "...", "winner": "...", "reasoning": "..."},
    {"label": "Hax / Ability", "char1Value": "...", "char2Value": "...", "winner": "...", "reasoning": "..."}
  ]
}

IMPORTANT:
- Only use data from the profiles above. Do NOT invent feats.
- Apply Death Battle rules: feats > statements, no outside help, both at peak.
- If tier is unknown, say so explicitly.
- Return ONLY valid JSON, no markdown fences.`;

  return [
    { role: "system", content: systemPrompt },
    { role: "user", content: userMessage },
  ];
}

// ═══════════════════════════════════════════
// LLM Caller
// ═══════════════════════════════════════════

async function callLLM(input: {
  config: AIConfig;
  messages: ChatMessage[];
}): Promise<LLMResponse | null> {
  try {
    const response = await fetch(input.config.apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: input.config.model,
        messages: input.messages,
        temperature: input.config.temperature ?? 0.2,
        max_tokens: input.config.maxTokens ?? 4096,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      console.error(`[LLM] HTTP ${response.status}: ${await response.text().catch(() => "")}`);
      return null;
    }

    const data = (await response.json()) as {
      model?: string;
      choices?: Array<{ message?: { content?: string } }>;
      usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
    };

    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;

    // Parse JSON response, handling potential markdown fences
    const jsonStr = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const verdict = JSON.parse(jsonStr) as Partial<Verdict>;

    return {
      verdict,
      raw: content,
      usage: data.usage,
    };
  } catch (err) {
    console.error("[LLM] Error:", err);
    return null;
  }
}
