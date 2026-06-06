/**
 * AI Configuration
 *
 * Manages user-configurable AI settings (API URL, API key, model).
 * Config flows: Settings page → localStorage → API request headers → server-side LLM call.
 * Also supports env vars as fallback for self-hosted deployments.
 */

// ═══════════════════════════════════════════
// Types
// ═══════════════════════════════════════════

export interface AIConfig {
  /** OpenAI-compatible API base URL (e.g., https://api.groq.com/openai/v1) */
  apiUrl: string;
  /** API key for authentication */
  apiKey: string;
  /** Model identifier (e.g., llama-3.3-70b-versatile, gpt-4o-mini) */
  model: string;
  /** Optional: max tokens for response */
  maxTokens?: number;
  /** Optional: temperature (0-2) */
  temperature?: number;
}

export interface AIConfigStatus {
  configured: boolean;
  source: "user" | "env" | "none";
  apiUrl: string;
  model: string;
  hasApiKey: boolean;
}

// ═══════════════════════════════════════════
// Server-Side Config Resolution
// ═══════════════════════════════════════════

/**
 * Resolve AI config from request headers (user-configured) or env vars (fallback).
 * Called server-side in API routes.
 */
export function resolveAIConfig(request?: Request): AIConfig | null {
  // Priority 1: User-configured via request headers
  if (request) {
    const headerUrl = request.headers.get("x-ai-api-url");
    const headerKey = request.headers.get("x-ai-api-key");
    const headerModel = request.headers.get("x-ai-model");

    if (headerUrl && headerKey && headerModel) {
      return {
        apiUrl: normalizeUrl(headerUrl),
        apiKey: headerKey,
        model: headerModel,
        maxTokens: parseInt(request.headers.get("x-ai-max-tokens") || "4096", 10),
        temperature: parseFloat(request.headers.get("x-ai-temperature") || "0.2"),
      };
    }
  }

  // Priority 2: Env vars (for self-hosted / development)
  const envUrl = process.env.AI_API_URL;
  const envKey = process.env.AI_API_KEY;
  const envModel = process.env.AI_MODEL;

  if (envUrl && envKey && envModel) {
    return {
      apiUrl: normalizeUrl(envUrl),
      apiKey: envKey,
      model: envModel,
      maxTokens: parseInt(process.env.AI_MAX_TOKENS || "4096", 10),
      temperature: parseFloat(process.env.AI_TEMPERATURE || "0.2"),
    };
  }

  // Priority 3: Legacy Groq/OpenAI env vars
  if (process.env.GROQ_API_KEY) {
    return {
      apiUrl: "https://api.groq.com/openai/v1",
      apiKey: process.env.GROQ_API_KEY,
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
      maxTokens: 4096,
      temperature: 0.2,
    };
  }

  if (process.env.OPENAI_API_KEY) {
    return {
      apiUrl: "https://api.openai.com/v1",
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      maxTokens: 4096,
      temperature: 0.2,
    };
  }

  return null;
}

/**
 * Get config status for display (never exposes API key).
 */
export function getAIConfigStatus(request?: Request): AIConfigStatus {
  const config = resolveAIConfig(request);

  if (!config) {
    return {
      configured: false,
      source: "none",
      apiUrl: "",
      model: "",
      hasApiKey: false,
    };
  }

  // Determine source
  let source: "user" | "env" = "env";
  if (request) {
    const headerUrl = request.headers.get("x-ai-api-url");
    if (headerUrl) source = "user";
  }

  return {
    configured: true,
    source,
    apiUrl: config.apiUrl,
    model: config.model,
    hasApiKey: true,
  };
}

// ═══════════════════════════════════════════
// Client-Side Config (localStorage)
// ═══════════════════════════════════════════

const STORAGE_KEY = "vsbattle-ai-config";

/**
 * Save AI config to localStorage (client-side only).
 */
export function saveClientConfig(config: AIConfig): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

/**
 * Load AI config from localStorage (client-side only).
 */
export function loadClientConfig(): AIConfig | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AIConfig;
  } catch {
    return null;
  }
}

/**
 * Clear AI config from localStorage.
 */
export function clearClientConfig(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Build headers object for fetch requests with AI config.
 */
export function buildAIHeaders(config: AIConfig): Record<string, string> {
  return {
    "x-ai-api-url": config.apiUrl,
    "x-ai-api-key": config.apiKey,
    "x-ai-model": config.model,
    ...(config.maxTokens ? { "x-ai-max-tokens": String(config.maxTokens) } : {}),
    ...(config.temperature !== undefined ? { "x-ai-temperature": String(config.temperature) } : {}),
  };
}

// ═══════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════

function normalizeUrl(url: string): string {
  // Remove trailing slash
  let normalized = url.replace(/\/+$/, "");
  // Ensure it ends with /chat/completions for OpenAI-compatible APIs
  if (!normalized.endsWith("/chat/completions")) {
    // If it ends with /v1, append /chat/completions
    if (normalized.endsWith("/v1")) {
      normalized += "/chat/completions";
    } else if (!normalized.includes("/chat/completions")) {
      // Assume it's a base URL, append standard path
      normalized += "/v1/chat/completions";
    }
  }
  return normalized;
}
