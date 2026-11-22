import type { Metadata } from "next";
import { CheckCircle2, ChevronDown, Circle, CircleDot } from "lucide-react";
import { getDb } from "@/lib/db";
import { SKILLS, WEEKS } from "@/lib/content/curriculum";
import { loadProgress } from "@/lib/services/progress";
import { frontierSkill } from "@/lib/learning/planner";
import { effectiveMastery } from "@/lib/learning/mastery";
import { parisDate } from "@/lib/learning/dates";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { StartLessonButton } from "@/components/dashboard/start-lesson-button";
import { cn, pct } from "@/lib/utils";

export const metadata: Metadata = { title: "Learn" };
export const dynamic = "force-dynamic";

const STATUS_LABEL = { new: "Not started", learning: "Learning", reviewing: "Reviewing", mastered: "Mastered" } as const;

export default function LearnPage() {
  const db = getDb();
  const progress = loadProgress(db);
  const frontier = frontierSkill({ progress });
  const frontierWeek = SKILLS.find((s) => s.id === frontier)!.week;
  const today = parisDate();

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-[2.1rem] font-semibold leading-tight">Your roadmap</h1>
          <p className="mt-1 max-w-xl text-muted">Twelve weeks from A1 foundations through the core A2 grammar. Topics unlock by demonstrated understanding (70% mastery), not by the calendar — revisit any week whenever you like.</p>
        </div>
        <StartLessonButton label="Review what's due" practice={{ kind: "review" }} variant="secondary" size="md" />
      </header>

      <ol className="relative space-y-4 before:absolute before:bottom-4 before:left-[1.15rem] before:top-4 before:w-px before:bg-border sm:before:left-[1.4rem]">
        {WEEKS.map((w) => {
          const skills = SKILLS.filter((s) => s.week === w.number).sort((a, b) => a.order - b.order);
          const core = skills.filter((s) => s.category !== "review");
          const passed = core.filter((s) => progress[s.id]?.passedAt).length;
          const done = core.length > 0 && passed === core.length;
          const current = w.number === frontierWeek;
          const started = skills.some((s) => (progress[s.id]?.attempts ?? 0) > 0);
          return (
            <li key={w.number} className="relative pl-11 sm:pl-14">
              <span className={cn("absolute left-0 top-5 grid size-9 place-items-center rounded-full border-2 bg-background text-sm font-semibold sm:size-11",
                done ? "border-success bg-success text-white dark:text-[#0d1f1b]" : current ? "border-primary text-primary" : "border-border text-muted")} aria-hidden>
                {done ? <CheckCircle2 className="size-5" /> : w.number}
              </span>
              <details open={current} className={cn("card group overflow-hidden", current && "ring-2 ring-primary/25")}>
                <summary className="flex cursor-pointer list-none items-start gap-4 p-5 sm:p-6 [&::-webkit-details-marker]:hidden">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-muted">Week {w.number}</span>
                      <Badge tone="outline">{w.cefr}</Badge>
                      {current && <Badge tone="primary">You are here</Badge>}
                      {done && <Badge tone="success">Complete</Badge>}
                    </div>
                    <h2 className="mt-1 font-display text-xl font-semibold">{w.title}</h2>
                    <p className="mt-0.5 text-sm text-muted">{w.focus}</p>
                    {started && core.length > 0 && (
                      <div className="mt-3 flex max-w-sm items-center gap-3">
                        <Progress value={(passed / core.length) * 100} className="h-1.5" label={`Week ${w.number} progress`} />
                        <span className="shrink-0 text-xs text-muted tabular-nums">{passed}/{core.length}</span>
                      </div>
                    )}
                  </div>
                  <ChevronDown className="mt-1 size-5 shrink-0 text-subtle transition-transform group-open:rotate-180" />
                </summary>
                <div className="border-t border-border px-5 pb-5 pt-4 sm:px-6">
                  <p className="text-sm text-muted">{w.description}</p>
                  <ul className="mt-4 divide-y divide-border">
                    {skills.map((s) => {
                      const p = progress[s.id];
                      const m = p ? effectiveMastery(p.mastery, p.lastPracticedAt, today) : 0;
                      const status = (p?.status ?? "new") as keyof typeof STATUS_LABEL;
                      const Icon = p?.passedAt ? CheckCircle2 : p?.attempts ? CircleDot : Circle;
                      return (
                        <li key={s.id} className="flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center">
                          <div className="flex min-w-0 flex-1 items-start gap-3">
                            <Icon className={cn("mt-0.5 size-5 shrink-0", p?.passedAt ? "text-success" : p?.attempts ? "text-primary" : "text-subtle")} aria-hidden />
                            <div className="min-w-0">
                              <p className="font-medium">{s.title} <span className="ml-1 text-xs font-normal text-subtle">{s.cefr}</span></p>
                              <p className="text-sm text-muted">{s.summary}</p>
                              {p && p.attempts > 0 && (
                                <div className="mt-2 flex max-w-xs items-center gap-2.5">
                                  <Progress value={m * 100} className="h-1.5" indicatorClassName="bg-chart" label={`${s.title} mastery`} />
                                  <span className="shrink-0 text-xs text-muted tabular-nums">{pct(m)} · {STATUS_LABEL[status]}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <StartLessonButton label={p?.attempts ? "Practise" : "Try it"} practice={{ kind: "skill", skillId: s.id }} size="sm" variant="outline" showArrow={false} className="sm:ml-auto" />
                        </li>
                      );
                    })}
                  </ul>
                  <div className="mt-4 flex justify-end">
                    <StartLessonButton label={`Revise week ${w.number}`} practice={{ kind: "week", week: w.number }} size="sm" variant="secondary" />
                  </div>
                </div>
              </details>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
