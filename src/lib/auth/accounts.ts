/**
 * Accounts database: one small table of learners (username, password hash, where their own
 * database lives). Learner progress is never stored here.
 */
import fs from "node:fs";
import path from "node:path";
import { createClient, type Client } from "@libsql/client";
import { localPathOf, openDb, serialized } from "@/lib/db";
import { HttpError } from "@/lib/http-error";
import { hashPassword } from "./password";
import { deleteLearnerDb, provisionLearnerDb } from "./provision";
import { USERNAME, accountsDbConfig, type AppUser } from "./users";
import { isLang, type Lang } from "@/lib/content/languages";

const g = globalThis as unknown as { __francaisAccounts?: Map<string, Promise<Client>> };
const clients = (g.__francaisAccounts ??= new Map());

async function open(url: string, authToken?: string): Promise<Client> {
  const local = localPathOf(url);
  if (local) fs.mkdirSync(path.dirname(local), { recursive: true });
  const client = local ? serialized(createClient({ url: `file:${local}`, timeout: 5000 })) : createClient({ url, authToken });
  await client.execute(`CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    db_url TEXT,
    db_token TEXT,
    turso_name TEXT,
    language TEXT NOT NULL DEFAULT 'fr',
    created_at INTEGER NOT NULL
  )`);
  // Accounts databases created before course choice existed.
  const cols = await client.execute("PRAGMA table_info(accounts)");
  if (!cols.rows.some((c) => c.name === "language")) {
    await client.execute("ALTER TABLE accounts ADD COLUMN language TEXT NOT NULL DEFAULT 'fr'").catch(() => {});
  }
  return client;
}

function accounts(env: NodeJS.ProcessEnv = process.env): Promise<Client> {
  const { url, authToken } = accountsDbConfig(env);
  let p = clients.get(url);
  if (!p) {
    p = open(url, authToken);
    clients.set(url, p);
    p.catch(() => clients.delete(url));
  }
  return p;
}

type Row = { id: string; name: string; password_hash: string; db_url: string | null; db_token: string | null; language: string | null };
const COLS = "id, name, password_hash, db_url, db_token, language";

function toUser(r: Row): AppUser | null {
  if (!r.db_url) return null; // sign-up still in progress (or failed)
  return { id: r.id, name: r.name, passwordHash: r.password_hash, dbUrl: r.db_url, dbToken: r.db_token ?? undefined, lang: isLang(r.language) ? r.language : "fr" };
}

/** Short per-instance cache so each request doesn't need an extra round trip. */
const cache = new Map<string, { user: AppUser | null; at: number }>();
const CACHE_MS = 30_000;

export async function getAccount(username: string, env: NodeJS.ProcessEnv = process.env): Promise<AppUser | null> {
  const id = username.trim().toLowerCase();
  if (!USERNAME.test(id)) return null;
  const hit = cache.get(id);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.user;
  const db = await accounts(env);
  const rs = await db.execute({ sql: `SELECT ${COLS} FROM accounts WHERE id = ?`, args: [id] });
  const user = rs.rows[0] ? toUser(rs.rows[0] as unknown as Row) : null;
  cache.set(id, { user, at: Date.now() });
  return user;
}

export async function listAccounts(env: NodeJS.ProcessEnv = process.env): Promise<AppUser[]> {
  const db = await accounts(env);
  const rs = await db.execute(`SELECT ${COLS} FROM accounts ORDER BY created_at`);
  return (rs.rows as unknown as Row[]).map(toUser).filter((u): u is AppUser => !!u);
}

/** A sign-up that crashed half-way frees its username after this long. */
const STALE_CLAIM_MS = 5 * 60 * 1000;

/**
 * Create an account and its own database. The username is claimed first (so two sign-ups
 * can't both get it), then the database is created; a failure undoes both.
 */
export async function createAccount(
  input: { username: string; password: string; lang?: Lang },
  env: NodeJS.ProcessEnv = process.env,
  fetchImpl: typeof fetch = fetch,
): Promise<AppUser> {
  const name = input.username.trim();
  const id = name.toLowerCase();
  const lang: Lang = input.lang ?? "fr";
  if (!isLang(lang)) throw new HttpError(400, "Choose French or German.");
  if (!USERNAME.test(id)) throw new HttpError(400, "Usernames are 3–32 characters: letters, digits, - or _, starting with a letter or digit.");
  const passwordHash = await hashPassword(input.password).catch((e: Error) => { throw new HttpError(400, e.message); });
  const db = await accounts(env);
  const now = Date.now();
  const claim = await db.execute({
    sql: `INSERT INTO accounts (id, name, password_hash, language, created_at) VALUES (?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET name = excluded.name, password_hash = excluded.password_hash, language = excluded.language, created_at = excluded.created_at
          WHERE accounts.db_url IS NULL AND accounts.created_at < ?`,
    args: [id, name, passwordHash, lang, now, now - STALE_CLAIM_MS],
  });
  if (claim.rowsAffected === 0) throw new HttpError(409, "That username is taken.");

  let learner: Awaited<ReturnType<typeof provisionLearnerDb>> | null = null;
  try {
    learner = await provisionLearnerDb(id, accountsDbConfig(env).url, env, fetchImpl);
    await db.execute({
      sql: "UPDATE accounts SET db_url = ?, db_token = ?, turso_name = ? WHERE id = ? AND created_at = ?",
      args: [learner.url, learner.token ?? null, learner.tursoName ?? null, id, now],
    });
  } catch (err) {
    if (learner) await deleteLearnerDb(learner, env, fetchImpl).catch(() => {});
    await db.execute({ sql: "DELETE FROM accounts WHERE id = ? AND created_at = ? AND db_url IS NULL", args: [id, now] }).catch(() => {});
    throw err;
  }
  cache.delete(id);
  const user: AppUser = { id, name, passwordHash, dbUrl: learner.url, dbToken: learner.token, lang };
  // Migrate and seed the new database now so the first page load is quick. A brand-new
  // Turso database can take a moment to answer; if so, the first request does this instead.
  await openDb(user.id, user.dbUrl, user.dbToken, user.lang).catch((e) => console.warn("[signup] first database setup deferred:", (e as Error).message));
  return user;
}

/** Tests: forget cached clients and accounts. */
export function resetAccountsCache() {
  cache.clear();
  clients.clear();
}
