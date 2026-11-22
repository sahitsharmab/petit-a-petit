/**
 * Who can use this app, from environment variables.
 *
 * Local mode (APP_USERS unset, not on Vercel): one learner, no login, data in data/french.db.
 *
 * Users mode (APP_USERS="sahit,ana"): each id needs
 *   USER_<ID>_PASSWORD_HASH  from `npm run hash-password`
 *   USER_<ID>_DB_URL         libsql://… Turso URL (defaults to file:data/<id>.db when not on Vercel)
 *   USER_<ID>_DB_TOKEN       Turso auth token (remote databases)
 *   USER_<ID>_NAME           optional display name
 * plus SESSION_SECRET (32+ random characters).
 */

export interface AppUser {
  id: string;
  name: string;
  passwordHash: string | null;
  dbUrl: string;
  dbToken?: string;
}

export class AuthConfigError extends Error {}

const ID = /^[a-z0-9][a-z0-9_-]{0,31}$/;

export const isHosted = () => !!process.env.VERCEL;

export function authEnabled(): boolean {
  return !!process.env.APP_USERS?.trim() || isHosted();
}

function envKey(id: string) {
  return id.toUpperCase().replace(/-/g, "_");
}

export function loadUsers(env: NodeJS.ProcessEnv = process.env): AppUser[] {
  const list = env.APP_USERS?.trim();
  if (!list) {
    if (env.VERCEL) throw new AuthConfigError("APP_USERS is not set. The hosted app refuses to run without logins.");
    const file = env.FRANCAIS_DB_PATH ?? "data/french.db";
    return [{ id: "local", name: "", passwordHash: null, dbUrl: file }];
  }
  const ids = list.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  return ids.map((id) => {
    if (!ID.test(id)) throw new AuthConfigError(`Invalid user id "${id}" in APP_USERS (use lowercase letters, digits, - or _).`);
    const k = envKey(id);
    const passwordHash = env[`USER_${k}_PASSWORD_HASH`]?.trim();
    if (!passwordHash) throw new AuthConfigError(`USER_${k}_PASSWORD_HASH is not set.`);
    const dbUrl = env[`USER_${k}_DB_URL`]?.trim() || (env.VERCEL ? "" : `data/${id}.db`);
    if (!dbUrl) throw new AuthConfigError(`USER_${k}_DB_URL is not set.`);
    if (env.VERCEL && !/^(libsql|https?):/i.test(dbUrl)) throw new AuthConfigError(`USER_${k}_DB_URL must be a remote libsql:// URL on Vercel.`);
    const name = env[`USER_${k}_NAME`]?.trim() || id.charAt(0).toUpperCase() + id.slice(1);
    return { id, name, passwordHash, dbUrl, dbToken: env[`USER_${k}_DB_TOKEN`]?.trim() || undefined };
  });
}

export function findUser(login: string, env: NodeJS.ProcessEnv = process.env): AppUser | null {
  const q = login.trim().toLowerCase();
  if (!q) return null;
  return loadUsers(env).find((u) => u.passwordHash && (u.id === q || u.name.toLowerCase() === q)) ?? null;
}

export function sessionSecret(env: NodeJS.ProcessEnv = process.env): string {
  const s = env.SESSION_SECRET ?? "";
  if (s.length < 32) throw new AuthConfigError("SESSION_SECRET must be set to at least 32 random characters.");
  return s;
}
