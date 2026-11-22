import { randomBytes, scrypt as scryptCb, timingSafeEqual, type ScryptOptions } from "node:crypto";

/**
 * Password hashes look like: scrypt:<N>:<r>:<p>:<salt b64>:<hash b64>
 * (no "$", which .env files would try to expand as a variable).
 */

function scrypt(password: string, salt: Buffer, keylen: number, opts: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => scryptCb(password, salt, keylen, opts, (err, key) => (err ? reject(err) : resolve(key))));
}

const N = 16384, R = 8, P = 1, KEYLEN = 32;

export async function hashPassword(password: string): Promise<string> {
  if (password.length < 8) throw new Error("Use at least 8 characters.");
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, KEYLEN, { N, r: R, p: P, maxmem: 64 * 1024 * 1024 });
  return `scrypt:${N}:${R}:${P}:${salt.toString("base64")}:${hash.toString("base64")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.trim().split(":");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const [n, r, p] = parts.slice(1, 4).map(Number);
  if (![n, r, p].every((x) => Number.isInteger(x) && x > 0) || n > 1 << 20) return false;
  const salt = Buffer.from(parts[4], "base64");
  const expected = Buffer.from(parts[5], "base64");
  if (!expected.length) return false;
  const actual = await scrypt(password, salt, expected.length, { N: n, r, p, maxmem: 256 * 1024 * 1024 });
  return timingSafeEqual(actual, expected);
}
