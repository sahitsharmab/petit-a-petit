import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createDb, schema } from "@/lib/db";
import { open, seal } from "@/lib/ai/secret-box";
import { learnerAiStatus, providerFor, removeLearnerKey, saveLearnerKey, type KeyCheck } from "@/lib/ai/learner";
import { exportProgress, resetProgress } from "@/lib/services/backup";
import { getSettings } from "@/lib/services/stats";

const KEY = "sk-ant-api03-" + "a".repeat(40) + "WXYZ";
const OTHER = "sk-ant-api03-" + "b".repeat(40) + "QRST";
const okCheck: KeyCheck = async () => {};

beforeEach(() => {
  vi.stubEnv("AI_KEY_SECRET", "s".repeat(40));
  vi.stubEnv("AI_PROVIDER", "");
});
afterEach(() => vi.unstubAllEnvs());

describe("secret box", () => {
  it("round-trips, and rejects tampering or another secret", () => {
    const sealed = seal("hello key");
    expect(sealed.startsWith("v1:")).toBe(true);
    expect(sealed).not.toContain("hello");
    expect(open(sealed)).toBe("hello key");
    expect(seal("hello key")).not.toBe(sealed); // fresh IV every time
    const flipped = sealed.slice(0, -2) + (sealed.endsWith("A") ? "BB" : "AA");
    expect(open(flipped)).toBeNull();
    expect(open(sealed, { AI_KEY_SECRET: "t".repeat(40) } as unknown as NodeJS.ProcessEnv)).toBeNull();
    expect(open("garbage")).toBeNull();
  });

  it("falls back to SESSION_SECRET, and refuses to run hosted without any secret", () => {
    const env = { SESSION_SECRET: "q".repeat(40) } as unknown as NodeJS.ProcessEnv;
    expect(open(seal("x", env), env)).toBe("x");
    expect(() => seal("x", { VERCEL: "1" } as unknown as NodeJS.ProcessEnv)).toThrow(/SESSION_SECRET/);
  });
});

describe("a learner's own API key", () => {
  it("is checked, stored encrypted, shown only as a hint, and used for that learner only", async () => {
    const a = await createDb(":memory:");
    const b = await createDb(":memory:", undefined, "de");
    const calls: string[] = [];
    const check: KeyCheck = async (k, m) => { calls.push(`${k.slice(-4)}:${m}`); };

    const status = await saveLearnerKey(a, { apiKey: `  ${KEY} `, model: "claude-sonnet-5-5" }, check);
    expect(calls).toEqual(["WXYZ:claude-sonnet-5-5"]);
    expect(status).toMatchObject({ source: "own", configured: true, model: "claude-sonnet-5-5", keyHint: "…WXYZ" });
    expect(JSON.stringify(status)).not.toContain(KEY);

    const row = await a.select().from(schema.aiCredentials).get();
    expect(row?.keyEncrypted).not.toContain(KEY.slice(10));
    expect((await getSettings(a)).aiEnabled).toBe(true);

    const p = await providerFor(a);
    expect(p).toMatchObject({ name: "anthropic", model: "claude-sonnet-5-5" });
    expect(await providerFor(b)).toBeNull(); // the other learner stays offline
    expect((await learnerAiStatus(b)).source).toBe("none");
  });

  it("changing only the model re-checks the saved key; bad keys and failed checks store nothing", async () => {
    const db = await createDb(":memory:");
    await expect(saveLearnerKey(db, { apiKey: "not-a-key" }, okCheck)).rejects.toMatchObject({ status: 400 });
    await expect(saveLearnerKey(db, { model: "claude-haiku-5-5" }, okCheck)).rejects.toMatchObject({ status: 400 });
    const failing: KeyCheck = async () => { throw Object.assign(new Error("Anthropic didn't accept that key."), { status: 400 }); };
    await expect(saveLearnerKey(db, { apiKey: KEY }, failing)).rejects.toThrow(/didn't accept/);
    expect(await db.select().from(schema.aiCredentials).all()).toHaveLength(0);

    await saveLearnerKey(db, { apiKey: KEY }, okCheck);
    const seen: string[] = [];
    await saveLearnerKey(db, { model: "claude-haiku-5-5" }, async (k, m) => { seen.push(`${k.slice(-4)}:${m}`); });
    expect(seen).toEqual(["WXYZ:claude-haiku-5-5"]);
    expect((await learnerAiStatus(db)).model).toBe("claude-haiku-5-5");
    await expect(saveLearnerKey(db, { model: "gpt-4" }, okCheck)).rejects.toMatchObject({ status: 400 });

    await saveLearnerKey(db, { apiKey: OTHER, model: "claude-opus-5-5" }, okCheck);
    expect((await learnerAiStatus(db)).keyHint).toBe("…QRST");
  });

  it("is never exported, survives a progress reset, and can be removed", async () => {
    const db = await createDb(":memory:");
    await saveLearnerKey(db, { apiKey: KEY }, okCheck);
    const backup = JSON.stringify(await exportProgress(db));
    expect(backup).not.toContain("WXYZ");
    expect(backup).not.toContain("aiCredentials");
    await resetProgress(db);
    expect((await learnerAiStatus(db)).source).toBe("own");
    const after = await removeLearnerKey(db);
    expect(after.source).toBe("none");
    expect(await providerFor(db)).toBeNull();
  });

  it("asks for the key again when the server secret changes", async () => {
    const db = await createDb(":memory:");
    await saveLearnerKey(db, { apiKey: KEY }, okCheck);
    vi.stubEnv("AI_KEY_SECRET", "z".repeat(40));
    const status = await learnerAiStatus(db);
    expect(status.source).toBe("none");
    expect(status.keyProblem).toMatch(/enter it again/);
    expect(await providerFor(db)).toBeNull();
  });
});
