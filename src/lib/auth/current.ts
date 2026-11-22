import { cookies } from "next/headers";
import { HttpError } from "@/lib/http-error";
import { SESSION_COOKIE, passwordVersion, verifySession } from "./session";
import { authEnabled, localUser, sessionSecret, type AppUser } from "./users";
import { getAccount } from "./accounts";

/** The signed-in user (or the single local user when logins are off). Throws 401 otherwise. */
export async function currentUser(): Promise<AppUser> {
  if (!authEnabled()) return localUser();
  const user = await userFromToken((await cookies()).get(SESSION_COOKIE)?.value);
  if (!user) throw new HttpError(401, "Please sign in.");
  return user;
}

/** Same as currentUser but returns null instead of throwing (and the local user when logins are off). */
export async function maybeUser(): Promise<AppUser | null> {
  try {
    return await currentUser();
  } catch (e) {
    if (e instanceof HttpError && e.status === 401) return null;
    throw e;
  }
}

export async function userFromToken(token: string | undefined, env: NodeJS.ProcessEnv = process.env): Promise<AppUser | null> {
  const p = await verifySession(token, sessionSecret(env));
  if (!p) return null;
  const user = await getAccount(p.u, env);
  if (!user?.passwordHash) return null;
  // A changed password hash signs out existing sessions.
  if ((await passwordVersion(user.passwordHash)) !== p.v) return null;
  return user;
}
