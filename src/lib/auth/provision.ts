/**
 * Create (and, on a failed sign-up, delete) a learner's own database.
 * With TURSO_API_TOKEN + TURSO_ORG: a new Turso database through the Turso Platform API.
 * Otherwise (local accounts mode only): a SQLite file next to the accounts database.
 */
import path from "node:path";
import { randomBytes } from "node:crypto";
import { AuthConfigError, isHosted } from "./users";

export interface LearnerDb {
  url: string;
  token?: string;
  /** Turso database name, for cleanup; absent for local files. */
  tursoName?: string;
}

const API = "https://api.turso.tech/v1/organizations";

function turso(env: NodeJS.ProcessEnv) {
  const token = env.TURSO_API_TOKEN?.trim();
  const org = env.TURSO_ORG?.trim();
  if (!token || !org) return null;
  return { token, org, group: env.TURSO_GROUP?.trim() || "default" };
}

async function call(fetchImpl: typeof fetch, url: string, token: string, init: RequestInit = {}) {
  const res = await fetchImpl(url, {
    ...init,
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json", ...init.headers },
  });
  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) throw new Error(`Turso API ${init.method ?? "GET"} ${new URL(url).pathname} failed (${res.status}): ${String(body.error ?? "no details")}`);
  return body;
}

export async function provisionLearnerDb(
  userId: string,
  accountsUrl: string,
  env: NodeJS.ProcessEnv = process.env,
  fetchImpl: typeof fetch = fetch,
): Promise<LearnerDb> {
  const t = turso(env);
  if (!t) {
    if (isHosted(env)) throw new AuthConfigError("TURSO_API_TOKEN and TURSO_ORG must be set so sign-up can create each learner's database.");
    const dir = path.dirname(accountsUrl.replace(/^file:/i, ""));
    return { url: path.join(dir, `${userId}.db`) };
  }
  // Turso names: lowercase letters, digits and dashes, at most 64 characters.
  const name = `pap-${userId.replace(/_/g, "-")}-${randomBytes(3).toString("hex")}`;
  const base = `${API}/${encodeURIComponent(t.org)}/databases`;
  const created = await call(fetchImpl, base, t.token, { method: "POST", body: JSON.stringify({ name, group: t.group }) });
  const hostname = (created.database as { Hostname?: string } | undefined)?.Hostname;
  try {
    if (!hostname) throw new Error("Turso API did not return the new database's hostname.");
    const tok = await call(fetchImpl, `${base}/${name}/auth/tokens?expiration=never&authorization=full-access`, t.token, { method: "POST" });
    if (typeof tok.jwt !== "string") throw new Error("Turso API did not return a database token.");
    return { url: `libsql://${hostname}`, token: tok.jwt, tursoName: name };
  } catch (err) {
    await deleteLearnerDb({ url: "", tursoName: name }, env, fetchImpl).catch(() => {});
    throw err;
  }
}

/** Remove a database created by provisionLearnerDb (Turso only; local files are left alone). */
export async function deleteLearnerDb(db: LearnerDb, env: NodeJS.ProcessEnv = process.env, fetchImpl: typeof fetch = fetch) {
  const t = turso(env);
  if (!t || !db.tursoName) return;
  await call(fetchImpl, `${API}/${encodeURIComponent(t.org)}/databases/${db.tursoName}`, t.token, { method: "DELETE" });
}
