import { NextResponse } from "next/server";
import { z } from "zod";
import { handle, parseBody } from "@/lib/api";
import { HttpError } from "@/lib/http-error";
import { verifyPassword } from "@/lib/auth/password";
import { SESSION_COOKIE, SESSION_DAYS, passwordVersion, signSession } from "@/lib/auth/session";
import { authEnabled, findUser, sessionSecret } from "@/lib/auth/users";

export const dynamic = "force-dynamic";

const Body = z.object({ name: z.string().max(64), password: z.string().max(200) });

/** Failed attempts per client (per server instance): 8 tries per 15 minutes. */
const failures = new Map<string, { count: number; since: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 8;

function clientKey(req: Request) {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "local";
}

export const POST = handle(async (req: Request) => {
  if (!authEnabled()) throw new HttpError(400, "Logins are turned off on this server.");
  const key = clientKey(req);
  const now = Date.now();
  const f = failures.get(key);
  if (f && now - f.since < WINDOW_MS && f.count >= MAX_FAILURES) {
    throw new HttpError(429, "Too many attempts. Wait a few minutes and try again.");
  }
  const { name, password } = await parseBody(req, Body);
  const secret = sessionSecret();
  const user = findUser(name);
  // Always spend the hashing time so unknown names and wrong passwords look the same.
  const ok = user?.passwordHash
    ? await verifyPassword(password, user.passwordHash)
    : (await verifyPassword(password, "scrypt:16384:8:1:AAAAAAAAAAAAAAAAAAAAAA==:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA="), false);
  if (!user || !ok) {
    const cur = f && now - f.since < WINDOW_MS ? f : { count: 0, since: now };
    cur.count++;
    failures.set(key, cur);
    throw new HttpError(401, "That name and password don't match.");
  }
  failures.delete(key);
  const exp = Math.floor(now / 1000) + SESSION_DAYS * 86400;
  const token = await signSession({ u: user.id, exp, v: await passwordVersion(user.passwordHash!) }, secret);
  const res = NextResponse.json({ ok: true, name: user.name });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production" && !req.url.startsWith("http://127.0.0.1") && !req.url.startsWith("http://localhost"),
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 86400,
  });
  return res;
});
