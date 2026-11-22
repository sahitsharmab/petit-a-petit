import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import fs from "node:fs";
import path from "node:path";
import * as schema from "./schema";
import { syncSeed } from "./seed";

export type DB = BetterSQLite3Database<typeof schema> & { $client: Database.Database };

const MIGRATIONS = path.join(process.cwd(), "drizzle");

/** Open (and migrate + seed) a database. Use ":memory:" in tests. */
export function createDb(file: string): DB {
  if (file !== ":memory:") fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
  const sqlite = new Database(file);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  sqlite.pragma("busy_timeout = 5000");
  const db = drizzle(sqlite, { schema }) as DB;
  migrate(db, { migrationsFolder: MIGRATIONS });
  syncSeed(db);
  return db;
}

const globalForDb = globalThis as unknown as { __francaisDb?: DB };

/** Path of the app database file. */
export function dbFilePath(): string {
  return path.resolve(process.env.FRANCAIS_DB_PATH ?? path.join(process.cwd(), "data", "french.db"));
}

export function getDb(): DB {
  if (!globalForDb.__francaisDb) globalForDb.__francaisDb = createDb(dbFilePath());
  return globalForDb.__francaisDb;
}

export { schema };
