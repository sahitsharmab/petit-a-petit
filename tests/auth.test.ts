import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { SESSION_COOKIE, passwordVersion, signSession, verifySession } from "@/lib/auth/session";
import { AuthConfigError, accountsDbConfig, authEnabled, localUser, signupsOpen } from "@/lib/auth/users";
import { createAccount, getAccount, listAccounts, resetAccountsCache } from "@/lib/auth/accounts";
import { provisionLearnerDb } from "@/lib/auth/provision";
import { userFromToken } from "@/lib/auth/current";
import { HttpError } from "@/lib/http-error";
import { openDb, schema } from "@/lib/db";
import { getOrCreateDailyLesson } from "@/lib/services/lessons";

const SECRET = "x".repeat(40);
const now = () => Math.floor(Date.now() / 1000);
const env = (e: Record<string, string>) => e as unknown as NodeJS.ProcessEnv;

describe("passwords", () => {
  it("verifies the right password and rejects others", async () => {
    const h = await hashPassword("croissant-42");
    expect(h).toMatch(/^scrypt:16384:8:1:/);
    expect(await verifyPassword("croissant-42", h)).toBe(true);
    expect(await verifyPassword("croissant-43", h)).toBe(false);
    expect(await verifyPassword("croissant-42", "not-a-hash")).toBe(false);
    await expect(hashPassword("short")).rejects.toThrow(/8 characters/);
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

describe("configuration", () => {
  it("is a single local learner by default, and accounts on Vercel or with ACCOUNTS_DB_URL", () => {
    expect(authEnabled(env({}))).toBe(false);
    expect(localUser(env({}))).toEqual({ id: "local", name: "", passwordHash: null, dbUrl: "data/french.db", lang: "fr" });
    expect(localUser(env({ FRANCAIS_LANG: "de" }))).toMatchObject({ dbUrl: "data/de.db", lang: "de" });
    expect(authEnabled(env({ VERCEL: "1" }))).toBe(true);
    expect(authEnabled(env({ ACCOUNTS_DB_URL: "data/accounts.db" }))).toBe(true);
    expect(() => accountsDbConfig(env({ VERCEL: "1" }))).toThrow(AuthConfigError);
    expect(() => accountsDbConfig(env({ VERCEL: "1", ACCOUNTS_DB_URL: "data/accounts.db" }))).toThrow(/remote/);
    expect(accountsDbConfig(env({ VERCEL: "1", ACCOUNTS_DB_URL: "libsql://a.turso.io", ACCOUNTS_DB_TOKEN: "t" }))).toEqual({ url: "libsql://a.turso.io", authToken: "t" });
    expect(signupsOpen(env({}))).toBe(true);
    expect(signupsOpen(env({ SIGNUPS: "Closed" }))).toBe(false);
  });
});

describe("accounts (local files)", () => {
  let dir: string;
  let e: NodeJS.ProcessEnv;
  beforeEach(() => {
    resetAccountsCache();
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "francais-accounts-"));
    e = env({ ACCOUNTS_DB_URL: path.join(dir, "accounts.db"), SESSION_SECRET: SECRET });
  });

  it("signs up, finds the account case-insensitively, and gives it its own database file", async () => {
    const u = await createAccount({ username: "Ana-B", password: "croissant-42" }, e);
    expect(u).toMatchObject({ id: "ana-b", name: "Ana-B", dbUrl: path.join(dir, "ana-b.db") });
    expect(fs.existsSync(path.join(dir, "ana-b.db"))).toBe(true); // migrated at sign-up
    const found = await getAccount("ANA-B", e);
    expect(found?.id).toBe("ana-b");
    expect(await verifyPassword("croissant-42", found!.passwordHash!)).toBe(true);
    expect(await getAccount("nobody", e)).toBeNull();
    expect((await listAccounts(e)).map((a) => a.id)).toEqual(["ana-b"]);
    expect(found?.lang).toBe("fr");
  });

  it("remembers the course chosen at sign-up", async () => {
    const u = await createAccount({ username: "maya", password: "croissant-42", lang: "de" }, e);
    expect(u.lang).toBe("de");
    resetAccountsCache();
    expect((await getAccount("maya", e))?.lang).toBe("de");
    await expect(createAccount({ username: "zed", password: "croissant-42", lang: "es" as never }, e)).rejects.toMatchObject({ status: 400 });
  });

  it("rejects taken usernames, bad usernames and short passwords", async () => {
    await createAccount({ username: "sahit", password: "croissant-42" }, e);
    await expect(createAccount({ username: "SAHIT", password: "another-pass" }, e)).rejects.toMatchObject({ status: 409 });
    await expect(createAccount({ username: "a b", password: "croissant-42" }, e)).rejects.toMatchObject({ status: 400 });
    await expect(createAccount({ username: "ok", password: "croissant-42" }, e)).rejects.toBeInstanceOf(HttpError);
    await expect(createAccount({ username: "maya", password: "short" }, e)).rejects.toMatchObject({ status: 400 });
    // Concurrent sign-ups for one name: exactly one wins.
    const r = await Promise.allSettled([1, 2, 3].map(() => createAccount({ username: "maya", password: "croissant-42" }, e)));
    expect(r.filter((x) => x.status === "fulfilled")).toHaveLength(1);
  });

  it("checks session tokens against the account (password change signs out)", async () => {
    const u = await createAccount({ username: "ana", password: "croissant-42" }, e);
    const token = await signSession({ u: "ana", exp: now() + 600, v: await passwordVersion(u.passwordHash!) }, SECRET);
    expect((await userFromToken(token, e))?.id).toBe("ana");
    const stale = await signSession({ u: "ana", exp: now() + 600, v: "old-version" }, SECRET);
    expect(await userFromToken(stale, e)).toBeNull();
    const ghost = await signSession({ u: "ghost", exp: now() + 600, v: "x" }, SECRET);
    expect(await userFromToken(ghost, e)).toBeNull();
  });

  it("is never available on Vercel without Turso API settings", async () => {
    await expect(provisionLearnerDb("ana", "libsql://a.turso.io", env({ VERCEL: "1" }))).rejects.toThrow(/TURSO_API_TOKEN/);
  });
});

describe("Turso provisioning", () => {
  const T = env({ TURSO_API_TOKEN: "api-token", TURSO_ORG: "my-org" });
  type Call = { method: string; url: string; body?: unknown; auth: string | null };

  function fakeTurso(failToken = false) {
    const calls: Call[] = [];
    const fetchImpl = (async (url: string, init: RequestInit) => {
      const headers = new Headers(init.headers);
      calls.push({ method: init.method ?? "GET", url, body: init.body ? JSON.parse(String(init.body)) : undefined, auth: headers.get("authorization") });
      const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status });
      if (init.method === "POST" && url.endsWith("/databases")) {
        const name = (JSON.parse(String(init.body)) as { name: string }).name;
        return json(200, { database: { DbId: "id1", Name: name, Hostname: `${name}-my-org.turso.io` } });
      }
      if (url.includes("/auth/tokens")) return failToken ? json(500, { error: "boom" }) : json(200, { jwt: "db-jwt" });
      if (init.method === "DELETE") return json(200, { database: "x" });
      return json(404, { error: "not found" });
    }) as unknown as typeof fetch;
    return { calls, fetchImpl };
  }

  it("creates a database and a full-access token for the new learner", async () => {
    const { calls, fetchImpl } = fakeTurso();
    const db = await provisionLearnerDb("ana_b", "libsql://accounts.turso.io", T, fetchImpl);
    expect(db.tursoName).toMatch(/^pap-ana-b-[0-9a-f]{6}$/);
    expect(db).toMatchObject({ url: `libsql://${db.tursoName}-my-org.turso.io`, token: "db-jwt" });
    expect(calls[0]).toMatchObject({ method: "POST", url: "https://api.turso.tech/v1/organizations/my-org/databases", body: { name: db.tursoName, group: "default" }, auth: "Bearer api-token" });
    expect(calls[1].url).toContain(`/databases/${db.tursoName}/auth/tokens?expiration=never&authorization=full-access`);
  });

  it("deletes the new database when the token step fails", async () => {
    const { calls, fetchImpl } = fakeTurso(true);
    await expect(provisionLearnerDb("ana", "libsql://accounts.turso.io", T, fetchImpl)).rejects.toThrow(/500/);
    expect(calls.map((c) => c.method)).toEqual(["POST", "POST", "DELETE"]);
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
    vi.stubEnv("ACCOUNTS_DB_URL", "data/never-opened.db");
    vi.stubEnv("SESSION_SECRET", SECRET);
    const { proxy } = await import("@/proxy");
    const token = await signSession({ u: "ana", exp: now() + 600, v: "v1" }, SECRET);
    return { proxy, token };
  }
  const req = (p: string, token?: string) =>
    new NextRequest(`http://127.0.0.1:3000${p}`, token ? { headers: { cookie: `${SESSION_COOKIE}=${token}` } } : undefined);

  it("redirects signed-out pages to /login and answers 401 for the API", async () => {
    const { proxy } = await setup();
    const page = await proxy(req("/progress?tab=1"));
    expect(page.status).toBe(307);
    const loc = new URL(page.headers.get("location")!);
    expect(loc.pathname + loc.search).toBe("/login?next=%2Fprogress%3Ftab%3D1");
    expect((await proxy(req("/api/export"))).status).toBe(401);
    for (const p of ["/login", "/signup", "/api/auth/login", "/api/auth/signup"]) expect((await proxy(req(p))).status).toBe(200);
  });

  it("lets a validly signed session through and rejects forged ones", async () => {
    const { proxy, token } = await setup();
    expect((await proxy(req("/api/export", token))).status).toBe(200);
    const forged = await signSession({ u: "ana", exp: now() + 600, v: "v1" }, "z".repeat(40));
    expect((await proxy(req("/api/export", forged))).status).toBe(401);
  });

  it("fails closed when the secret is missing", async () => {
    const { proxy, token } = await setup();
    vi.stubEnv("SESSION_SECRET", "");
    expect((await proxy(req("/api/export", token))).status).toBe(401);
  });
});
