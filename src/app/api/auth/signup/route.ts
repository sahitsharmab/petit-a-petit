import { NextResponse } from "next/server";
import { z } from "zod";
import { handle, parseBody } from "@/lib/api";
import { HttpError } from "@/lib/http-error";
import { createAccount } from "@/lib/auth/accounts";
import { rateLimiter, setSessionCookie } from "@/lib/auth/cookie";
import { authEnabled, sessionSecret, signupsOpen } from "@/lib/auth/users";
import { LANGS } from "@/lib/content/languages";

export const dynamic = "force-dynamic";

const Body = z.object({ username: z.string().max(64), password: z.string().max(200), language: z.enum(LANGS).default("fr") });

/** Each sign-up creates a database, so keep it to a few per hour per client. */
const attempts = rateLimiter(5, 60 * 60 * 1000);

export const POST = handle(async (req: Request) => {
  if (!authEnabled()) throw new HttpError(400, "Accounts are turned off on this server.");
  if (!signupsOpen()) throw new HttpError(403, "Sign-up is closed.");
  if (attempts.blocked(req)) throw new HttpError(429, "Too many sign-ups from here. Try again later.");
  const { username, password, language } = await parseBody(req, Body);
  sessionSecret(); // fail before creating anything on a misconfigured deployment
  attempts.hit(req);
  const user = await createAccount({ username, password, lang: language });
  const res = NextResponse.json({ ok: true, name: user.name });
  await setSessionCookie(res, req, user);
  return res;
});
