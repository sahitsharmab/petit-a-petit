"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { AlertTriangle, ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Lightbulb, Loader2 } from "lucide-react";
import { EXERCISE_LABEL, type PublicExercise } from "@/lib/content/types";
import type { LessonIntro as Intro } from "@/lib/services/lessons";
import type { Feedback, PlayerState, SessionSummary } from "@/lib/services/sessions";
import { api } from "@/lib/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSpeech } from "../speech/use-speech";
import { lastMainPage } from "../shell/app-shell";
import { EMPTY_ANSWER, ExerciseView, answerToString, hasAnswer, isChoiceExercise, type AnswerState } from "./exercise-views";
import { FeedbackPanel } from "./feedback-panel";
import { LessonIntro } from "./lesson-intro";
import { LessonSummary } from "./lesson-summary";

const SECTION_LABEL: Record<string, string> = {
  warmup: "Warm-up review",
  core: "Practice",
  build: "Build a sentence",
  conversation: "Conversation",
  retry: "Second chance",
};

export interface PlayerProps {
  lesson: { id: string; title: string; subtitle: string; eyebrow: string; intro: Intro; primarySkillId: string; kind: string };
  exercises: PublicExercise[];
  sessionId: string;
  initialState: PlayerState;
  initialSummary: SessionSummary | null;
  settings: { speechRate: number; autoPlayAudio: boolean; showTranslations: boolean };
}

function restoreAnswer(ex: PublicExercise | undefined, last: string | undefined): AnswerState {
  if (!ex || last === undefined) return EMPTY_ANSWER;
  if (isChoiceExercise(ex)) return { ...EMPTY_ANSWER, choice: /^\d+$/.test(last) ? Number(last) : null };
  if (ex.type === "sentence_builder" && ex.tiles) {
    const used: number[] = [];
    for (const w of last.split(" ")) {
      const i = ex.tiles.findIndex((t, k) => t === w && !used.includes(k));
      if (i >= 0) used.push(i);
    }
    return { ...EMPTY_ANSWER, tiles: used };
  }
  return { ...EMPTY_ANSWER, text: last };
}

/** Counts focused, non-idle seconds and flushes them to the server. */
function useActiveTime(sessionId: string, enabled: boolean) {
  const pending = React.useRef(0);
  const lastInput = React.useRef(Date.now());
  React.useEffect(() => {
    if (!enabled) return;
    const bump = () => { lastInput.current = Date.now(); };
    const events = ["keydown", "pointerdown", "pointermove", "scroll", "touchstart"];
    events.forEach((e) => window.addEventListener(e, bump, { passive: true }));
    const tick = setInterval(() => {
      if (document.visibilityState === "visible" && Date.now() - lastInput.current < 90_000) pending.current += 1;
    }, 1000);
    const flush = (beacon = false) => {
      const delta = pending.current;
      if (delta <= 0) return;
      pending.current = 0;
      const url = `/api/sessions/${sessionId}/progress`;
      const body = JSON.stringify({ activeSecondsDelta: delta });
      if (beacon && navigator.sendBeacon) navigator.sendBeacon(url, new Blob([body], { type: "application/json" }));
      else fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body, keepalive: true }).catch(() => { pending.current += delta; });
    };
    const every = setInterval(() => flush(), 15_000);
    const onHide = () => { if (document.visibilityState === "hidden") flush(true); };
    const onPageHide = () => flush(true);
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      flush();
      clearInterval(tick);
      clearInterval(every);
      events.forEach((e) => window.removeEventListener(e, bump));
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, [sessionId, enabled]);
  return () => {
    const d = pending.current;
    pending.current = 0;
    return d;
  };
}

