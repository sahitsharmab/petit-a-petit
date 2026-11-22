import { createClient, type Client } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { sql } from "drizzle-orm";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import * as schema from "./schema";
import { syncSeed } from "./seed";

/**
 * One learner's database. Locally it is a SQLite file; hosted it is a Turso (libSQL) database.
 * Every query is async. Inside `db.transaction(async (tx) => …)` services receive the
 * transaction cast to DB and must only use it (never the outer db) until it returns.
 */
export type DB = LibSQLDatabase<typeof schema> & { $client: Client };

const MIGRATIONS = path.join(process.cwd(), "drizzle"); // bundled via outputFileTracingIncludes

/** The file path behind a `file:` URL or bare path, or null for a remote database. */
export function localPathOf(url: string): string | null {
  if (/^(libsql|https?|wss?):/i.test(url)) return null;
  // Runtime data path, not a source file: keep it out of the deployment's file tracing.
  return path.resolve(/*turbopackIgnore: true*/ url.replace(/^file:/i, ""));
}

const tempFiles: string[] = [];
let cleanupRegistered = false;
function tempDbFile(): string {
  const file = path.join(os.tmpdir(), `francais-test-${randomUUID()}.db`);
  tempFiles.push(file);
  if (!cleanupRegistered) {
    cleanupRegistered = true;
    process.on("exit", () => {
      for (const f of tempFiles) for (const s of ["", "-wal", "-shm"]) try { fs.rmSync(f + s, { force: true }); } catch { /* ignore */ }
    });
  }
  return file;
}

/**
 * Open, migrate and seed a database. `url` is a file path, a `file:` URL, a `libsql://` Turso URL,
 * or ":memory:" (tests: a throwaway temp file, since in-memory libSQL allows only one connection).
 */
export async function createDb(url: string, authToken?: string): Promise<DB> {
  const local = url === ":memory:" ? tempDbFile() : localPathOf(url);
  if (local) fs.mkdirSync(path.dirname(local), { recursive: true });
  const client = local ? serialized(createClient({ url: `file:${local}`, timeout: 5000 })) : createClient({ url, authToken });
  const db = drizzle(client, { schema }) as DB;
  if (local) await db.run(sql`PRAGMA journal_mode = WAL`);
  await migrateWithRetry(db);
  await syncSeed(db);
  return db;
}

/**
 * Local SQLite files: run one database operation at a time in this process.
 * The native driver waits for SQLite locks synchronously, which blocks Node's event loop; a
 * request waiting for another request's open transaction would then stall that transaction
 * too (a deadlock until the busy timeout). Queuing operations here avoids that. A transaction
 * holds the queue from begin until commit or rollback, and must only use its own handle.
 * Remote (Turso) clients wait asynchronously and don't need this.
 */
function serialized(client: Client): Client {
  let tail: Promise<void> = Promise.resolve();
  const lock = async (): Promise<() => void> => {
    let release!: () => void;
    const held = new Promise<void>((r) => { release = r; });
    const prev = tail;
    tail = prev.then(() => held);
    await prev;
    return release;
  };
  const run = async <T>(fn: () => Promise<T>): Promise<T> => {
    const release = await lock();
    try { return await fn(); } finally { release(); }
  };
  return new Proxy(client, {
    get(target, prop, receiver) {
      if (prop === "execute" || prop === "batch" || prop === "executeMultiple" || prop === "migrate") {
        return (...args: unknown[]) => run(() => (target[prop] as (...a: unknown[]) => Promise<unknown>).apply(target, args));
      }
      if (prop === "transaction") {
        return async (...args: unknown[]) => {
          const release = await lock();
          let done = false;
          const finish = () => { if (!done) { done = true; release(); } };
          try {
            const tx = await (target.transaction as (...a: unknown[]) => Promise<Awaited<ReturnType<Client["transaction"]>>>).apply(target, args);
            for (const m of ["commit", "rollback", "close"] as const) {
              const orig = tx[m].bind(tx) as () => unknown;
              (tx as unknown as Record<string, unknown>)[m] = async () => { try { return await orig(); } finally { finish(); } };
            }
            return tx;
          } catch (err) {
            finish();
            throw err;
          }
        };
      }
      const v = Reflect.get(target, prop, receiver);
      return typeof v === "function" ? v.bind(target) : v;
    },
  });
}

/** Two cold starts may migrate a fresh remote database at the same moment; the loser retries once. */
async function migrateWithRetry(db: DB) {
  try {
    await migrate(db, { migrationsFolder: MIGRATIONS });
  } catch (err) {
    await new Promise((r) => setTimeout(r, 500));
    try {
      await migrate(db, { migrationsFolder: MIGRATIONS });
    } catch {
      throw err;
    }
  }
}

const globalForDb = globalThis as unknown as { __francaisDbs?: Map<string, Promise<DB>> };
const opened = (globalForDb.__francaisDbs ??= new Map());

/** Open (once per server instance) the database for a key such as a user id. */
export function openDb(key: string, url: string, authToken?: string): Promise<DB> {
  const cacheKey = `${key}|${url}`;
  let p = opened.get(cacheKey);
  if (!p) {
    p = createDb(url, authToken);
    opened.set(cacheKey, p);
    p.catch(() => opened.delete(cacheKey));
  }
  return p;
}

/** The signed-in learner's database (or the local single-user database). Throws 401 when signed out. */
export async function getDb(): Promise<DB> {
  const { currentUser } = await import("@/lib/auth/current");
  const user = await currentUser();
  return openDb(user.id, user.dbUrl, user.dbToken);
}

export { schema };
