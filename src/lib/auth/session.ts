/**
 * Signed session cookie: base64url(JSON payload) + "." + base64url(HMAC-SHA256).
 * Uses Web Crypto only, so it also runs in the request proxy.
 */

export const SESSION_COOKIE = "pap_session";
export const SESSION_DAYS = 30;

export interface SessionPayload {
  /** user id */
  u: string;
  /** expiry, epoch seconds */
  exp: number;
  /** password version: changes when the user's password hash changes, which signs them out */
  v: string;
}

const enc = new TextEncoder();

function b64url(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64url(s: string): Uint8Array {
  const pad = s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
  const bin = atob(pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function key(secret: string) {
  return crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

/** Short, non-reversible fingerprint of a password hash. */
export async function passwordVersion(passwordHash: string): Promise<string> {
  const d = new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode(passwordHash)));
  return b64url(d.slice(0, 9));
}

export async function signSession(payload: SessionPayload, secret: string): Promise<string> {
  const body = b64url(enc.encode(JSON.stringify(payload)));
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", await key(secret), enc.encode(body)));
  return `${body}.${b64url(sig)}`;
}

/** The payload if the token is authentic and unexpired, else null. */
export async function verifySession(token: string | undefined, secret: string, nowSec = Math.floor(Date.now() / 1000)): Promise<SessionPayload | null> {
  if (!token) return null;
  const [body, sig, extra] = token.split(".");
  if (!body || !sig || extra !== undefined) return null;
  try {
    const ok = await crypto.subtle.verify("HMAC", await key(secret), fromB64url(sig) as BufferSource, enc.encode(body));
    if (!ok) return null;
    const p = JSON.parse(new TextDecoder().decode(fromB64url(body))) as SessionPayload;
    if (typeof p.u !== "string" || typeof p.exp !== "number" || typeof p.v !== "string" || p.exp <= nowSec) return null;
    return p;
  } catch {
    return null;
  }
}
