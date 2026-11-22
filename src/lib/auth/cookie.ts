import type { NextResponse } from "next/server";
import { SESSION_COOKIE, SESSION_DAYS, passwordVersion, signSession } from "./session";
import { sessionSecret, type AppUser } from "./users";

/** Sign `user` in on this response (30-day HttpOnly cookie). */
export async function setSessionCookie(res: NextResponse, req: Request, user: AppUser) {
  const exp = Math.floor(Date.now() / 1000) + SESSION_DAYS * 86400;
  const token = await signSession({ u: user.id, exp, v: await passwordVersion(user.passwordHash!) }, sessionSecret());
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production" && !req.url.startsWith("http://127.0.0.1") && !req.url.startsWith("http://localhost"),
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 86400,
  });
}

/** Per-instance attempt counter: at most `max` hits per `windowMs` per client. */
export function rateLimiter(max: number, windowMs: number) {
  const hits = new Map<string, { count: number; since: number }>();
  const key = (req: Request) => req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "local";
  return {
    blocked(req: Request) {
      const h = hits.get(key(req));
      return !!h && Date.now() - h.since < windowMs && h.count >= max;
    },
    hit(req: Request) {
      const k = key(req);
      const now = Date.now();
      const h = hits.get(k);
      const cur = h && now - h.since < windowMs ? h : { count: 0, since: now };
      cur.count++;
      hits.set(k, cur);
    },
    clear(req: Request) {
      hits.delete(key(req));
    },
  };
}
