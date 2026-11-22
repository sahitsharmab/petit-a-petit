/**
 * Per-learner AI: each learner can store their own Anthropic API key (encrypted, in their own
 * database). Their key always wins; without one, the deployment's env provider (if any) is used.
 */
import { createHash } from "node:crypto";
import { eq } from "drizzle-orm";
import Anthropic from "@anthropic-ai/sdk";
import type { DB } from "@/lib/db";
import { schema } from "@/lib/db";
import { HttpError } from "@/lib/http-error";
import { open, seal } from "./secret-box";
import { AnthropicProvider, aiStatus, getProvider, type Provider } from "./provider";
import { ANTHROPIC_MODELS, isAnthropicModel, type AiStatus } from "./models";

const hint = (key: string) => `…${key.slice(-4)}`;

async function row(db: DB) {
  return (await db.select().from(schema.aiCredentials).where(eq(schema.aiCredentials.id, 1)).get()) ?? null;
}

/** What the settings page and practice page show. Never includes the key. */
export async function learnerAiStatus(db: DB): Promise<AiStatus> {
  const r = await row(db);
  if (r) {
    if (open(r.keyEncrypted) === null) {
      const env = aiStatus();
      return {
        ...env, source: env.configured ? "server" : "none", keyHint: r.keyHint,
        keyProblem: "Your saved key can't be read any more (the server's secret changed). Please enter it again.",
      };
    }
    return { provider: "anthropic", model: r.model, configured: true, source: "own", keyHint: r.keyHint };
  }
  const env = aiStatus();
  return { ...env, source: env.configured ? "server" : "none" };
}

const providers = new Map<string, AnthropicProvider>();

/** The provider for this learner (own key first, then the server's), or null when offline. */
export async function providerFor(db: DB): Promise<Provider | null> {
  const r = await row(db);
  const key = r ? open(r.keyEncrypted) : null;
  if (r && key) {
    const id = `${createHash("sha256").update(key).digest("hex").slice(0, 16)}:${r.model}`;
    let p = providers.get(id);
    if (!p) providers.set(id, (p = new AnthropicProvider(r.model, key)));
    return p;
  }
  return getProvider();
}

export type KeyCheck = (apiKey: string, model: string) => Promise<void>;

/** Checks the key against Anthropic without spending tokens (Models API). */
export const checkAnthropicKey: KeyCheck = async (apiKey, model) => {
  const client = new Anthropic({ apiKey, maxRetries: 1, timeout: 15_000 });
  try {
    await client.models.retrieve(model);
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) throw new HttpError(400, "Anthropic didn't accept that key. Check you copied all of it.");
    if (err instanceof Anthropic.PermissionDeniedError || err instanceof Anthropic.NotFoundError) {
      throw new HttpError(400, "That key works, but it can't use this model. Try another model.");
    }
    if (err instanceof Anthropic.RateLimitError) throw new HttpError(429, "Anthropic is rate-limiting this key right now. Try again in a minute.");
    if (err instanceof Anthropic.APIError) throw new HttpError(502, `Anthropic returned an error (${err.status ?? "network"}). Try again later.`);
    throw new HttpError(502, "Couldn't reach Anthropic to check the key. Try again later.");
  }
};

/**
 * Save (or replace) the learner's key, or change only the model of a saved key.
 * The key is checked first; nothing is stored unless Anthropic accepts it.
 */
export async function saveLearnerKey(db: DB, input: { apiKey?: string; model?: string }, check: KeyCheck = checkAnthropicKey) {
  const model = input.model ?? ANTHROPIC_MODELS[0].id;
  if (!isAnthropicModel(model)) throw new HttpError(400, "Unknown model.");
  const current = await row(db);
  const apiKey = input.apiKey?.trim() || (current ? open(current.keyEncrypted) : null);
  if (!apiKey) throw new HttpError(400, "Paste your Anthropic API key first.");
  if (!/^sk-ant-[\w-]{20,}$/.test(apiKey)) throw new HttpError(400, "That doesn't look like an Anthropic API key (it should start with sk-ant-).");
  if (input.apiKey || model !== current?.model) await check(apiKey, model);
  const values = { id: 1, provider: "anthropic", model, keyEncrypted: seal(apiKey), keyHint: hint(apiKey), updatedAt: new Date().toISOString() };
  await db.batch([
    db.insert(schema.aiCredentials).values(values).onConflictDoUpdate({ target: schema.aiCredentials.id, set: values }),
    // Saving a key means "use it": switch AI features on.
    db.update(schema.learningSettings).set({ aiEnabled: true }).where(eq(schema.learningSettings.id, 1)),
  ]);
  return learnerAiStatus(db);
}

export async function removeLearnerKey(db: DB) {
  await db.delete(schema.aiCredentials).run();
  return learnerAiStatus(db);
}
