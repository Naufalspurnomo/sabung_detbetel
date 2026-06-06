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
  // Build knowledge-enriched system prompt (includes science + format)
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

  const userMessage = `Analyze this Death Battle matchup using the FULL scientific methodology from your system prompt.

You MUST follow the Death Battle format:
1. Character Breakdown (origin, key version, tier, best feat, key abilities, weaknesses)
2. Stat Comparison (AP, Speed, Durability, Lifting, Striking, Stamina, Range, Intelligence — with winner per category)
3. Feat Analysis (SHOW YOUR CALCULATIONS — convert feats to Joules, m/s, Newtons using real physics)
4. Hax Analysis (list all hax abilities and whether they work on the opponent)
5. Intelligence & Experience comparison
6. Verdict with difficulty and confidence

Return your analysis as JSON with this schema:

{
  "winnerTitle": "character name",
  "loserTitle": "character name",
  "difficulty": "No Diff" | "Neg Diff" | "Low Diff" | "Mid Diff" | "High Diff" | "Extreme Diff",
  "confidence": "decisive" | "high" | "medium" | "low" | "narrow",
  "summary": "2-3 sentence explanation in Indonesian — dramatic but grounded in analysis",
  "keyFactor": "the SINGLE most important reason this character wins",
  "characterBreakdown": {
    "char1": {
      "origin": "brief backstory",
      "keyVersion": "which version and why",
      "tier": "tier with reasoning",
      "bestFeat": "specific feat with calculation",
      "keyAbilities": ["top 3-5 abilities"],
      "weaknesses": ["exploitable weaknesses"]
    },
    "char2": { "same structure" }
  },
  "statBreakdown": [
    {"label": "Attack Potency", "char1Value": "value with calc", "char2Value": "value with calc", "winner": "char1|char2|tie|unknown", "reasoning": "why, with feat reference"},
    {"label": "Speed", "char1Value": "...", "char2Value": "...", "winner": "...", "reasoning": "..."},
    {"label": "Durability", "char1Value": "...", "char2Value": "...", "winner": "...", "reasoning": "..."},
    {"label": "Lifting Strength", "char1Value": "...", "char2Value": "...", "winner": "...", "reasoning": "..."},
    {"label": "Striking Strength", "char1Value": "...", "char2Value": "...", "winner": "...", "reasoning": "..."},
    {"label": "Stamina", "char1Value": "...", "char2Value": "...", "winner": "...", "reasoning": "..."},
    {"label": "Range", "char1Value": "...", "char2Value": "...", "winner": "...", "reasoning": "..."},
    {"label": "Intelligence", "char1Value": "...", "char2Value": "...", "winner": "...", "reasoning": "..."}
  ],
  "featAnalysis": {
    "char1AP": {"feat": "description", "calculation": "show the math", "result_joules": 0, "source": "episode/chapter"},
    "char2AP": {"same"},
    "char1Speed": {"feat": "...", "calculation": "...", "result_mps": 0, "source": "..."},
    "char2Speed": {"same"},
    "char1Durability": {"feat": "...", "equivalent_energy_joules": 0, "source": "..."},
    "char2Durability": {"same"}
  },
  "haxAnalysis": {
    "char1Hax": [{"ability": "name", "description": "what it does", "effective": true|false, "reason": "why it would/wouldn't work"}],
    "char2Hax": [{"same"}],
    "haxVerdict": "who has hax advantage and why"
  },
  "intelligenceComparison": {
    "char1": "combat IQ, experience, tactics",
    "char2": "same",
    "advantage": "who and why"
  }
}

CRITICAL RULES:
- SHOW YOUR CALCULATIONS for feats. Convert to real units (Joules, m/s, Newtons).
- Use the physics formulas and reference feats from your system prompt.
- Only use data from the profiles above. Do NOT invent feats.
- Apply Death Battle rules: feats > statements, no outside help, both at peak.
- If tier is unknown, say so explicitly.
- Respond in Indonesian for summary. Technical terms in English.
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
