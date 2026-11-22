"use client";
import * as React from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatDateShort } from "@/lib/learning/dates";
import { cn } from "@/lib/utils";

const axis = { stroke: "var(--subtle)", fontSize: 12, tickLine: false, axisLine: false } as const;

function TipBox({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface px-3 py-2 text-sm shadow-lift">
      <p className="text-xs text-muted">{title}</p>
      <p className="font-medium tabular-nums text-ink">{value}</p>
    </div>
  );
}

export function AccuracyChart({ data }: { data: { date: string; accuracy: number; answers: number }[] }) {
  if (data.length < 2) return <EmptyChart text="Accuracy over time appears after two study days." />;
  const rows = data.map((d) => ({ ...d, pct: Math.round(d.accuracy * 100), label: formatDateShort(d.date) }));
  return (
    <div className="h-56" role="img" aria-label={`First-try accuracy by day: ${rows.map((r) => `${r.label} ${r.pct}%`).join(", ")}`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 4" vertical={false} />
          <XAxis dataKey="label" {...axis} minTickGap={24} />
          <YAxis domain={[0, 100]} ticks={[0, 50, 100]} tickFormatter={(v) => `${v}%`} {...axis} />
          <Tooltip cursor={{ stroke: "var(--subtle)", strokeDasharray: "3 3" }}
            content={({ active, payload }) => active && payload?.length ? <TipBox title={`${payload[0].payload.label} · ${payload[0].payload.answers} answers`} value={`${payload[0].payload.pct}% first try`} /> : null} />
          <Line type="monotone" dataKey="pct" stroke="var(--chart)" strokeWidth={2} dot={{ r: 4, fill: "var(--chart)", stroke: "var(--surface)", strokeWidth: 2 }} activeDot={{ r: 6, stroke: "var(--surface)", strokeWidth: 2 }} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MinutesChart({ weekly, monthly }: { weekly: { week: string; minutes: number }[]; monthly: { month: string; minutes: number }[] }) {
  const [mode, setMode] = React.useState<"weekly" | "monthly">("weekly");
  const rows = mode === "weekly"
    ? weekly.map((w) => ({ label: formatDateShort(w.week), minutes: w.minutes, title: `Week of ${formatDateShort(w.week)}` }))
    : monthly.map((m) => {
        const [y, mo] = m.month.split("-").map(Number);
        const label = new Date(Date.UTC(y, mo - 1, 1)).toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" });
        return { label, minutes: m.minutes, title: new Date(Date.UTC(y, mo - 1, 1)).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }) };
      });
  const any = rows.some((r) => r.minutes > 0);
  return (
    <div>
      <div role="tablist" aria-label="Time range" className="mb-3 inline-flex rounded-lg bg-surface-2 p-0.5 text-sm">
        {(["weekly", "monthly"] as const).map((m) => (
          <button key={m} role="tab" aria-selected={mode === m} onClick={() => setMode(m)}
            className={cn("rounded-md px-3 py-1 capitalize", mode === m ? "bg-surface text-ink shadow-soft" : "text-muted hover:text-ink")}>{m}</button>
        ))}
      </div>
      {!any ? <EmptyChart text="Minutes appear here as you study." /> : (
        <div className="h-48" role="img" aria-label={`Minutes studied (${mode}): ${rows.map((r) => `${r.label} ${r.minutes}`).join(", ")}`}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows} margin={{ top: 8, right: 4, bottom: 0, left: -22 }} barCategoryGap={mode === "weekly" ? "22%" : "32%"}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 4" vertical={false} />
              <XAxis dataKey="label" {...axis} interval={mode === "weekly" ? 2 : 0} />
              <YAxis allowDecimals={false} {...axis} />
              <Tooltip cursor={{ fill: "var(--surface-2)" }} content={({ active, payload }) => active && payload?.length ? <TipBox title={payload[0].payload.title} value={`${payload[0].payload.minutes} min`} /> : null} />
              <Bar dataKey="minutes" fill="var(--chart)" radius={[4, 4, 0, 0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

const LEVELS = [0, 1, 10, 20, 30];
function level(minutes: number, sessions: number) {
  if (minutes <= 0 && sessions <= 0) return 0;
  return LEVELS.filter((l) => minutes >= l).length - 1 || 1;
}
const LEVEL_BG = ["var(--surface-2)", "color-mix(in oklab, var(--chart) 30%, var(--surface))", "color-mix(in oklab, var(--chart) 55%, var(--surface))", "color-mix(in oklab, var(--chart) 78%, var(--surface))", "var(--chart)"];

/** Calendar heatmap of active days (26 weeks, Monday-first columns). */
export function Heatmap({ days }: { days: { date: string; minutes: number; sessions: number; future: boolean }[] }) {
  const weeks: (typeof days)[] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));
  const active = days.filter((d) => d.minutes > 0 || d.sessions > 0).length;
  return (
    <div>
      <div className="overflow-x-auto scrollbar-none pb-1">
        <div className="flex min-w-max gap-[3px]" role="img" aria-label={`${active} active days in the last 26 weeks`}>
          <div className="mr-1 grid grid-rows-7 gap-[3px] text-[0.6rem] leading-[11px] text-subtle">
            {["Mon", "", "Wed", "", "Fri", "", ""].map((l, i) => <span key={i} className="h-[11px] sm:h-[13px]">{l}</span>)}
          </div>
          {weeks.map((w, wi) => (
            <div key={wi} className="grid grid-rows-7 gap-[3px]">
              {w.map((d) => (
                <div key={d.date} title={d.future ? "" : `${formatDateShort(d.date)}: ${d.minutes} min${d.sessions ? `, ${d.sessions} session${d.sessions > 1 ? "s" : ""}` : ""}`}
                  className={cn("size-[11px] rounded-[3px] sm:size-[13px]", d.future && "opacity-0")}
                  style={{ background: LEVEL_BG[level(d.minutes, d.sessions)] }} />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-muted">
        <span>{active} active day{active === 1 ? "" : "s"} in 26 weeks</span>
        <span className="flex items-center gap-1">Less {LEVEL_BG.map((bg, i) => <span key={i} className="size-[11px] rounded-[3px]" style={{ background: bg }} />)} More</span>
      </div>
    </div>
  );
}

export function EmptyChart({ text }: { text: string }) {
  return <div className="grid h-40 place-items-center rounded-xl border border-dashed border-border text-sm text-muted">{text}</div>;
}
