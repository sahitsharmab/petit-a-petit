import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { loadEnvConfig } from "@next/env";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { SESSION_COOKIE, passwordVersion, signSession, verifySession } from "@/lib/auth/session";
import { AuthConfigError, findUser, loadUsers } from "@/lib/auth/users";
import { openDb, schema } from "@/lib/db";
import { getOrCreateDailyLesson } from "@/lib/services/lessons";

const SECRET = "x".repeat(40);
const now = () => Math.floor(Date.now() / 1000);

describe("passwords", () => {
  it("verifies the right password and rejects others", async () => {
    const h = await hashPassword("croissant-42");
    expect(h).toMatch(/^scrypt:16384:8:1:/);
    expect(h).not.toContain("$"); // safe to paste into .env files
    expect(await verifyPassword("croissant-42", h)).toBe(true);
    expect(await verifyPassword("croissant-43", h)).toBe(false);
    expect(await verifyPassword("croissant-42", "not-a-hash")).toBe(false);
    await expect(hashPassword("short")).rejects.toThrow(/8 characters/);
  });

  it("survives Next's .env loader unchanged", async () => {
    const h = await hashPassword("croissant-42");
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "francais-env-"));
    // (.env.local is skipped under NODE_ENV=test; .env goes through the same variable expansion.)
    fs.writeFileSync(path.join(dir, ".env"), `USER_TEST_PASSWORD_HASH=${h}\nOLD_STYLE=scrypt$16384$8\n`);
    const { combinedEnv } = loadEnvConfig(dir, false, { info: () => {}, error: () => {} }, true);
    fs.rmSync(dir, { recursive: true, force: true });
    expect(combinedEnv.USER_TEST_PASSWORD_HASH).toBe(h);
    // The old "$"-separated format would have been mangled:
    expect(combinedEnv.OLD_STYLE).not.toBe("scrypt$16384$8");
  });
});

describe("session cookies", () => {
  it("round-trips and rejects tampering, other secrets and expiry", async () => {
    const t = await signSession({ u: "ana", exp: now() + 60, v: "abc" }, SECRET);
    expect(await verifySession(t, SECRET)).toMatchObject({ u: "ana", v: "abc" });
    const [body, sig] = t.split(".");
    const forged = Buffer.from(JSON.stringify({ u: "sam", exp: now() + 60, v: "abc" })).toString("base64url");
    expect(await verifySession(`${forged}.${sig}`, SECRET)).toBeNull();
    expect(await verifySession(`${body}.${sig}x`, SECRET)).toBeNull();
    expect(await verifySession(t, "y".repeat(40))).toBeNull();
    expect(await verifySession(await signSession({ u: "ana", exp: now() - 1, v: "abc" }, SECRET), SECRET)).toBeNull();
    expect(await verifySession(undefined, SECRET)).toBeNull();
    expect(await verifySession("garbage", SECRET)).toBeNull();
  });
});

describe("user configuration", () => {
  it("is a single local learner without APP_USERS (and never on Vercel)", () => {
    expect(loadUsers({} as NodeJS.ProcessEnv)).toEqual([{ id: "local", name: "", passwordHash: null, dbUrl: "data/french.db" }]);
    expect(() => loadUsers({ VERCEL: "1" } as unknown as NodeJS.ProcessEnv)).toThrow(AuthConfigError);
  });

  it("reads each learner and validates hosted settings", () => {
    const env = {
      APP_USERS: "sahit, ana-b", USER_SAHIT_PASSWORD_HASH: "scrypt:h1", USER_ANA_B_PASSWORD_HASH: "scrypt:h2", USER_ANA_B_NAME: "Ana",
    } as unknown as NodeJS.ProcessEnv;
    const users = loadUsers(env);
    expect(users.map((u) => [u.id, u.name, u.dbUrl])).toEqual([["sahit", "Sahit", "data/sahit.db"], ["ana-b", "Ana", "data/ana-b.db"]]);
    expect(findUser("ANA", env)?.id).toBe("ana-b");
    expect(findUser("sahit", env)?.id).toBe("sahit");
    expect(findUser("nobody", env)).toBeNull();
    // Hosted: every learner needs a remote database.
    expect(() => loadUsers({ ...env, VERCEL: "1" })).toThrow(/DB_URL is not set/);
    expect(() => loadUsers({ ...env, VERCEL: "1", USER_SAHIT_DB_URL: "file:x.db", USER_ANA_B_DB_URL: "libsql://b.turso.io" })).toThrow(/remote/);
    expect(() => loadUsers({ APP_USERS: "Bad Id!" } as unknown as NodeJS.ProcessEnv)).toThrow(/Invalid user id/);
    expect(() => loadUsers({ APP_USERS: "sam" } as unknown as NodeJS.ProcessEnv)).toThrow(/PASSWORD_HASH/);
  });
});

describe("separate progress per learner", () => {
  it("keeps each learner's lessons in their own database", async () => {
    const a = await openDb("a", ":memory:");
    const b = await openDb("b", ":memory:");
    await getOrCreateDailyLesson(a, new Date("2026-11-16T19:00:00Z"));
    expect(await a.select().from(schema.generatedLessons).all()).toHaveLength(1);
    expect(await b.select().from(schema.generatedLessons).all()).toHaveLength(0);
  });
});

describe("login gate (proxy)", () => {
  afterEach(() => vi.unstubAllEnvs());

  async function setup() {
    const hash = await hashPassword("croissant-42");
    vi.stubEnv("APP_USERS", "ana");
    vi.stubEnv("USER_ANA_PASSWORD_HASH", hash);
    vi.stubEnv("SESSION_SECRET", SECRET);
    const { proxy } = await import("@/proxy");
    const token = await signSession({ u: "ana", exp: now() + 600, v: await passwordVersion(hash) }, SECRET);
    return { proxy, token, hash };
  }
  const req = (path: string, token?: string) =>
    new NextRequest(`http://127.0.0.1:3000${path}`, token ? { headers: { cookie: `${SESSION_COOKIE}=${token}` } } : undefined);

  it("redirects signed-out pages to /login and answers 401 for the API", async () => {
    const { proxy } = await setup();
    const page = await proxy(req("/progress?tab=1"));
    expect(page.status).toBe(307);
    const loc = new URL(page.headers.get("location")!);
    expect(loc.pathname + loc.search).toBe("/login?next=%2Fprogress%3Ftab%3D1");
    expect((await proxy(req("/api/export"))).status).toBe(401);
    expect((await proxy(req("/login"))).status).toBe(200);
    expect((await proxy(req("/api/auth/login"))).status).toBe(200);
  });

  it("lets a valid session through, and a password change signs it out", async () => {
    const { proxy, token } = await setup();
    expect((await proxy(req("/api/export", token))).status).toBe(200);
    vi.stubEnv("USER_ANA_PASSWORD_HASH", await hashPassword("new-password-1"));
    expect((await proxy(req("/api/export", token))).status).toBe(401);
  });

  it("fails closed when the secret is missing", async () => {
    const { proxy, token } = await setup();
    vi.stubEnv("SESSION_SECRET", "");
    expect((await proxy(req("/api/export", token))).status).toBe(401);
  });
});
