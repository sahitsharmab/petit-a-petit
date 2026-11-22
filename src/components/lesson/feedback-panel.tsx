"use client";
import { useCourse } from "@/components/course/course-context";
import { motion } from "motion/react";
import { ArrowRight, BookMarked, CheckCircle2, CircleAlert, Lightbulb, RotateCcw, Sparkles, XCircle } from "lucide-react";
import type { Mark } from "@/lib/french/evaluate";
import type { Feedback } from "@/lib/services/sessions";
import { Button } from "@/components/ui/button";
import { SpeakButton } from "../speech/speak-button";
import { cn } from "@/lib/utils";

function Marks({ marks, tone }: { marks: Mark[]; tone: "wrong" | "right" }) {
  const tl = useCourse().code;
  return (
    <span lang={tl}>
      {marks.map((m, i) => {
        const glue = m.token.endsWith("'") || marks[i + 1]?.token.startsWith("-");
        return (
          <span key={i}>
            <span className={cn(!m.ok && (tone === "wrong" ? "rounded bg-danger/15 px-0.5 text-danger line-through decoration-danger/60" : "rounded bg-success/15 px-0.5 font-semibold text-success"))}>{m.token}</span>
            {glue ? "" : " "}
          </span>
        );
      })}
    </span>
  );
}

export function FeedbackPanel({ feedback, seed, onContinue, onRetry, onReveal, hint, speak, isChoice, busy = false }: {
  feedback: Feedback;
  seed: number;
  /** A request is in flight: actions are disabled so they can't be sent twice. */
  busy?: boolean;
  onContinue: () => void;
  onRetry: () => void;
  onReveal: () => void;
  hint?: string;
  speak: (t: string) => void;
  isChoice: boolean;
}) {
  const course = useCourse();
  const tl = course.code;
  const v = feedback.verdict;
  const TITLES = course.praise;
  const title = TITLES[v][seed % TITLES[v].length];
  const Icon = v === "correct" ? CheckCircle2 : v === "almost" ? CircleAlert : XCircle;
  const palette = v === "correct" ? "bg-success-soft text-success border-success/25" : v === "almost" ? "bg-warning-soft text-warning border-warning/25" : "bg-danger-soft text-danger border-danger/25";
  const showCorrection = v !== "correct" && !feedback.canRetry;
  const hasDiff = feedback.answerMarks?.some((m) => !m.ok) && !isChoice;

  return (
    <motion.section role="status" aria-live="assertive" initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
      transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }} className={cn("border-t-2", palette)}>
      <div className="mx-auto max-w-2xl px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 sm:px-6 sm:pt-5">
        <div className="flex items-start gap-3">
          <motion.span initial={{ scale: 0.4, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 500, damping: 18 }}>
            <Icon className="mt-0.5 size-7" />
          </motion.span>
          <div className="min-w-0 flex-1 space-y-2.5 text-ink">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className={cn("font-display text-xl font-semibold", v === "correct" ? "text-success" : v === "almost" ? "text-warning" : "text-danger")}>{title}</h3>
              {feedback.judgedBy === "ai" && <span className="inline-flex items-center gap-1 rounded-full bg-surface/70 px-2 py-0.5 text-xs text-muted"><Sparkles className="size-3" /> AI-checked</span>}
            </div>

            {feedback.canRetry ? (
              <p className="text-[0.95rem]">{feedback.note ?? "Have another look — you can try once more."}</p>
            ) : (
              <>
                {feedback.note && <p className="text-[0.95rem]">{feedback.note}</p>}
                {showCorrection && (
                  <div className="rounded-xl bg-surface/80 px-3.5 py-2.5 text-[0.95rem]">
                    {hasDiff && (
                      <p className="mb-1 text-muted"><span className="mr-1.5 text-xs font-medium uppercase tracking-wide">You</span><Marks marks={feedback.answerMarks!} tone="wrong" /></p>
                    )}
                    <p className="flex items-center gap-1.5">
                      <span className="text-xs font-medium uppercase tracking-wide text-muted">Correct</span>
                      <span className="font-medium">
                        {hasDiff && feedback.expectedMarks ? <Marks marks={feedback.expectedMarks} tone="right" /> : <span lang={tl}>{feedback.correctAnswer}</span>}
                      </span>
                      {!isChoice || /[a-zàâéèêç]/i.test(feedback.correctAnswer) ? <SpeakButton onSpeak={() => speak(feedback.correctAnswer)} className="-my-1" /> : null}
                    </p>
                  </div>
                )}
                {(v === "correct" || !feedback.note || feedback.note !== feedback.explanation) && feedback.explanation && (
                  <p className="text-[0.93rem] text-muted">{feedback.explanation}</p>
                )}
                {feedback.translation && v !== "incorrect" && <p className="text-sm text-muted">“{feedback.translation}”</p>}
              </>
            )}
            {feedback.canRetry && hint && (
              <p className="flex items-start gap-2 rounded-xl bg-surface/80 px-3.5 py-2.5 text-[0.93rem]"><Lightbulb className="mt-0.5 size-4 shrink-0 text-warning" /> {hint}</p>
            )}
            <p className="flex items-center gap-1.5 text-xs text-muted"><BookMarked className="size-3.5" /> {feedback.rule}</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          {feedback.canRetry ? (
            <>
              <Button variant="ghost" onClick={onReveal} disabled={busy}>Show answer</Button>
              <Button variant="danger" onClick={onRetry} disabled={busy} autoFocus><RotateCcw /> Try again</Button>
            </>
          ) : (
            <Button variant={v === "correct" ? "success" : v === "almost" ? "primary" : "danger"} size="lg" onClick={onContinue} disabled={busy} autoFocus className="min-w-36">
              Continue <ArrowRight />
            </Button>
          )}
        </div>
      </div>
    </motion.section>
  );
}
