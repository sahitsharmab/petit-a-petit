"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { LANGS, LANG_META, type Lang } from "@/lib/content/languages";
import { cn } from "@/lib/utils";

/** Sign-in or sign-up form; both post a username and password and get a session cookie back. */
export function LoginForm({ next, mode = "login" }: { next: string; mode?: "login" | "signup" }) {
  const signup = mode === "signup";
  const [name, setName] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [again, setAgain] = React.useState("");
  const [language, setLanguage] = React.useState<Lang | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (signup && password.length < 8) return setError("Use at least 8 characters for the password.");
    if (signup && password !== again) return setError("The passwords don't match.");
    if (signup && !language) return setError("Choose the language you want to learn.");
    setBusy(true);
    try {
      const res = await fetch(signup ? "/api/auth/signup" : "/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(signup ? { username: name, password, language } : { name, password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? (signup ? "Couldn't create the account. Try again." : "Couldn't sign in. Try again."));
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
      {signup && (
        <fieldset>
          <legend className="text-sm font-medium">I want to learn</legend>
          <div className="mt-1.5 grid grid-cols-2 gap-2">
            {LANGS.map((l) => {
              const m = LANG_META[l];
              const on = language === l;
              return (
                <label key={l} className={cn(
                  "flex cursor-pointer flex-col rounded-xl border px-3 py-2.5 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary/40",
                  on ? "border-primary bg-primary-soft" : "border-border bg-surface hover:border-primary/50",
                )}>
                  <input type="radio" name="language" value={l} checked={on} onChange={() => setLanguage(l)} className="sr-only" />
                  <span className="font-display text-lg leading-tight" lang={l}>{m.native.charAt(0).toUpperCase() + m.native.slice(1)}</span>
                  <span className="text-xs text-muted">{m.name}</span>
                </label>
              );
            })}
          </div>
          <p className="mt-1 text-xs text-muted">Your course can&apos;t be changed later; make a second account for another language.</p>
        </fieldset>
      )}
      <div>
        <label htmlFor="name" className="text-sm font-medium">Username</label>
        <input id="name" name="username" autoComplete="username" autoCapitalize="none" spellCheck={false} required maxLength={32}
          value={name} onChange={(e) => setName(e.target.value)} className={field} />
        {signup && <p className="mt-1 text-xs text-muted">3–32 letters, digits, - or _. You&apos;ll sign in with it.</p>}
      </div>
      <div>
        <label htmlFor="password" className="text-sm font-medium">Password</label>
        <input id="password" name="password" type="password" autoComplete={signup ? "new-password" : "current-password"} required
          value={password} onChange={(e) => setPassword(e.target.value)} className={field} />
      </div>
      {signup && (
        <div>
          <label htmlFor="again" className="text-sm font-medium">Password again</label>
          <input id="again" name="password-again" type="password" autoComplete="new-password" required
            value={again} onChange={(e) => setAgain(e.target.value)} className={field} />
        </div>
      )}
      {error && <p role="alert" className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}
      <Button type="submit" className="w-full" disabled={busy || !name.trim() || !password || (signup && (!again || !language))}>
        {signup ? (busy ? "Creating your account…" : "Create account") : busy ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
