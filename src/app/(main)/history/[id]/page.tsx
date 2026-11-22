import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, X, CircleAlert, Sparkles } from "lucide-react";
import { getDb } from "@/lib/db";
import { getLessonHistory } from "@/lib/services/stats";
import { formatDateLong } from "@/lib/learning/dates";
import { EXERCISE_LABEL, type Exercise } from "@/lib/content/types";
import { expandAll } from "@/lib/french/normalize";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StartLessonButton } from "@/components/dashboard/start-lesson-button";
import { cn, pct } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function LessonHistoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = getLessonHistory(getDb(), id);
  if (!data) notFound();
  const { lesson, exercises, sessions, attempts } = data;
  const done = sessions.filter((s) => s.status === "completed");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/history" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"><ArrowLeft className="size-4" /> History</Link>
      <header className="space-y-2">
        <p className="text-sm text-primary">{formatDateLong(lesson.lessonDate)} · {lesson.kind === "daily" ? `Week ${lesson.weekNumber} · Day ${lesson.dayNumber}` : lesson.kind}</p>
        <h1 className="font-display text-[2rem] font-semibold leading-tight">{lesson.title}</h1>
        <div className="flex flex-wrap gap-2">
          {done.map((s, i) => <Badge key={s.id} tone="success">Attempt {i + 1}: {s.score !== null ? pct(s.score) : "done"}</Badge>)}
          {lesson.source !== "local" && <Badge tone="primary"><Sparkles /> AI-enhanced</Badge>}
        </div>
        <div className="flex flex-wrap gap-2 pt-2">
          <Button asChild variant="outline" size="sm"><Link href={`/lesson/${lesson.id}`}>{done.length ? "View summary" : "Open lesson"}</Link></Button>
          <StartLessonButton label="Practise this topic" practice={{ kind: "skill", skillId: lesson.primarySkillId }} size="sm" variant="secondary" />
        </div>
      </header>

      <ol className="space-y-3">
        {exercises.map((row, i) => {
          const ex = row.payload as Exercise;
          const mine = attempts.filter((a) => a.exerciseId === ex.id);
          const first = mine.find((a) => a.isFirst);
          const correct = ex.options && ex.answerIndex !== undefined ? ex.options[ex.answerIndex] : expandAll(ex.accepted)[0];
          return (
            <li key={ex.id} className="card p-5">
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                <span className="font-medium text-ink">{i + 1}.</span> {EXERCISE_LABEL[ex.type]} · {ex.rule}
                {first && (first.verdict === "correct" ? <Badge tone="success"><Check /> First try</Badge> : first.verdict === "almost" ? <Badge tone="warning"><CircleAlert /> Almost</Badge> : <Badge tone="danger"><X /> Missed</Badge>)}
              </div>
              <p className="mt-2 font-medium">{ex.instruction}: <span className="font-normal">{ex.type === "listening" ? ex.audioText : ex.prompt}</span></p>
              {ex.lines?.map((l, k) => <p key={k} className="mt-1 text-sm text-muted" lang="fr">— {l.fr} <span className="text-subtle">({l.en})</span></p>)}
              {mine.length > 0 && (
                <ul className="mt-3 space-y-1 text-sm">
                  {mine.map((a) => (
                    <li key={a.id} className={cn("flex gap-2", a.verdict === "correct" ? "text-success" : a.verdict === "almost" ? "text-warning" : "text-danger")}>
                      {a.verdict === "correct" ? <Check className="mt-0.5 size-4 shrink-0" /> : a.verdict === "almost" ? <CircleAlert className="mt-0.5 size-4 shrink-0" /> : <X className="mt-0.5 size-4 shrink-0" />}
                      <span><span lang="fr">{a.answer || "—"}</span>{a.note && <span className="block text-muted">{a.note}</span>}{a.judgedBy === "ai" && <span className="text-xs text-subtle"> (AI-checked)</span>}</span>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-3 text-sm"><span className="text-muted">Answer: </span><span className="font-medium" lang="fr">{correct}</span></p>
              <p className="mt-1 text-sm text-muted">{ex.explanation}</p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
