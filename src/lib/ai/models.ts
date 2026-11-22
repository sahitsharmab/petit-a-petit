/** Browser-safe AI constants and types (no SDK imports). */

export type ProviderName = "anthropic" | "ollama";

/** Models a learner can pick for their own key (default first). */
export const ANTHROPIC_MODELS = [
  { id: "claude-opus-5-5", label: "Claude Opus 5.5", note: "best quality" },
  { id: "claude-sonnet-5-5", label: "Claude Sonnet 5.5", note: "faster, about half the price" },
  { id: "claude-haiku-5-5", label: "Claude Haiku 5.5", note: "cheapest" },
] as const;
export type AnthropicModel = (typeof ANTHROPIC_MODELS)[number]["id"];
export const isAnthropicModel = (m: unknown): m is AnthropicModel => ANTHROPIC_MODELS.some((x) => x.id === m);

export interface AiStatus {
  provider: ProviderName | "none";
  model: string | null;
  configured: boolean;
  reason?: string;
  /** "own" = the learner's own key, "server" = the deployment's env settings. */
  source?: "own" | "server" | "none";
  /** Last characters of the learner's own key, for display. */
  keyHint?: string;
  /** The stored key can't be read (e.g. the server secret changed). */
  keyProblem?: string;
}
