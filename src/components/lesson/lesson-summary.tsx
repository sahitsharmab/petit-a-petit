"use client";
import { useCourse } from "@/components/course/course-context";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, Clock, Repeat2, Target, TrendingUp } from "lucide-react";
import type { Outcome, SessionSummary } from "@/lib/services/sessions";
import { Button } from "@/components/ui/button";
import { cn, pct } from "@/lib/utils";

const OUTCOME_LABELS: { key: Outcome; label: string; tone: string }[] = [
  { key: "almost", label: "Almost", tone: "bg-warning-soft text-warning" },
  { key: "hinted", label: "With a hint", tone: "bg-surface-2 text-ink" },
  { key: "supported", label: "Text shown (listening)", tone: "bg-surface-2 text-ink" },
  { key: "recovered", label: "Fixed on retry", tone: "bg-primary-soft text-primary" },
  { key: "missed", label: "Missed", tone: "bg-danger-soft text-danger" },
];

function ScoreRing({ value, label }: { value: number; label: string }) {
  const reduce = useReducedMotion();
  const r = 52;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative size-36 shrink-0">
      <svg viewBox="0 0 120 120" className="size-full -rotate-90" aria-hidden>
        <circle cx="60" cy="60" r={r} fill="none" stroke="var(--surface-2)" strokeWidth="10" />
        <motion.circle cx="60" cy="60" r={r} fill="none" stroke={value >= 0.6 ? "var(--success)" : "var(--warning)"} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - value) }}
          transition={{ duration: reduce ? 0 : 1.1, ease: [0.2, 0.8, 0.2, 1], delay: 0.2 }} />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <p className="font-display text-[2rem] font-semibold leading-none tabular-nums">{pct(value)}</p>
          <p className="mx-auto mt-1 max-w-20 text-[0.7rem] leading-tight text-muted">{label}</p>
        </div>
      </div>
    </div>
  );
}

export function LessonSummary({ summary, onPracticeAgain, busy }: { summary: SessionSummary; onPracticeAgain: () => void; busy: boolean }) {
  const tl = useCourse().code;
  const delta = summary.primarySkill.after - summary.primarySkill.before;
  const heading = summary.accuracy >= 0.85 ? "Magnifique !" : summary.accuracy >= 0.6 ? "Bien joué !" : "Courage — ça vient !";
  const b = summary.breakdown;
  // Summaries saved before the breakdown existed counted every non-wrong first answer.
  const scoreLabel = b ? "right first time" : "first try";
  const toReview = b ? b.missed + b.recovered : summary.mistakes.length;
  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="mx-auto max-w-2xl space-y-6 pb-16">
      <section className="card flex flex-col items-center gap-5 px-6 py-8 text-center sm:flex-row sm:text-left">
        <ScoreRing value={summary.accuracy} label={scoreLabel} />
        <div className="space-y-2">
          <p className="text-sm font-medium text-primary">Lesson complete</p>
          <h1 className="font-display text-3xl font-semibold">{heading}</h1>
          <p className="text-muted text-pretty">{summary.nextStep}</p>
        </div>
      </section>

      <section className="grid grid-cols-3 gap-3">
        {[
          { icon: Target, label: b ? "Right first time" : "Correct first try", value: `${summary.firstTryCorrect}/${summary.total}` },
          { icon: Clock, label: "Minutes", value: String(summary.minutes) },
          { icon: Repeat2, label: "To review", value: String(toReview) },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="card p-4">
            <Icon className="size-4 text-subtle" />
            <p className="mt-2 font-display text-2xl font-semibold tabular-nums">{value}</p>
            <p className="text-xs text-muted">{label}</p>
          </div>
        ))}
      </section>

      {b && OUTCOME_LABELS.some(({ key }) => b[key] > 0) && (
        <section aria-label="Other answers" className="flex flex-wrap gap-2">
          {OUTCOME_LABELS.filter(({ key }) => b[key] > 0).map(({ key, label, tone }) => (
            <span key={key} className={cn("rounded-full px-3 py-1 text-sm font-medium", tone)}>
              {label} <span className="tabular-nums">{b[key]}</span>
            </span>
          ))}
        </section>
      )}

      <section className="card space-y-3 p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-semibold">{summary.primarySkill.title}</h2>
          <span className={cn("inline-flex items-center gap-1 text-sm font-medium tabular-nums", delta >= 0 ? "text-success" : "text-warning")}>
            <TrendingUp className="size-4" /> {delta >= 0 ? "+" : ""}{Math.round(delta * 100)} pts
          </span>
        </div>
        <div className="relative h-2.5 overflow-hidden rounded-full bg-surface-2" role="img" aria-label={`Mastery ${pct(summary.primarySkill.after)}`}>
          <div className="absolute inset-y-0 left-0 rounded-full bg-chart/35" style={{ width: pct(summary.primarySkill.before) }} />
          <motion.div className="absolute inset-y-0 left-0 rounded-full bg-chart" initial={{ width: pct(summary.primarySkill.before) }} animate={{ width: pct(summary.primarySkill.after) }} transition={{ duration: 0.9, delay: 0.4 }} />
        </div>
        <p className="text-sm text-muted">Mastery {pct(summary.primarySkill.before)} → <span className="font-medium text-ink">{pct(summary.primarySkill.after)}</span>. The next topic unlocks at 70%.</p>
        {summary.learned.length > 0 && (
          <ul className="mt-2 space-y-1 text-sm">
            {summary.learned.map((l) => <li key={l} className="flex gap-2"><span className="text-success">✓</span> {l}</li>)}
          </ul>
        )}
      </section>

      {summary.mistakes.length > 0 && (
        <section className="card p-5 sm:p-6">
          <h2 className="font-semibold">Corrections to remember</h2>
          <p className="text-sm text-muted">Missed answers are scheduled for review.</p>
          <ul className="mt-4 divide-y divide-border">
            {summary.mistakes.map((m) => {
              const kind = m.kind ?? "missed";
              return (
                <li key={m.exerciseId} className="space-y-1 py-3 first:pt-0 last:pb-0">
                  <p className="text-sm text-muted">{m.instruction}: <span className="text-ink">{m.prompt}</span></p>
                  {m.answer && (
                    <p className="text-sm">
                      <span className="mr-1.5 text-xs font-medium uppercase tracking-wide text-muted">{kind === "almost" ? "You wrote" : "First answer"}</span>
                      <span className={kind === "almost" ? "text-warning" : "text-danger line-through decoration-danger/50"} lang={tl}>{m.answer}</span>
                    </p>
                  )}
                  {kind === "recovered" && m.retryAnswer && (
                    <p className="text-sm text-primary">
                      <span className="mr-1.5 text-xs font-medium uppercase tracking-wide">Fixed on retry</span>
                      <span lang={tl}>{m.retryAnswer}</span> <span aria-hidden>✓</span>
                    </p>
                  )}
                  <p className="font-medium text-success" lang={tl}>{m.correct}</p>
                  <p className="text-sm text-muted">{m.explanation}</p>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="outline" size="lg" onClick={onPracticeAgain} disabled={busy}>Practise this topic more</Button>
        <Button asChild size="lg"><Link href="/">Back to today <ArrowRight /></Link></Button>
      </div>
    </motion.div>
  );
}
