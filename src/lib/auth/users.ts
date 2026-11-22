/**
 * Who can use this app.
 *
 * Local mode (default, not on Vercel, ACCOUNTS_DB_URL unset): one learner, no login, data in
 * data/french.db.
 *
 * Accounts mode (always on Vercel, or locally with ACCOUNTS_DB_URL set): people sign up on
 * /signup. Accounts live in one small accounts database; each account gets its own learner
 * database, created at sign-up (a Turso database when TURSO_API_TOKEN + TURSO_ORG are set,
 * otherwise a file next to the accounts database).
 *
 *   SESSION_SECRET     32+ random characters (signs the login cookie)
 *   ACCOUNTS_DB_URL    libsql://… Turso URL of the accounts database (a file path locally)
 *   ACCOUNTS_DB_TOKEN  its Turso token
 *   TURSO_API_TOKEN    Turso platform API token, used to create each learner's database
 *   TURSO_ORG          Turso organization (account) slug
 *   TURSO_GROUP        optional Turso group for new databases (default "default")
 *   SIGNUPS            optional; "closed" turns sign-up off
 */

import { isLang, type Lang } from "@/lib/content/languages";

export interface AppUser {
  id: string;
  name: string;
  passwordHash: string | null;
  dbUrl: string;
  dbToken?: string;
  /** The course this learner studies (chosen at sign-up). */
  lang: Lang;
}

export class AuthConfigError extends Error {}

export const USERNAME = /^[a-z0-9][a-z0-9_-]{2,31}$/;

export const isHosted = (env: NodeJS.ProcessEnv = process.env) => !!env.VERCEL;

export function authEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return isHosted(env) || !!env.ACCOUNTS_DB_URL?.trim();
}

export function signupsOpen(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.SIGNUPS?.trim().toLowerCase() !== "closed";
}

/** The single learner of local mode (French unless FRANCAIS_LANG=de). */
export function localUser(env: NodeJS.ProcessEnv = process.env): AppUser {
  const lang = isLang(env.FRANCAIS_LANG) ? env.FRANCAIS_LANG : "fr";
  return { id: "local", name: "", passwordHash: null, dbUrl: env.FRANCAIS_DB_PATH ?? (lang === "fr" ? "data/french.db" : `data/${lang}.db`), lang };
}

const remote = (url: string) => /^(libsql|https?|wss?):/i.test(url);

export function accountsDbConfig(env: NodeJS.ProcessEnv = process.env): { url: string; authToken?: string } {
  const url = env.ACCOUNTS_DB_URL?.trim() ?? "";
  if (!url) throw new AuthConfigError("ACCOUNTS_DB_URL is not set. The hosted app refuses to run without accounts.");
  if (isHosted(env) && !remote(url)) throw new AuthConfigError("ACCOUNTS_DB_URL must be a remote libsql:// URL on Vercel.");
  return { url, authToken: env.ACCOUNTS_DB_TOKEN?.trim() || undefined };
}

export function sessionSecret(env: NodeJS.ProcessEnv = process.env): string {
  const s = env.SESSION_SECRET ?? "";
  if (s.length < 32) throw new AuthConfigError("SESSION_SECRET must be set to at least 32 random characters.");
  return s;
}
