import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/auth/session";
import { authEnabled, sessionSecret } from "@/lib/auth/users";

/**
 * Login gate. With accounts on (any Vercel deployment, or ACCOUNTS_DB_URL set), every page and
 * API route except sign-in and sign-up needs a validly signed session cookie. Pages redirect
 * to /login; API calls get 401. This check needs no database; each data access then loads the
 * account and re-checks it in full (lib/auth/current via lib/db getDb).
 */
const PUBLIC = new Set(["/login", "/signup", "/api/auth/login", "/api/auth/signup"]);

export async function proxy(req: NextRequest) {
  if (!authEnabled()) return NextResponse.next();
  const { pathname, search } = req.nextUrl;
  if (PUBLIC.has(pathname)) return NextResponse.next();

  let signedIn = false;
  try {
    signedIn = !!(await verifySession(req.cookies.get(SESSION_COOKIE)?.value, sessionSecret()));
  } catch (err) {
    // Misconfigured deployment (missing secret): fail closed.
    console.error("[auth]", (err as Error).message);
  }
  if (signedIn) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  }
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = pathname === "/" ? "" : `?next=${encodeURIComponent(pathname + search)}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|robots.txt).*)"],
};
