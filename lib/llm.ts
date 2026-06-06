import type { CharacterProfile, DebateArgument, Verdict } from "./types";

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export async function tryLlmJudge(input: {
  systemPrompt: string;
  char1: CharacterProfile;
  char2: CharacterProfile;
  arguments: DebateArgument[];
}): Promise<Partial<Verdict> | null> {
  const groqKey = process.env.GROQ_API_KEY;
  const openAiKey = process.env.OPENAI_API_KEY;

  if (groqKey) {
    return callOpenAiCompatible({
      endpoint: "https://api.groq.com/openai/v1/chat/completions",
      apiKey: groqKey,
      model: process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile",
      messages: buildMessages(input)
    });
  }

  if (openAiKey) {
    return callOpenAiCompatible({
      endpoint: "https://api.openai.com/v1/chat/completions",
      apiKey: openAiKey,
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      messages: buildMessages(input)
    });
  }

  return null;
}

function buildMessages(input: {
  systemPrompt: string;
  char1: CharacterProfile;
  char2: CharacterProfile;
  arguments: DebateArgument[];
}): ChatMessage[] {
  return [
    {
      role: "system",
      content: input.systemPrompt
    },
    {
      role: "user",
      content: JSON.stringify(
        {
          required_output: "Return strict JSON matching the Verdict shape.",
          char1: input.char1,
          char2: input.char2,
          arguments: input.arguments
        },
        null,
        2
      )
    }
  ];
}

async function callOpenAiCompatible(input: {
  endpoint: string;
  apiKey: string;
  model: string;
  messages: ChatMessage[];
}): Promise<Partial<Verdict> | null> {
  try {
    const response = await fetch(input.endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: input.model,
        messages: input.messages,
        temperature: 0.2,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = payload.choices?.[0]?.message?.content;

    if (!content) {
      return null;
    }

    return JSON.parse(content) as Partial<Verdict>;
  } catch {
    return null;
  }
}
