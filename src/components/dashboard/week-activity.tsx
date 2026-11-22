import { cn } from "@/lib/utils";

const DAYS = ["M", "T", "W", "T", "F", "S", "S"];

/** Minutes studied each day this week (single series, labelled; goal as a reference line). */
export function WeekActivity({ week, goal }: { week: { date: string; minutes: number; sessions: number; isToday: boolean; isFuture: boolean }[]; goal: number }) {
  const max = Math.max(goal * 1.4, ...week.map((d) => d.minutes), 1);
  const goalPct = (goal / max) * 100;
  return (
    <div>
      <div className="relative flex h-28 items-end gap-2" role="img" aria-label={`Minutes studied this week: ${week.map((d) => `${d.date} ${d.minutes} min`).join(", ")}`}>
        <div className="pointer-events-none absolute inset-x-0 border-t border-dashed border-subtle/50" style={{ bottom: `${goalPct}%` }} aria-hidden>
          <span className="absolute -top-4 right-0 text-[0.65rem] text-subtle">{goal} min goal</span>
        </div>
        {week.map((d) => (
          <div key={d.date} className="group relative flex h-full flex-1 items-end">
            <div title={`${d.minutes} min`}
              className={cn("w-full rounded-t-[4px] transition-[height] duration-500", d.minutes > 0 ? "bg-chart" : "bg-surface-2", d.isFuture && "opacity-40")}
              style={{ height: d.minutes > 0 ? `${Math.max(6, (d.minutes / max) * 100)}%` : "4px" }} />
            <span className="pointer-events-none absolute -top-6 left-1/2 hidden -translate-x-1/2 rounded-md bg-ink px-1.5 py-0.5 text-[0.65rem] text-background group-hover:block">{d.minutes}m</span>
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        {week.map((d, i) => (
          <span key={d.date} className={cn("flex-1 text-center text-xs", d.isToday ? "font-semibold text-ink" : "text-subtle")}>{DAYS[i]}</span>
        ))}
      </div>
    </div>
  );
}
