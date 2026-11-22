import { NextResponse } from "next/server";
import { z } from "zod";
import { handle, parseBody } from "@/lib/api";
import { HttpError } from "@/lib/http-error";
import { verifyPassword } from "@/lib/auth/password";
import { getAccount } from "@/lib/auth/accounts";
import { rateLimiter, setSessionCookie } from "@/lib/auth/cookie";
import { authEnabled, sessionSecret } from "@/lib/auth/users";

export const dynamic = "force-dynamic";

const Body = z.object({ name: z.string().max(64), password: z.string().max(200) });

/** 8 failed attempts per 15 minutes per client (per server instance). */
const failures = rateLimiter(8, 15 * 60 * 1000);

export const POST = handle(async (req: Request) => {
  if (!authEnabled()) throw new HttpError(400, "Logins are turned off on this server.");
  if (failures.blocked(req)) throw new HttpError(429, "Too many attempts. Wait a few minutes and try again.");
  const { name, password } = await parseBody(req, Body);
  sessionSecret(); // fail early on a misconfigured deployment
  const user = await getAccount(name);
  // Always spend the hashing time so unknown names and wrong passwords look the same.
  const ok = user?.passwordHash
    ? await verifyPassword(password, user.passwordHash)
    : (await verifyPassword(password, "scrypt:16384:8:1:AAAAAAAAAAAAAAAAAAAAAA==:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA="), false);
  if (!user || !ok) {
    failures.hit(req);
    throw new HttpError(401, "That username and password don't match.");
  }
  failures.clear(req);
  const res = NextResponse.json({ ok: true, name: user.name });
  await setSessionCookie(res, req, user);
  return res;
});
