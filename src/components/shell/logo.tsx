import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn("size-8", className)}>
      <rect width="32" height="32" rx="10" fill="var(--primary)" />
      <path d="M9 21.5c2.2-4.6 5-7.4 8.6-8.4 2.4-.7 4.4-.3 5.9.6-1.6.1-3 .6-4.2 1.5 1.8.2 3.1.9 4 2-3.2-.6-6 .2-8.3 2.2-1.6 1.4-3.2 2.1-6 2.1Z" fill="var(--primary-ink)" />
      <circle cx="21.2" cy="14.6" r="0.9" fill="var(--primary)" />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("font-display text-[1.15rem] font-semibold italic tracking-tight text-ink", className)}>
      petit à petit
    </span>
  );
}
