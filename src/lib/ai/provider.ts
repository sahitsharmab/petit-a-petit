import Anthropic from "@anthropic-ai/sdk";

/**
 * LLM provider adapter. Server-side only — API keys (a learner's own, stored encrypted, or the
 * server's from environment variables) never reach the browser. See ./learner for per-learner keys.
 */
import type { AiStatus, ProviderName } from "./models";
export { ANTHROPIC_MODELS, isAnthropicModel, type AiStatus, type AnthropicModel, type ProviderName } from "./models";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface Provider {
  name: ProviderName;
  model: string;
  /** Returns the model's raw text reply. */
  complete(opts: { system: string; messages: ChatMessage[]; maxTokens?: number; timeoutMs?: number; json?: boolean }): Promise<string>;
}

/** The deployment-wide provider from environment variables. */
export function aiStatus(): AiStatus {
  const p = (process.env.AI_PROVIDER ?? "none").toLowerCase();
  if (p === "anthropic") {
    if (!process.env.ANTHROPIC_API_KEY) return { provider: "anthropic", model: null, configured: false, reason: "ANTHROPIC_API_KEY is not set." };
    return { provider: "anthropic", model: process.env.ANTHROPIC_MODEL || "claude-opus-5-5", configured: true };
  }
  if (p === "ollama") {
    return { provider: "ollama", model: process.env.OLLAMA_MODEL || "llama3.1:8b", configured: true };
  }
  return { provider: "none", model: null, configured: false, reason: "AI_PROVIDER is not set — running fully offline." };
}

export class AnthropicProvider implements Provider {
  name = "anthropic" as const;
  private client: Anthropic;
  /** apiKey: a learner's own key; omitted = the server's ANTHROPIC_API_KEY. */
  constructor(public model: string, apiKey?: string) {
    this.client = new Anthropic({ maxRetries: 1, ...(apiKey ? { apiKey } : {}) });
  }
  async complete({ system, messages, maxTokens = 2000, timeoutMs = 45_000 }: Parameters<Provider["complete"]>[0]) {
    // Haiku has no server-side refusal fallback; the other models opt in to it.
    const fallback = this.model.startsWith("claude-haiku")
      ? {}
      : { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const };
    const response = await this.client.beta.messages.create(
      {
        model: this.model,
        max_tokens: maxTokens,
        system,
        messages,
        // Tutoring replies are short; low effort keeps them fast.
        output_config: { effort: "low" },
        ...fallback,
      },
      { timeout: timeoutMs },
    );
    if (response.stop_reason === "refusal") throw new Error("The model declined this request.");
    const text = response.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
    if (!text.trim()) throw new Error(`Empty response (stop_reason: ${response.stop_reason}).`);
    return text;
  }
}

class OllamaProvider implements Provider {
  name = "ollama" as const;
  constructor(public model: string, private baseUrl: string) {}
  async complete({ system, messages, timeoutMs = 90_000, json = true }: Parameters<Provider["complete"]>[0]) {
    const res = await fetch(`${this.baseUrl.replace(/\/$/, "")}/api/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        model: this.model,
        stream: false,
        ...(json ? { format: "json" } : {}),
        options: { temperature: 0.4 },
        messages: [{ role: "system", content: system }, ...messages],
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) throw new Error(`Ollama HTTP ${res.status}`);
    const data = (await res.json()) as { message?: { content?: string } };
    const text = data.message?.content ?? "";
    if (!text.trim()) throw new Error("Empty Ollama response.");
    return text;
  }
}

let cached: { key: string; provider: Provider | null } | null = null;

/** The configured provider, or null when running offline. */
export function getProvider(): Provider | null {
  const status = aiStatus();
  const key = `${status.provider}:${status.model}`;
  if (cached?.key === key) return cached.provider;
  let provider: Provider | null = null;
  if (status.configured && status.provider === "anthropic") provider = new AnthropicProvider(status.model!);
  if (status.configured && status.provider === "ollama") provider = new OllamaProvider(status.model!, process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434");
  cached = { key, provider };
  return provider;
}

/** Extract the first JSON object from a model reply (tolerates code fences / prose). */
export function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = fenced ? fenced[1] : text;
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("No JSON object in response.");
  return JSON.parse(body.slice(start, end + 1));
}
