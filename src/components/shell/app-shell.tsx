"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, BookOpenText, History, Home, MessagesSquare, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { LogoMark, Wordmark } from "./logo";
import { ThemeToggle } from "./theme-toggle";

const NAV = [
  { href: "/", label: "Today", icon: Home },
  { href: "/learn", label: "Learn", icon: BookOpenText },
  { href: "/practice", label: "Practice", icon: MessagesSquare },
  { href: "/progress", label: "Progress", icon: BarChart3 },
  { href: "/history", label: "History", icon: History },
  { href: "/settings", label: "Settings", icon: Settings },
];

function isActive(path: string, href: string) {
  return href === "/" ? path === "/" : path === href || path.startsWith(href + "/");
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[248px_1fr]">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-3 focus:py-2">
        Skip to content
      </a>
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-border/70 px-4 py-6 lg:flex">
        <Link href="/" className="flex items-center gap-2.5 px-2">
          <LogoMark />
          <Wordmark />
        </Link>
        <nav aria-label="Main" className="mt-10 flex flex-col gap-1">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = isActive(path, href);
            return (
              <Link key={href} href={href} aria-current={active ? "page" : undefined}
                className={cn("group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[0.93rem] font-medium transition-colors [&_svg]:size-[18px]",
                  active ? "bg-surface text-ink shadow-soft" : "text-muted hover:bg-surface/60 hover:text-ink")}>
                <Icon className={cn(active ? "text-primary" : "text-subtle group-hover:text-ink")} />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto px-2">
          <ThemeToggle />
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border/60 bg-background/85 px-4 py-2.5 backdrop-blur lg:hidden">
        <Link href="/" className="flex items-center gap-2">
          <LogoMark className="size-7" />
          <Wordmark className="text-base" />
        </Link>
        <div className="flex items-center">
          <ThemeToggle compact />
          <Link href="/settings" aria-label="Settings" className="grid size-10 place-items-center rounded-xl text-muted hover:bg-surface-2 hover:text-ink">
            <Settings className="size-[18px]" />
          </Link>
        </div>
      </header>

      <main id="main" className="mx-auto w-full max-w-6xl px-4 pb-28 pt-6 sm:px-6 lg:px-10 lg:pb-16 lg:pt-10">{children}</main>

      {/* Mobile bottom nav */}
      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-30 border-t border-border/70 bg-surface/92 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5">
          {NAV.slice(0, 5).map(({ href, label, icon: Icon }) => {
            const active = isActive(path, href);
            return (
              <Link key={href} href={href} aria-current={active ? "page" : undefined}
                className={cn("flex flex-col items-center gap-1 py-2.5 text-[0.7rem] font-medium [&_svg]:size-5", active ? "text-primary" : "text-subtle")}>
                <Icon />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
