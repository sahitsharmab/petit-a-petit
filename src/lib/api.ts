import { NextResponse } from "next/server";
import { ZodError, type z } from "zod";
import { HttpError } from "@/lib/services/sessions";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export async function parseBody<S extends z.ZodTypeAny>(req: Request, schema: S): Promise<z.infer<S>> {
  let body: unknown = {};
  try {
    const text = await req.text();
    body = text ? JSON.parse(text) : {};
  } catch {
    throw new HttpError(400, "Invalid JSON body");
  }
  return schema.parse(body);
}

/**
 * Reject state-changing requests sent by another website. Browsers attach Origin and
 * Sec-Fetch-Site to cross-site requests; same-origin requests and local tools (no headers) pass.
 */
export function isCrossSite(req: Request): boolean {
  if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") return false;
  const site = req.headers.get("sec-fetch-site");
  if (site && site !== "same-origin" && site !== "none") return true;
  const origin = req.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).host !== req.headers.get("host");
  } catch {
    return true;
  }
}

export function handle<A extends unknown[]>(fn: (...args: A) => Promise<Response> | Response) {
  return async (...args: A) => {
    if (args[0] instanceof Request && isCrossSite(args[0])) {
      return NextResponse.json({ error: "Cross-site requests are not allowed." }, { status: 403 });
    }
    try {
      return await fn(...args);
    } catch (err) {
      if (err instanceof HttpError) return NextResponse.json({ error: err.message }, { status: err.status });
      if (err instanceof ZodError) return NextResponse.json({ error: "Invalid request", issues: err.issues }, { status: 400 });
      console.error(err);
      return NextResponse.json({ error: "Something went wrong on the server." }, { status: 500 });
    }
  };
}
