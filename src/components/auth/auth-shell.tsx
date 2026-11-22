import type { ReactNode } from "react";

/** Only same-site paths are allowed as a post-login destination. */
export function safeNext(next: string | undefined): string {
  return next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : "/";
}

export function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <main className="grid min-h-dvh place-items-center bg-background px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-xl bg-primary text-primary-ink shadow-[0_6px_14px_-6px_var(--primary)]">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
              <path d="M4 17c4-1 8-5 16-10-3 6-7 10-12 11" />
            </svg>
          </div>
          <span className="font-display text-2xl italic">petit à petit</span>
        </div>
        <div className="card p-6 sm:p-8">
          <h1 className="font-display text-3xl">{title}</h1>
          <p className="mt-1.5 text-muted">{subtitle}</p>
          {children}
        </div>
        {footer && <p className="mt-5 text-center text-sm text-muted">{footer}</p>}
      </div>
    </main>
  );
}
