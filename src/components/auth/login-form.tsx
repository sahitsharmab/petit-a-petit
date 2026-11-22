"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";

export function LoginForm({ next }: { next: string }) {
  const [name, setName] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Couldn't sign in. Try again.");
        setBusy(false);
        return;
      }
      // Full navigation so the server renders the signed-in pages with the new cookie.
      window.location.assign(next);
    } catch {
      setError("Couldn't reach the server. Check your connection.");
      setBusy(false);
    }
  }

  const field = "mt-1.5 h-11 w-full rounded-xl border border-border bg-surface px-3 outline-none focus:border-primary";
  return (
    <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
      <div>
        <label htmlFor="name" className="text-sm font-medium">Name</label>
        <input id="name" name="username" autoComplete="username" autoCapitalize="none" spellCheck={false} required
          value={name} onChange={(e) => setName(e.target.value)} className={field} />
      </div>
      <div>
        <label htmlFor="password" className="text-sm font-medium">Password</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required
          value={password} onChange={(e) => setPassword(e.target.value)} className={field} />
      </div>
      {error && <p role="alert" className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}
      <Button type="submit" className="w-full" disabled={busy || !name.trim() || !password}>
        {busy ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
