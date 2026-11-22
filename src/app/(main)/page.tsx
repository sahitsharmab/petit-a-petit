import Link from "next/link";
import { ArrowRight, BookCheck, CalendarDays, CheckCircle2, Clock, Flame, History as HistoryIcon, Layers, RotateCcw, Sparkles, Target, TriangleAlert } from "lucide-react";
import { getDb } from "@/lib/db";
import { getDashboard } from "@/lib/services/stats";
import { formatDateLong, formatDateShort, isPastParisTime, parisParts } from "@/lib/learning/dates";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { StartLessonButton } from "@/components/dashboard/start-lesson-button";
import { WeekActivity } from "@/components/dashboard/week-activity";
import { pct } from "@/lib/utils";
import { LANG_META } from "@/lib/content/languages";

export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const db = await getDb();
  const d = await getDashboard(db);
  const L = LANG_META[db.lang];
  const hour = parisParts().hour;
  const evening = hour >= 18 || hour < 4;
  const hello = db.lang === "de" ? (evening ? "Guten Abend" : hour < 11 ? "Guten Morgen" : "Hallo") : evening ? "Bonsoir" : "Bonjour";
  const { card, plan } = { card: d.card, plan: d.card.plan };
  const lesson = card.lesson;
  const week = lesson?.weekNumber ?? plan.weekNumber;
  const day = lesson?.dayNumber ?? plan.dayNumber;
  const title = lesson?.title ?? plan.title;
  const subtitle = lesson?.subtitle ?? plan.subtitle;
  const rationale = lesson?.intro.rationale ?? plan.rationale;
  const reminderDue = d.settings.reminderEnabled && card.status !== "completed" && isPastParisTime(d.settings.reminderTime);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted">{formatDateLong(d.today)}</p>
          <h1 className="mt-1 font-display text-[2.1rem] font-semibold leading-tight sm:text-[2.5rem]">
            {hello}{d.name ? `, ${d.name}` : ""}{db.lang === "de" ? "!" : " !"}
          </h1>
          <p className="mt-1 text-muted">
            {card.status === "completed" ? `Today's lesson is done. ${L.congrats}` : `Ready for today's ${L.name} lesson?`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="primary" className="px-3 py-1 text-sm">{d.level.label}</Badge>
          <Badge tone={d.streak.current > 0 ? "warning" : "neutral"} className="px-3 py-1 text-sm">
            <Flame /> {d.streak.current} day{d.streak.current === 1 ? "" : "s"}
          </Badge>
        </div>
      </header>

      {reminderDue && (
        <div className="flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary-soft/60 px-4 py-3 text-sm">
          <Clock className="size-4 text-primary" /> It&apos;s past your {d.settings.reminderTime} study time — a short lesson now keeps things fresh.
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Today's lesson */}
        <section aria-labelledby="today-title" className="card relative overflow-hidden lg:col-span-2">
          <div className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-primary/8 blur-3xl" aria-hidden />
          <div className="relative flex h-full flex-col p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-primary">Week {week} · Day {day}</span>
              {lesson?.source && lesson.source !== "local" && <Badge tone="primary"><Sparkles /> AI-enhanced</Badge>}
              {card.status === "completed" && <Badge tone="success"><CheckCircle2 /> Completed</Badge>}
            </div>
            <h2 id="today-title" className="mt-3 font-display text-[1.9rem] font-semibold leading-[1.15] text-balance sm:text-[2.3rem]">{title}</h2>
            <p className="mt-2 text-muted">{subtitle}</p>
            {rationale.length > 0 && (
              <ul className="mt-5 space-y-1.5 text-[0.95rem] text-ink/85">
                {rationale.slice(0, 2).map((r) => <li key={r} className="flex gap-2"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary/60" />{r}</li>)}
              </ul>
            )}
            <div className="mt-auto pt-7">
              {card.status === "in_progress" && (
                <div className="mb-4 flex items-center gap-3">
                  <Progress value={card.progress * 100} className="max-w-xs" label="Today's lesson progress" />
                  <span className="text-sm text-muted tabular-nums">{pct(card.progress)}</span>
                </div>
              )}
              <div className="flex flex-wrap items-center gap-3">
                {card.status === "completed" ? (
                  <>
                    <Button asChild size="lg" variant="outline"><Link href={`/lesson/${lesson!.id}`}>See your results</Link></Button>
                    <StartLessonButton label="Practise more" practice={{ kind: "skill", skillId: lesson!.primarySkillId }} variant="primary" />
                  </>
                ) : (
                  <StartLessonButton label={card.status === "in_progress" ? "Continue today's lesson" : "Start today's lesson"} lessonId={lesson?.id} loadingLabel="Preparing your lesson…" />
                )}
                <span className="inline-flex items-center gap-1.5 text-sm text-muted"><Clock className="size-4" /> 15–20 min</span>
              </div>
            </div>
          </div>
        </section>

        {/* Since last time */}
        <Card className="flex flex-col">
          <CardHeader><CardTitle className="flex items-center gap-2"><HistoryIcon className="size-4 text-subtle" /> Since last time</CardTitle></CardHeader>
          <CardContent className="flex-1 space-y-4 text-[0.93rem]">
            {d.lastSession ? (
              <>
                <p className="text-muted">On {formatDateShort(d.lastSession.date)} you studied:</p>
                <ul className="space-y-1">{d.lastSession.lessons.map((l) => <li key={l} className="font-medium">{l}</li>)}</ul>
                {d.lastSession.struggled.length > 0 ? (
                  <div>
                    <p className="flex items-center gap-1.5 text-muted"><TriangleAlert className="size-3.5 text-warning" /> Tricky bits (in today&apos;s warm-up):</p>
                    <ul className="mt-1.5 flex flex-wrap gap-1.5">{d.lastSession.struggled.map((s) => <li key={s} className="rounded-lg bg-warning-soft px-2 py-1 text-sm" lang={db.lang}>{s}</li>)}</ul>
                  </div>
                ) : <p className="text-success">No lingering mistakes — nice!</p>}
              </>
            ) : (
              <div className="space-y-2 text-muted">
                <p className="font-medium text-ink">{L.welcome}</p>
                <p>Each evening you&apos;ll get one focused lesson built from where you are: a warm-up of things due for review, one new idea, practice, a sentence to build and a short conversation.</p>
                <p>Your progress is saved automatically and belongs only to you.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CalendarDays className="size-4 text-subtle" /> This week</CardTitle>
            <span className="text-sm text-muted tabular-nums">{d.week.reduce((a, x) => a + x.minutes, 0)} min</span>
          </CardHeader>
          <CardContent><WeekActivity week={d.week} goal={d.settings.dailyGoalMinutes} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Layers className="size-4 text-subtle" /> Curriculum</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-baseline gap-2">
              <span className="font-display text-4xl font-semibold tabular-nums">{d.curriculum.passed}</span>
              <span className="text-muted">of {d.curriculum.total} topics</span>
            </div>
            <Progress value={d.curriculum.pct * 100} label="Curriculum progress" />
            <p className="text-sm text-muted">Now: Week {d.frontier.week} — {d.frontier.title}</p>
            <Link href="/learn" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">See the roadmap <ArrowRight className="size-3.5" /></Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Target className="size-4 text-subtle" /> Mastered skills</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-baseline gap-2">
              <span className="font-display text-4xl font-semibold tabular-nums">{d.mastered}</span>
              <span className="text-muted">mastered (≥ 85%)</span>
            </div>
            <p className="text-sm text-muted">Best streak: {d.streak.best} day{d.streak.best === 1 ? "" : "s"}. Missing a single day won&apos;t break your streak.</p>
            {d.streak.atRisk && <p className="text-sm text-warning">Study today to keep your {d.streak.current}-day streak going.</p>}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><BookCheck className="size-4 text-subtle" /> Recently learned</CardTitle></CardHeader>
          <CardContent>
            {d.recentlyLearned.length ? (
              <ul className="space-y-3">
                {d.recentlyLearned.map((s) => (
                  <li key={s.id}>
                    <div className="flex justify-between text-sm"><span>{s.title}</span><span className="tabular-nums text-muted">{pct(s.mastery)}</span></div>
                    <Progress value={s.mastery * 100} className="mt-1.5 h-1.5" indicatorClassName="bg-chart" label={`${s.title} mastery`} />
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-muted">Skills appear here once you reach 60% mastery.</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><RotateCcw className="size-4 text-subtle" /> Needs review</CardTitle>
            {d.dueCount > 0 && <Badge tone="warning">{d.dueCount} due</Badge>}
          </CardHeader>
          <CardContent className="space-y-4">
            {d.needsReview.length ? (
              <ul className="space-y-2.5">
                {d.needsReview.map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-2 text-sm">
                    <span>{s.title}</span>
                    <span className="shrink-0 tabular-nums text-muted">{pct(s.mastery)}{s.due ? ` · ${s.due} due` : ""}</span>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-muted">Nothing needs review yet.</p>}
            {d.dueCount > 0 && <StartLessonButton label="Review now" practice={{ kind: "review" }} size="sm" variant="secondary" />}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Continue where you left off</CardTitle></CardHeader>
          <CardContent>
            {d.resume ? (
              <div className="space-y-3">
                <p className="font-medium">{d.resume.title}</p>
                <p className="text-sm text-muted">{d.resume.kind === "daily" ? `Daily lesson · ${formatDateShort(d.resume.date)}` : "Practice session"}</p>
                <Progress value={d.resume.progress * 100} label="Session progress" />
                <Button asChild size="sm" variant="secondary"><Link href={`/lesson/${d.resume.lessonId}`}>Resume <ArrowRight /></Link></Button>
              </div>
            ) : (
              <div className="space-y-3 text-sm text-muted">
                <p>No unfinished sessions. Want something extra?</p>
                <div className="flex flex-wrap gap-2">
                  <Button asChild size="sm" variant="secondary"><Link href="/practice">Conversation practice</Link></Button>
                  <Button asChild size="sm" variant="ghost"><Link href="/learn">Revisit a week</Link></Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
