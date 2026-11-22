import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/session";
import { authEnabled } from "@/lib/auth/users";
import { userFromToken } from "@/lib/auth/current";

/**
 * Login gate. With logins on (APP_USERS set, or any Vercel deployment), every page and API
 * route except the login page and login endpoint needs a valid session cookie. Pages redirect
 * to /login; API calls get 401. Each data access also re-checks the user (lib/db getDb).
 */
const PUBLIC = new Set(["/login", "/api/auth/login"]);

export async function proxy(req: NextRequest) {
  if (!authEnabled()) return NextResponse.next();
  const { pathname, search } = req.nextUrl;
  if (PUBLIC.has(pathname)) return NextResponse.next();

  let signedIn = false;
  try {
    signedIn = !!(await userFromToken(req.cookies.get(SESSION_COOKIE)?.value));
  } catch (err) {
    // Misconfigured deployment (missing secret or users): fail closed.
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
