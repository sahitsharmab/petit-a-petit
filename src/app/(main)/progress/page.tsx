import type { Metadata } from "next";
import { BookText, Clock, Flame, GraduationCap, Lightbulb, ListChecks, MessagesSquare, Repeat } from "lucide-react";
import { getDb } from "@/lib/db";
import { getProgressData } from "@/lib/services/stats";
import { formatDateShort } from "@/lib/learning/dates";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AccuracyChart, Heatmap, MinutesChart } from "@/components/progress/charts";
import { StartLessonButton } from "@/components/dashboard/start-lesson-button";
import { cn, pct } from "@/lib/utils";

import { LANG_META } from "@/lib/content/languages";

export const metadata: Metadata = { title: "Progress" };
export const dynamic = "force-dynamic";

export default async function ProgressPage() {
  const db = await getDb();
  const d = await getProgressData(db);
  const tiles = [
    { icon: Flame, label: "Current streak", value: `${d.streak.current}`, sub: `best ${d.streak.best}` },
    { icon: Clock, label: "Minutes studied", value: `${d.totals.minutes}`, sub: `${d.totals.studyDays} study days` },
    { icon: ListChecks, label: "Study sessions", value: `${d.totals.sessions}`, sub: `${d.totals.conversations} conversations` },
    { icon: GraduationCap, label: "Lessons completed", value: `${d.totals.lessons}`, sub: `${d.curriculum.passed}/${d.curriculum.total} topics passed` },
    { icon: BookText, label: "Phrases & words reviewed", value: `${d.totals.phrasesReviewed}`, sub: "distinct items" },
    { icon: Repeat, label: "Verb forms practised", value: `${d.totals.formsReviewed}`, sub: "distinct forms" },
  ];
  const maxMistake = Math.max(1, ...d.mistakes.map((m) => m.count));

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-[2.1rem] font-semibold leading-tight">Progress</h1>
        <p className="mt-1 text-muted">Every number here comes from your own recorded answers and study time.</p>
      </header>

      <section aria-label="Totals" className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {tiles.map(({ icon: Icon, label, value, sub }) => (
          <div key={label} className="card p-4">
            <Icon className="size-4 text-subtle" />
            <p className="mt-3 font-display text-3xl font-semibold tabular-nums">{value}</p>
            <p className="text-sm text-ink/85">{label}</p>
            <p className="text-xs text-muted">{sub}</p>
          </div>
        ))}
      </section>

      <Card>
        <CardHeader><div><CardTitle>Active days</CardTitle><CardDescription>Minutes studied per day (Europe/Paris)</CardDescription></div></CardHeader>
        <CardContent><Heatmap days={d.heatmap} /></CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader><div><CardTitle>First-try accuracy</CardTitle><CardDescription>Share of exercises answered correctly on the first attempt, per study day</CardDescription></div></CardHeader>
          <CardContent><AccuracyChart data={d.accuracy} /></CardContent>
        </Card>
        <Card>
          <CardHeader><div><CardTitle>Study time</CardTitle><CardDescription>Active minutes in lessons and conversations</CardDescription></div></CardHeader>
          <CardContent><MinutesChart weekly={d.weekly} monthly={d.monthly} /></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div><CardTitle>Grammar mastery by topic</CardTitle><CardDescription>Mastery decays slowly after a week without practice — that&apos;s when reviews kick in.</CardDescription></div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-x-10 gap-y-6 md:grid-cols-2">
            {d.weeks.map((w) => {
              const skills = d.skills.filter((s) => s.week === w.number);
              return (
                <div key={w.number}>
                  <p className="mb-2 text-xs font-medium uppercase tracking-[0.12em] text-subtle">Week {w.number} · {w.title}</p>
                  <ul className="space-y-2">
                    {skills.map((s) => (
                      <li key={s.id} className="grid grid-cols-[minmax(0,9.5rem)_1fr_3rem] items-center gap-3 text-sm sm:grid-cols-[minmax(0,12rem)_1fr_3rem]">
                        <span className="truncate" title={s.title}>{s.short}</span>
                        <span className="relative h-2 overflow-hidden rounded-full bg-surface-2" role="img" aria-label={`${s.title}: ${s.attempts ? pct(s.mastery) : "not started"}`}>
                          <span className="absolute inset-y-0 left-0 rounded-full bg-chart" style={{ width: `${s.mastery * 100}%` }} />
                          <span className="absolute inset-y-0 left-[70%] w-px bg-subtle/60" aria-hidden />
                        </span>
                        <span className={cn("text-right tabular-nums", s.attempts ? "text-ink" : "text-subtle")}>{s.attempts ? pct(s.mastery) : "—"}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
          <p className="mt-5 text-xs text-muted">The thin line marks 70%, where a topic counts as passed.</p>
          <details className="mt-4 text-sm">
            <summary className="cursor-pointer text-muted hover:text-ink">Show as a table</summary>
            <div className="mt-3 overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-left">
                <thead className="bg-surface-2/70 text-muted"><tr><th className="px-3 py-2 font-medium">Topic</th><th className="px-3 py-2 font-medium">Week</th><th className="px-3 py-2 font-medium">Mastery</th><th className="px-3 py-2 font-medium">Answers</th><th className="px-3 py-2 font-medium">Accuracy</th><th className="px-3 py-2 font-medium">Status</th></tr></thead>
                <tbody>
                  {d.skills.map((s) => (
                    <tr key={s.id} className="border-t border-border"><td className="px-3 py-2">{s.title}</td><td className="px-3 py-2">{s.week}</td><td className="px-3 py-2 tabular-nums">{pct(s.mastery)}</td><td className="px-3 py-2 tabular-nums">{s.attempts}</td><td className="px-3 py-2 tabular-nums">{s.accuracy === null ? "—" : pct(s.accuracy)}</td><td className="px-3 py-2">{s.passed ? "Passed" : s.status}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card>
          <CardHeader><div><CardTitle>Most common mistakes</CardTitle><CardDescription>By type, across all answers</CardDescription></div></CardHeader>
          <CardContent>
            {d.mistakes.length ? (
              <ul className="space-y-3">
                {d.mistakes.map((m) => (
                  <li key={m.tag}>
                    <div className="flex justify-between gap-2 text-sm"><span>{m.label}</span><span className="tabular-nums text-muted">{m.count}</span></div>
                    <div className="mt-1.5 h-1.5 rounded-full bg-surface-2"><div className="h-full rounded-full bg-chart" style={{ width: `${(m.count / maxMistake) * 100}%` }} /></div>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-muted">No mistakes recorded yet.</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><div><CardTitle>Items that keep slipping</CardTitle><CardDescription>Forgotten at least once — scheduled for review</CardDescription></div></CardHeader>
          <CardContent>
            {d.troubleItems.length ? (
              <ul className="space-y-2.5 text-sm">
                {d.troubleItems.map((t) => (
                  <li key={t.label} className="flex items-start justify-between gap-3">
                    <span><span className="font-medium" lang={db.lang}>{t.label}</span><span className="block text-xs text-muted">{t.skill}</span></span>
                    <Badge tone="warning" className="shrink-0">due {formatDateShort(t.due)}</Badge>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-muted">Nothing is slipping. {LANG_META[db.lang].praise.veryGood}</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><div><CardTitle className="flex items-center gap-2"><Lightbulb className="size-4 text-warning" /> Recommended next</CardTitle><CardDescription>Based on your weakest areas</CardDescription></div></CardHeader>
          <CardContent>
            {d.recommendations.length ? (
              <ul className="space-y-4">
                {d.recommendations.map((r) => (
                  <li key={r.title} className="space-y-1.5">
                    <p className="font-medium">{r.title}</p>
                    <p className="text-sm text-muted">{r.reason}</p>
                    {r.kind === "skill" && r.skillId && <StartLessonButton label="Practise now" practice={{ kind: "skill", skillId: r.skillId }} size="sm" variant="secondary" />}
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-muted">Recommendations appear after a few lessons.</p>}
            <div className="mt-5 border-t border-border pt-4">
              <a href="/practice" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"><MessagesSquare className="size-4" /> Practise speaking in a real situation</a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
