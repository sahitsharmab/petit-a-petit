"use client";
import * as React from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

type Theme = "light" | "dark" | "system";

function apply(theme: Theme) {
  const dark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}

export function useTheme() {
  const [theme, setThemeState] = React.useState<Theme>("system");
  React.useEffect(() => {
    try {
      setThemeState((localStorage.getItem("theme") as Theme) || "system");
    } catch {}
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      let t: Theme = "system";
      try { t = (localStorage.getItem("theme") as Theme) || "system"; } catch {}
      if (t === "system") apply("system");
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  const setTheme = React.useCallback((t: Theme) => {
    setThemeState(t);
    try { localStorage.setItem("theme", t); } catch {}
    apply(t);
  }, []);
  return { theme, setTheme };
}

export function ThemeToggle({ className, compact }: { className?: string; compact?: boolean }) {
  const { theme, setTheme } = useTheme();
  const options: { value: Theme; icon: React.ReactNode; label: string }[] = [
    { value: "light", icon: <Sun />, label: "Light theme" },
    { value: "dark", icon: <Moon />, label: "Dark theme" },
    { value: "system", icon: <Monitor />, label: "System theme" },
  ];
  if (compact) {
    const next: Theme = theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
    const cur = options.find((o) => o.value === theme)!;
    return (
      <button type="button" onClick={() => setTheme(next)} aria-label={`${cur.label} (click to change)`}
        className={cn("grid size-10 place-items-center rounded-xl text-muted hover:bg-surface-2 hover:text-ink [&_svg]:size-[18px]", className)}>
        {cur.icon}
      </button>
    );
  }
  return (
    <div role="radiogroup" aria-label="Theme" className={cn("inline-flex rounded-xl bg-surface-2 p-1", className)}>
      {options.map((o) => (
        <button key={o.value} type="button" role="radio" aria-checked={theme === o.value} aria-label={o.label} onClick={() => setTheme(o.value)}
          className={cn("grid h-8 w-9 place-items-center rounded-lg text-muted transition-colors [&_svg]:size-4",
            theme === o.value ? "bg-surface text-ink shadow-soft" : "hover:text-ink")}>
          {o.icon}
        </button>
      ))}
    </div>
  );
}