export function LessonPlayer({ lesson, exercises, sessionId, initialState, initialSummary, settings }: PlayerProps) {
  const router = useRouter();
  const [state, setState] = React.useState<PlayerState>(initialState);
  const [summary, setSummary] = React.useState<SessionSummary | null>(initialSummary);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [retrying, setRetrying] = React.useState(false);
  const [hintShown, setHintShown] = React.useState(false);
  /** Index of an answered question being looked at again (read-only), or null for the current one. */
  const [peek, setPeek] = React.useState<number | null>(null);
  const { speak, supported: speechSupported } = useSpeech(settings.speechRate);
  const byId = React.useMemo(() => new Map(exercises.map((e) => [e.id, e])), [exercises]);
  const takeActive = useActiveTime(sessionId, !summary);

  const inRetry = state.retryFrom !== null && state.index >= state.retryFrom;
  const exId = state.queue[state.index];
  const ex = exId ? byId.get(exId) : undefined;
  const resultKey = inRetry ? `${exId}#retry` : exId;
  const result = exId ? state.results[resultKey] : undefined;
  const feedback: Feedback | null = result?.feedback && !retrying ? result.feedback : null;
  const locked = !!feedback;
  const [answer, setAnswer] = React.useState<AnswerState>(() => restoreAnswer(ex, result?.lastAnswer));

  React.useEffect(() => {
    setAnswer(restoreAnswer(ex, state.results[resultKey]?.lastAnswer));
    setRetrying(false);
    setHintShown(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.index, resultKey]);

  const run = React.useCallback(async <T,>(fn: () => Promise<T>): Promise<T | undefined> => {
    setBusy(true);
    setError(null);
    try {
      return await fn();
    } catch (e) {
      setError((e as Error).message || "Something went wrong. Your progress is saved — try again.");
    } finally {
      setBusy(false);
    }
  }, []);

  const finish = React.useCallback(async () => {
    const delta = takeActive();
    await run(async () => {
      if (delta) await api(`/api/sessions/${sessionId}/progress`, { activeSecondsDelta: delta });
      const res = await api<{ summary: SessionSummary }>(`/api/sessions/${sessionId}/complete`);
      setSummary(res.summary);
      window.scrollTo({ top: 0 });
      router.refresh();
    });
  }, [run, sessionId, router, takeActive]);

  /** Once a question is over (right, wrong or revealed), say the correct sentence aloud. */
  const sayAnswer = React.useCallback((fb: Feedback) => {
    if (!ex || fb.canRetry || !settings.autoPlayAudio) return;
    const text = ex.type === "dialogue" ? fb.correctAnswer : ex.audioText;
    if (text) speak(text);
  }, [ex, settings.autoPlayAudio, speak]);

  const check = React.useCallback(async () => {
    if (!ex || busy || locked || !hasAnswer(ex, answer)) return;
    await run(async () => {
      const res = await api<{ feedback: Feedback; state: PlayerState }>(`/api/sessions/${sessionId}/attempt`, {
        exerciseId: ex.id, answer: answerToString(ex, answer), hintsUsed: hintShown ? 1 : 0, attemptNo: (result?.attempts ?? 0) + 1,
        transcriptShown: ex.type === "listening" && (answer.transcriptShown || !speechSupported),
        wordsRevealed: answer.revealed,
      });
      setState(res.state);
      setRetrying(false);
      sayAnswer(res.feedback);
    });
  }, [ex, busy, locked, answer, run, sessionId, hintShown, result?.attempts, speechSupported, sayAnswer]);

  const reveal = React.useCallback(async () => {
    if (!ex || busy) return;
    await run(async () => {
      const res = await api<{ feedback: Feedback; state: PlayerState }>(`/api/sessions/${sessionId}/attempt`, {
        exerciseId: ex.id, answer: answerToString(ex, answer) || "—", hintsUsed: 1, attemptNo: (result?.attempts ?? 0) + 1,
        wordsRevealed: answer.revealed,
      });
      setState(res.state);
      setRetrying(false);
      sayAnswer(res.feedback);
    });
  }, [ex, busy, run, sessionId, answer, result?.attempts, sayAnswer]);

  const next = React.useCallback(async () => {
    if (busy) return;
    await run(async () => {
      const res = await api<{ state: PlayerState }>(`/api/sessions/${sessionId}/advance`, { fromIndex: state.index });
      setState(res.state);
      window.scrollTo({ top: 0, behavior: "smooth" });
      if (res.state.index >= res.state.queue.length) await finish();
    });
  }, [busy, run, sessionId, state.index, finish]);

  const startExercises = React.useCallback(async () => {
    setState((s) => ({ ...s, phase: "exercise" }));
    window.scrollTo({ top: 0 });
    api(`/api/sessions/${sessionId}/progress`, { phase: "exercise" }).catch(() => {});
    if (state.queue.length === 0) await finish();
  }, [sessionId, state.queue.length, finish]);

  const practiceAgain = React.useCallback(async () => {
    await run(async () => {
      const res = await api<{ lessonId: string }>("/api/lessons/practice", { kind: "skill", skillId: lesson.primarySkillId });
      router.push(`/lesson/${res.lessonId}`);
    });
  }, [run, lesson.primarySkillId, router]);

  // Resume after a reload where every exercise was answered but completion didn't run.
  React.useEffect(() => {
    if (!summary && state.phase === "exercise" && state.queue.length > 0 && state.index >= state.queue.length) void finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keyboard: Enter checks / continues.
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter" || e.shiftKey || summary || state.phase !== "exercise" || peek !== null) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "BUTTON" || tag === "A") return;
      if (tag === "INPUT" || tag === "TEXTAREA") return; // inputs handle Enter themselves
      if (feedback && !feedback.canRetry) { e.preventDefault(); void next(); }
      else if (!locked) { e.preventDefault(); void check(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [feedback, locked, next, check, summary, state.phase, peek]);

  const total = state.queue.length;
  const doneCount = Math.min(total, state.index + (result?.done ? 1 : 0));
  const sectionKey = inRetry ? "retry" : ex?.section ?? "core";
  const minutes = Math.max(5, Math.round(exercises.length * 1.6 + (lesson.intro.showExplanation ? 4 : 0)));

  if (summary) {
    return (
      <Frame progress={1} label="Complete">
        <LessonSummary summary={summary} onPracticeAgain={practiceAgain} busy={busy} />
      </Frame>
    );
  }

  if (state.phase === "intro") {
    return (
      <Frame progress={0} label="Introduction">
        <LessonIntro intro={lesson.intro} eyebrow={lesson.eyebrow} title={lesson.title} subtitle={lesson.subtitle} count={exercises.length} minutes={minutes}
          onStart={startExercises} speak={speak} />
      </Frame>
    );
  }

  if (!ex) {
    return (
      <Frame progress={1} label="Finishing">
        <div className="grid min-h-[50vh] place-items-center text-muted">
          {error ? <ErrorNote message={error} onRetry={finish} /> : <Loader2 className="size-6 animate-spin" aria-label="Finishing lesson" />}
        </div>
      </Frame>
    );
  }

  // Looking back at an answered question: the saved answer and feedback, nothing can be changed.
  const peekId = peek !== null ? state.queue[peek] : undefined;
  const peekEx = peekId ? byId.get(peekId) : undefined;
  const peekResult = peekId ? state.results[state.retryFrom !== null && peek! >= state.retryFrom ? `${peekId}#retry` : peekId] : undefined;
  if (peek !== null && peekEx && peekResult?.feedback) {
    const go = (i: number) => { setPeek(i >= state.index ? null : i); window.scrollTo({ top: 0 }); };
    return (
      <MotionConfig reducedMotion="user">
        <Frame progress={total ? doneCount / total : 0} label={`${peek + 1} of ${total}`}>
          <div className="mx-auto max-w-2xl space-y-5 pb-72">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-medium text-muted">Looking back · question {peek + 1}</span>
              <span className="text-xs text-subtle">{EXERCISE_LABEL[peekEx.type]}</span>
            </div>
            <h1 className="text-[0.95rem] font-semibold text-muted">{peekEx.instruction}</h1>
            <ExerciseView key={`peek-${peek}`} ex={peekEx} answer={restoreAnswer(peekEx, peekResult.lastAnswer)} setAnswer={() => {}} feedback={peekResult.feedback} locked
              onSubmit={() => {}} speak={speak} speechSupported={speechSupported} autoPlay={false} showTranslations={settings.showTranslations} />
          </div>
          <div className="fixed inset-x-0 bottom-0 z-20">
            <FeedbackPanel feedback={peekResult.feedback} seed={peek} hint={peekEx.hint} speak={speak} isChoice={isChoiceExercise(peekEx)}
              onContinue={() => {}} onRetry={() => {}} onReveal={() => {}}
              actions={<>
                <Button variant="ghost" onClick={() => go(peek - 1)} disabled={peek === 0}><ChevronLeft /> Previous</Button>
                <Button size="lg" onClick={() => go(peek + 1)} autoFocus className="min-w-36">
                  {peek + 1 >= state.index ? <>Back to question {Math.min(state.index + 1, total)} <ArrowRight /></> : <>Next <ChevronRight /></>}
                </Button>
              </>} />
          </div>
        </Frame>
      </MotionConfig>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <Frame progress={total ? doneCount / total : 0} label={`${Math.min(state.index + 1, total)} of ${total}`}>
        <div className="mx-auto max-w-2xl pb-72">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={`${state.index}-${resultKey}`} initial={{ opacity: 0, x: 28 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -28 }}
              transition={{ duration: 0.22, ease: "easeOut" }} className="space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", sectionKey === "retry" ? "bg-warning-soft text-warning" : sectionKey === "warmup" ? "bg-surface-2 text-muted" : "bg-primary-soft text-primary")}>
                  {SECTION_LABEL[sectionKey]}
                </span>
                <span className="text-xs text-subtle">{EXERCISE_LABEL[ex.type]}</span>
                {ex.source === "ai" && <span className="text-xs text-subtle">· AI-generated</span>}
                {state.index > 0 && (
                  <button type="button" onClick={() => { setPeek(state.index - 1); window.scrollTo({ top: 0 }); }} disabled={busy}
                    className="ml-auto inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-muted hover:bg-surface-2 hover:text-ink">
                    <ChevronLeft className="size-3.5" /> Previous question
                  </button>
                )}
              </div>
              <h1 className="text-[0.95rem] font-semibold text-muted">{ex.instruction}</h1>
              {inRetry && !result?.attempts && state.index === state.retryFrom && (
                <p className="rounded-xl bg-warning-soft px-4 py-2.5 text-sm">Let&apos;s revisit the ones that tripped you up. These don&apos;t affect your score — they help it stick.</p>
              )}
              <ExerciseView ex={ex} answer={answer} setAnswer={setAnswer} feedback={feedback} locked={locked || busy} onSubmit={check}
                speak={speak} speechSupported={speechSupported} autoPlay={settings.autoPlayAudio} showTranslations={settings.showTranslations} />
              {hintShown && !feedback && (
                <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2 rounded-xl bg-warning-soft px-4 py-3 text-[0.95rem]">
                  <Lightbulb className="mt-0.5 size-4 shrink-0 text-warning" /> {ex.hint}
                </motion.p>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="fixed inset-x-0 bottom-0 z-20">
          {error && <div className="mx-auto mb-2 max-w-2xl px-4"><ErrorNote message={error} /></div>}
          <AnimatePresence mode="wait" initial={false}>
            {feedback ? (
              <FeedbackPanel key={`fb-${resultKey}-${result?.attempts}`} feedback={feedback} seed={state.index} hint={ex.hint} speak={speak} isChoice={isChoiceExercise(ex)}
                busy={busy} onContinue={next} onRetry={() => { setRetrying(true); setHintShown(true); }} onReveal={reveal} />
            ) : (
              <motion.div key="actions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="border-t border-border bg-background/92 backdrop-blur">
                <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6">
                  <Button variant="ghost" onClick={() => setHintShown(true)} disabled={hintShown || busy} aria-label="Show a hint">
                    <Lightbulb /> {hintShown ? "Hint shown" : "Hint"}
                  </Button>
                  <Button size="lg" onClick={check} disabled={busy || !hasAnswer(ex, answer)} className="min-w-36">
                    {busy ? <Loader2 className="animate-spin" /> : null} Check
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Frame>
    </MotionConfig>
  );
}

function Frame({ children, progress, label }: { children: React.ReactNode; progress: number; label: string }) {
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-4 px-4 py-3 sm:px-6">
          <BackButton />
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-2" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)} aria-label="Lesson progress">
            <motion.div className="h-full rounded-full bg-primary" initial={false} animate={{ width: `${Math.max(2, progress * 100)}%` }} transition={{ type: "spring", stiffness: 120, damping: 22 }} />
          </div>
          <span className="w-16 shrink-0 text-right text-xs font-medium tabular-nums text-muted">{label}</span>
        </div>
      </header>
      <div className="px-4 pt-6 sm:px-6 sm:pt-10">{children}</div>
    </div>
  );
}

/** Back to the page the lesson was opened from (Today, Learn, History…), or Today when opened directly. */
function BackButton() {
  const [href, setHref] = React.useState("/");
  React.useEffect(() => setHref(lastMainPage()), []);
  return (
    <Link href={href} title="Your progress is saved — you can come back any time"
      className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl px-2.5 text-sm font-medium text-muted hover:bg-surface-2 hover:text-ink">
      <ArrowLeft className="size-4" /> Back
    </Link>
  );
}

function ErrorNote({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex items-center gap-3 rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
      <AlertTriangle className="size-4 shrink-0" />
      <span className="flex-1">{message}</span>
      {onRetry && <Button size="sm" variant="outline" onClick={onRetry}>Retry</Button>}
    </div>
  );
}
