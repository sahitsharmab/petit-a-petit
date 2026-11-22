/**
 * Encrypt learners' API keys at rest (AES-256-GCM).
 *
 * The encryption key is derived (HKDF-SHA256) from AI_KEY_SECRET, or from SESSION_SECRET when
 * that isn't set, so a hosted deployment needs no extra variable. Running locally without
 * either, a random secret is created once in data/ai-secret.key (data/ is git-ignored).
 * Changing the secret makes stored keys unreadable; learners then just enter their key again.
 */
import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { AuthConfigError, isHosted } from "@/lib/auth/users";

const VERSION = "v1";
const AAD = Buffer.from("petit-a-petit:ai-key");

function rootSecret(env: NodeJS.ProcessEnv): string {
  const s = env.AI_KEY_SECRET?.trim() || env.SESSION_SECRET?.trim() || "";
  if (s.length >= 32) return s;
  if (isHosted(env)) throw new AuthConfigError("Set SESSION_SECRET (or AI_KEY_SECRET) to at least 32 random characters to store API keys.");
  const file = path.resolve(/*turbopackIgnore: true*/ env.AI_KEY_SECRET_FILE ?? "data/ai-secret.key");
  try {
    return fs.readFileSync(file, "utf8").trim();
  } catch {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const fresh = randomBytes(32).toString("base64url");
    fs.writeFileSync(file, fresh, { mode: 0o600 });
    return fresh;
  }
}

function key(env: NodeJS.ProcessEnv): Buffer {
  return Buffer.from(hkdfSync("sha256", rootSecret(env), "petit-a-petit", "ai-key-encryption-v1", 32));
}

export function seal(plain: string, env: NodeJS.ProcessEnv = process.env): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(env), iv);
  cipher.setAAD(AAD);
  const body = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return `${VERSION}:${Buffer.concat([iv, cipher.getAuthTag(), body]).toString("base64url")}`;
}

/** The plain text, or null if the value was tampered with or sealed under another secret. */
export function open(sealed: string, env: NodeJS.ProcessEnv = process.env): string | null {
  const [version, data] = sealed.split(":");
  if (version !== VERSION || !data) return null;
  try {
    const raw = Buffer.from(data, "base64url");
    const decipher = createDecipheriv("aes-256-gcm", key(env), raw.subarray(0, 12));
    decipher.setAAD(AAD);
    decipher.setAuthTag(raw.subarray(12, 28));
    return Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}
