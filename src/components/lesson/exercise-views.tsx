"use client";
import { useCourse } from "@/components/course/course-context";
import * as React from "react";
import { LayoutGroup, motion } from "motion/react";
import { Check, Eye, Headphones, Mic, MicOff, RotateCcw, Snail, Undo2, Volume2, X } from "lucide-react";
import type { PublicExercise } from "@/lib/content/types";
import type { Feedback } from "@/lib/services/sessions";
import { cn } from "@/lib/utils";
import { AccentBar } from "./accent-bar";
import { SpeakButton } from "../speech/speak-button";
import { useSpeechInput } from "../speech/use-speech";

export interface AnswerState {
  text: string;
  choice: number | null;
  tiles: number[];
  /** Listening: the learner revealed the transcript (reported as supported practice). */
  transcriptShown: boolean;
}

export const EMPTY_ANSWER: AnswerState = { text: "", choice: null, tiles: [], transcriptShown: false };

export interface ViewProps {
  ex: PublicExercise;
  answer: AnswerState;
  setAnswer: (a: AnswerState) => void;
  feedback: Feedback | null;
  locked: boolean;
  onSubmit: () => void;
  speak: (text: string, rate?: number) => void;
  speechSupported: boolean;
  autoPlay: boolean;
  showTranslations: boolean;
}

export function isChoiceExercise(ex: PublicExercise) {
  return !!ex.options?.length;
}

export function answerToString(ex: PublicExercise, a: AnswerState): string {
  if (isChoiceExercise(ex)) return a.choice === null ? "" : String(a.choice);
  if (ex.type === "sentence_builder") return a.tiles.map((i) => ex.tiles![i]).join(" ");
  return a.text;
}

export function hasAnswer(ex: PublicExercise, a: AnswerState) {
  return answerToString(ex, a).trim().length > 0;
}

// ─────────────────────────── shared pieces ───────────────────────────

function TextAnswer({ value, onChange, onSubmit, locked, multiline, placeholder, label, feedback }: {
  value: string; onChange: (v: string) => void; onSubmit: () => void; locked: boolean; multiline?: boolean; placeholder?: string; label: string; feedback: Feedback | null;
}) {
  const tl = useCourse().code;
  const ref = React.useRef<HTMLInputElement & HTMLTextAreaElement>(null);
  React.useEffect(() => {
    if (!locked) ref.current?.focus({ preventScroll: true });
  }, [locked]);
  const tone = feedback ? (feedback.verdict === "correct" ? "border-success ring-success/20" : feedback.verdict === "almost" ? "border-warning ring-warning/20" : "border-danger ring-danger/15") : "border-border focus:border-primary ring-primary/15";
  const common = {
    ref, value, "aria-label": label, placeholder, lang: tl, disabled: locked, autoComplete: "off", autoCorrect: "off", autoCapitalize: "off", spellCheck: false,
    onChange: (e: React.ChangeEvent<HTMLInputElement & HTMLTextAreaElement>) => onChange(e.target.value),
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSubmit(); }
    },
    className: cn("w-full rounded-2xl border-2 bg-surface px-4 py-3.5 text-lg text-ink placeholder:text-subtle outline-none ring-4 ring-transparent transition-[border-color,box-shadow] focus:ring-4 disabled:opacity-90", tone),
  };
  return (
    <div className="space-y-3">
      {multiline ? <textarea rows={2} {...common} className={cn(common.className, "resize-none leading-relaxed")} /> : <input type="text" {...common} />}
      {!locked && <AccentBar inputRef={ref} onInsert={onChange} />}
    </div>
  );
}

function OptionList({ ex, answer, setAnswer, feedback, locked, onSubmit }: Pick<ViewProps, "ex" | "answer" | "setAnswer" | "feedback" | "locked" | "onSubmit">) {
  const tl = useCourse().code;
  const opts = ex.options ?? [];
  const refs = React.useRef<(HTMLButtonElement | null)[]>([]);
  // Radio-group keyboard pattern: one tab stop; arrows move focus and select (wrapping), Home/End jump.
  const onRadioKey = (e: React.KeyboardEvent, i: number) => {
    if (locked || !opts.length) return;
    if (e.key === "Enter") {
      // Enter on an option checks the answer (Space selects, as for any radio).
      e.preventDefault();
      if (answer.choice === null) setAnswer({ ...answer, choice: i });
      else onSubmit();
      return;
    }
    const last = opts.length - 1;
    const next = e.key === "ArrowDown" || e.key === "ArrowRight" ? (i === last ? 0 : i + 1)
      : e.key === "ArrowUp" || e.key === "ArrowLeft" ? (i === 0 ? last : i - 1)
        : e.key === "Home" ? 0 : e.key === "End" ? last : null;
    if (next === null) return;
    e.preventDefault();
    setAnswer({ ...answer, choice: next });
    refs.current[next]?.focus();
  };
  const tabStop = answer.choice ?? 0;
  React.useEffect(() => {
    if (locked) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT" || (e.target as HTMLElement)?.tagName === "TEXTAREA") return;
      const n = Number(e.key);
      if (n >= 1 && n <= opts.length) setAnswer({ ...answer, choice: n - 1 });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [locked, opts.length, answer, setAnswer]);

  return (
    <div role="radiogroup" aria-label="Answer options" className="grid gap-2.5">
      {opts.map((o, i) => {
        const selected = answer.choice === i;
        const isCorrect = feedback && feedback.correctIndex === i;
        const isWrongPick = feedback && feedback.chosenIndex === i && feedback.verdict === "incorrect";
        return (
          <motion.button key={i} type="button" role="radio" aria-checked={selected} disabled={locked}
            ref={(el: HTMLButtonElement | null) => { refs.current[i] = el; }} tabIndex={i === tabStop ? 0 : -1}
            onKeyDown={(e) => onRadioKey(e, i)}
            onClick={() => setAnswer({ ...answer, choice: i })}
            onDoubleClick={() => { setAnswer({ ...answer, choice: i }); onSubmit(); }}
            animate={isWrongPick ? { x: [0, -6, 6, -3, 3, 0] } : undefined} transition={{ duration: 0.35 }}
            className={cn(
              "group flex w-full items-center gap-3.5 rounded-2xl border-2 bg-surface px-4 py-3.5 text-left text-[1.02rem] transition-all",
              !feedback && (selected ? "border-primary bg-primary-soft/60 shadow-soft" : "border-border hover:border-primary/40 hover:bg-surface-2/40"),
              isCorrect && "border-success bg-success-soft",
              isWrongPick && "border-danger bg-danger-soft",
              feedback && !isCorrect && !isWrongPick && "border-border opacity-60",
            )}>
            <span className={cn("grid size-7 shrink-0 place-items-center rounded-lg border text-xs font-semibold",
              isCorrect ? "border-success bg-success text-white dark:text-[#0d1f1b]" : isWrongPick ? "border-danger bg-danger text-white dark:text-[#2a1110]" : selected ? "border-primary bg-primary text-primary-ink" : "border-border text-muted")}>
              {isCorrect ? <Check className="size-4" /> : isWrongPick ? <X className="size-4" /> : i + 1}
            </span>
            <span className="flex-1" lang={ex.type === "listening" && ex.mode === "choice" ? "en" : tl}>{o}</span>
          </motion.button>
        );
      })}
    </div>
  );
}

function PromptCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("rounded-3xl border border-border bg-surface px-5 py-5 shadow-soft sm:px-6", className)}>{children}</div>;
}

// ─────────────────────────── per-type views ───────────────────────────

function MultipleChoiceView(p: ViewProps) {
  const tl = useCourse().code;
  // Target-language prompts have a gap, accents or quotes; English questions get no speak button.
  const isFrenchPrompt = /___|[éèàçùäöüß]/.test(p.ex.prompt) || p.ex.prompt.startsWith("«");
  return (
    <div className="space-y-5">
      <PromptCard>
        <div className="flex items-start gap-3">
          <p className={cn("flex-1 font-display text-[1.45rem] leading-snug text-balance", "sm:text-[1.6rem]")} lang={isFrenchPrompt ? tl : "en"}>
            {renderBlank(p.ex.prompt)}
          </p>
          {p.ex.audioText && isFrenchPrompt && <SpeakButton onSpeak={() => p.speak(p.ex.audioText!)} />}
        </div>
        {p.ex.promptNote && <p className="mt-2 text-sm text-muted">{p.ex.promptNote}</p>}
      </PromptCard>
      <OptionList {...p} />
    </div>
  );
}

function renderBlank(text: string) {
  const parts = text.split("___");
  if (parts.length === 1) return text;
  return parts.map((part, i) => (
    <React.Fragment key={i}>
      {part}
      {i < parts.length - 1 && <span className="mx-1 inline-block w-16 border-b-2 border-primary/50 align-baseline" aria-label="blank" />}
    </React.Fragment>
  ));
}

function FillBlankView(p: ViewProps) {
  const tl = useCourse().code;
  const ref = React.useRef<HTMLInputElement>(null);
  const before = p.ex.blank?.before ?? "";
  const after = p.ex.blank?.after ?? "";
  React.useEffect(() => { if (!p.locked) ref.current?.focus({ preventScroll: true }); }, [p.locked]);
  const width = Math.max(5, p.answer.text.length + 2, (p.feedback?.correctAnswer.length ?? 0) * 0.6);
  const tone = p.feedback ? (p.feedback.verdict === "correct" ? "border-success text-success" : p.feedback.verdict === "almost" ? "border-warning text-warning" : "border-danger text-danger") : "border-primary/60 focus:border-primary";
  return (
    <div className="space-y-5">
      <PromptCard className="py-8">
        <p className="font-display text-[1.55rem] leading-[2.4rem] sm:text-[1.75rem]" lang={tl}>
          {before}
          <input ref={ref} value={p.answer.text} disabled={p.locked} aria-label="Missing word" lang={tl}
            autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false}
            onChange={(e) => p.setAnswer({ ...p.answer, text: e.target.value })}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); p.onSubmit(); } }}
            style={{ width: `${width}ch` }}
            className={cn("mx-1 inline-block border-b-2 bg-transparent px-1 text-center font-sans text-[1.25rem] font-medium outline-none transition-colors disabled:opacity-100", tone)} />
          {after}
        </p>
        {p.ex.promptNote && <p className="mt-4 text-sm text-muted">{p.ex.promptNote}</p>}
      </PromptCard>
      {!p.locked && <AccentBar inputRef={ref} onInsert={(v) => p.setAnswer({ ...p.answer, text: v })} />}
    </div>
  );
}

function ConjugationView(p: ViewProps) {
  const tl = useCourse().code;
  const [verb, subject] = p.ex.prompt.split(" → ");
  return (
    <div className="space-y-5">
      <PromptCard className="text-center">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-subtle">{p.ex.promptNote}</p>
        <div className="mt-3 flex flex-wrap items-baseline justify-center gap-3">
          <span className="rounded-xl bg-primary-soft px-3 py-1 font-display text-2xl text-primary" lang={tl}>{subject}</span>
          <span className="text-subtle">+</span>
          <span className="font-display text-[2rem] italic" lang={tl}>{verb}</span>
        </div>
        {p.showTranslations && p.ex.translation && <p className="mt-3 text-sm text-muted">“{p.ex.translation}”</p>}
      </PromptCard>
      <TextAnswer value={p.answer.text} onChange={(v) => p.setAnswer({ ...p.answer, text: v })} onSubmit={p.onSubmit} locked={p.locked}
        placeholder={`${subject} …`} label="Conjugated verb" feedback={p.feedback} />
    </div>
  );
}

function TranslationView(p: ViewProps) {
  const course = useCourse();
  return (
    <div className="space-y-5">
      <PromptCard>
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-subtle">English</p>
        <p className="mt-2 font-display text-[1.5rem] leading-snug text-balance sm:text-[1.65rem]">{p.ex.prompt}</p>
      </PromptCard>
      <TextAnswer value={p.answer.text} onChange={(v) => p.setAnswer({ ...p.answer, text: v })} onSubmit={p.onSubmit} locked={p.locked} multiline
        placeholder={course.writePlaceholder} label={`Your ${course.name} translation`} feedback={p.feedback} />
    </div>
  );
}

function TransformationView(p: ViewProps) {
  const tl = useCourse().code;
  return (
    <div className="space-y-5">
      <PromptCard>
        <div className="flex items-start gap-3">
          <p className="flex-1 font-display text-[1.5rem] leading-snug" lang={tl}>{p.ex.prompt}</p>
          {p.ex.audioText && <SpeakButton onSpeak={() => p.speak(p.ex.prompt)} />}
        </div>
        {p.ex.promptNote && <p className="mt-2 text-sm text-muted">{p.ex.promptNote}</p>}
        {p.showTranslations && p.ex.translation && <p className="mt-2 text-sm text-muted">“{p.ex.translation}”</p>}
      </PromptCard>
      <TextAnswer value={p.answer.text} onChange={(v) => p.setAnswer({ ...p.answer, text: v })} onSubmit={p.onSubmit} locked={p.locked} multiline
        placeholder="Rewrite the sentence…" label="Transformed sentence" feedback={p.feedback} />
    </div>
  );
}

function SentenceBuilderView(p: ViewProps) {
  const course = useCourse();
  const tl = course.code;
  const tiles = p.ex.tiles ?? [];
  const chosen = p.answer.tiles;
  const add = (i: number) => !p.locked && p.setAnswer({ ...p.answer, tiles: [...chosen, i] });
  const remove = (pos: number) => !p.locked && p.setAnswer({ ...p.answer, tiles: chosen.filter((_, k) => k !== pos) });
  const tone = p.feedback ? (p.feedback.verdict === "correct" ? "border-success bg-success-soft/40" : p.feedback.verdict === "almost" ? "border-warning bg-warning-soft/40" : "border-danger bg-danger-soft/40") : "border-border";
  return (
    <div className="space-y-5">
      <PromptCard>
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-subtle">Build this in {course.name}</p>
        <p className="mt-2 font-display text-[1.45rem] leading-snug text-balance">{p.ex.prompt}</p>
      </PromptCard>
      <LayoutGroup>
        <div aria-label="Your sentence" aria-live="polite"
          className={cn("flex min-h-[4.5rem] flex-wrap content-start gap-2 rounded-2xl border-2 border-dashed p-3 transition-colors", tone)}>
          {chosen.length === 0 && <span className="self-center px-1 text-sm text-subtle">Tap the words below in order…</span>}
          {chosen.map((ti, pos) => (
            <motion.button layout layoutId={`tile-${ti}`} key={`c-${ti}`} type="button" disabled={p.locked} onClick={() => remove(pos)}
              aria-label={`Remove ${tiles[ti]}`}
              className="rounded-xl border border-primary/30 bg-surface px-3.5 py-2 text-[1.02rem] font-medium shadow-soft" lang={tl}>
              {tiles[ti]}
            </motion.button>
          ))}
        </div>
        <div className="flex flex-wrap justify-center gap-2" aria-label="Word bank">
          {tiles.map((t, i) =>
            chosen.includes(i) ? (
              <span key={`b-${i}`} className="rounded-xl border border-dashed border-border px-3.5 py-2 text-[1.02rem] text-transparent select-none" aria-hidden>{t}</span>
            ) : (
              <motion.button layout layoutId={`tile-${i}`} key={`b-${i}`} type="button" disabled={p.locked} onClick={() => add(i)}
                className="rounded-xl border border-border bg-surface px-3.5 py-2 text-[1.02rem] font-medium shadow-soft transition-colors hover:border-primary/50 hover:bg-primary-soft/50" lang={tl}>
                {t}
              </motion.button>
            ),
          )}
        </div>
      </LayoutGroup>
      {!p.locked && (
        <div className="flex justify-center gap-2">
          <button type="button" onClick={() => p.setAnswer({ ...p.answer, tiles: chosen.slice(0, -1) })} disabled={!chosen.length}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted hover:bg-surface-2 hover:text-ink disabled:opacity-40"><Undo2 className="size-4" /> Undo</button>
          <button type="button" onClick={() => p.setAnswer({ ...p.answer, tiles: [] })} disabled={!chosen.length}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted hover:bg-surface-2 hover:text-ink disabled:opacity-40"><RotateCcw className="size-4" /> Reset</button>
        </div>
      )}
    </div>
  );
}

function ListeningView(p: ViewProps) {
  const tl = useCourse().code;
  const [plays, setPlays] = React.useState(0);
  const reveal = p.answer.transcriptShown;
  const setReveal = (v: boolean) => p.setAnswer({ ...p.answer, transcriptShown: v });
  const text = p.ex.audioText ?? "";
  const { speak } = p;
  const play = React.useCallback((rate?: number) => { speak(text, rate); setPlays((n) => n + 1); }, [speak, text]);
  const played = React.useRef(false);
  React.useEffect(() => {
    if (p.autoPlay && p.speechSupported && !played.current) {
      played.current = true;
      const t = setTimeout(() => play(), 350);
      return () => clearTimeout(t);
    }
  }, [p.autoPlay, p.speechSupported, play]);

  return (
    <div className="space-y-5">
      <PromptCard className="flex flex-col items-center gap-4 py-8 text-center">
        <motion.button type="button" onClick={() => play()} whileTap={{ scale: 0.94 }} aria-label="Play audio"
          className="grid size-20 place-items-center rounded-full bg-primary text-primary-ink shadow-[0_10px_30px_-10px_var(--primary)]">
          <Volume2 className="size-8" />
        </motion.button>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => play(0.65)} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted hover:bg-surface-2 hover:text-ink">
            <Snail className="size-4" /> Slower
          </button>
          {(!p.speechSupported || reveal || p.locked) ? null : (
            <button type="button" onClick={() => setReveal(true)} title="Counts as supported listening, not unaided"
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted hover:bg-surface-2 hover:text-ink">
              <Eye className="size-4" /> Show text
            </button>
          )}
        </div>
        <p className="text-xs text-muted">{plays === 0 ? "Press play — replay as often as you like." : `Played ${plays}×`}</p>
        {(!p.speechSupported || reveal) && !p.locked && (
          <div className="rounded-xl bg-surface-2 px-3 py-2 text-sm">
            {!p.speechSupported && <span className="mb-1 flex items-center justify-center gap-1 text-xs text-muted"><Headphones className="size-3.5" /> Audio isn&apos;t available in this browser — read instead:</span>}
            <p lang={tl}>{text}</p>
            <p className="mt-1 text-xs text-muted">With the text shown, this counts as supported listening practice.</p>
          </div>
        )}
      </PromptCard>
      {p.ex.mode === "choice" ? (
        <>
          <p className="text-center font-medium">{p.ex.prompt}</p>
          <OptionList {...p} />
        </>
      ) : (
        <TextAnswer value={p.answer.text} onChange={(v) => p.setAnswer({ ...p.answer, text: v })} onSubmit={p.onSubmit} locked={p.locked}
          placeholder="Write what you hear…" label="What you heard" feedback={p.feedback} />
      )}
    </div>
  );
}

function DialogueView(p: ViewProps) {
  const tl = useCourse().code;
  const lines = React.useMemo(() => p.ex.lines ?? [], [p.ex.lines]);
  const played = React.useRef(false);
  const { autoPlay, speechSupported, speak } = p;
  React.useEffect(() => {
    if (autoPlay && speechSupported && !played.current && lines.length) {
      played.current = true;
      const t = setTimeout(() => speak(lines[lines.length - 1].fr), 400);
      return () => clearTimeout(t);
    }
  }, [autoPlay, speechSupported, speak, lines]);
  const chosen = p.answer.choice !== null && p.feedback ? p.ex.options?.[p.answer.choice] : null;
  return (
    <div className="space-y-5">
      <p className="rounded-xl bg-surface-2/70 px-4 py-2.5 text-sm text-muted">{p.ex.prompt}</p>
      <div className="space-y-3" aria-live="polite">
        {lines.map((l, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className={cn("flex items-end gap-2", l.who === "you" && "justify-end")}>
            {l.who === "them" && <div className="grid size-8 shrink-0 place-items-center rounded-full bg-primary-soft text-xs font-semibold text-primary" aria-hidden>{tl.toUpperCase()}</div>}
            <div className={cn("max-w-[85%] rounded-2xl px-4 py-3 shadow-soft", l.who === "them" ? "rounded-bl-md border border-border bg-surface" : "rounded-br-md bg-primary text-primary-ink")}>
              <div className="flex items-start gap-2">
                <p className="text-[1.05rem]" lang={tl}>{l.fr}</p>
                {l.who === "them" && <SpeakButton onSpeak={() => p.speak(l.fr)} className="-my-1 -mr-2" />}
              </div>
              {p.showTranslations && <p className={cn("mt-1 text-sm", l.who === "them" ? "text-muted" : "text-primary-ink/80")}>{l.en}</p>}
            </div>
          </motion.div>
        ))}
        {chosen && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end">
            <div className={cn("max-w-[85%] rounded-2xl rounded-br-md px-4 py-3 shadow-soft", p.feedback?.verdict === "correct" ? "bg-success text-white dark:text-[#0d1f1b]" : "bg-danger text-white dark:text-[#2a1110]")} lang={tl}>{chosen}</div>
          </motion.div>
        )}
      </div>
      {!p.feedback && <p className="text-sm font-medium text-muted">Your reply:</p>}
      <OptionList {...p} />
    </div>
  );
}

export function ExerciseView(p: ViewProps) {
  switch (p.ex.type) {
    case "multiple_choice": return <MultipleChoiceView {...p} />;
    case "fill_blank": return <FillBlankView {...p} />;
    case "conjugation": return <ConjugationView {...p} />;
    case "translation": return <TranslationView {...p} />;
    case "transformation": return <TransformationView {...p} />;
    case "sentence_builder": return <SentenceBuilderView {...p} />;
    case "listening": return <ListeningView {...p} />;
    case "dialogue": return <DialogueView {...p} />;
  }
}

/** Mic button for free-text answers (optional, where the browser supports it). */
export function MicButton({ onText }: { onText: (t: string) => void }) {
  const { supported, listening, toggle } = useSpeechInput(onText);
  if (!supported) return null;
  return (
    <button type="button" onClick={toggle} aria-pressed={listening} aria-label={listening ? "Stop listening" : "Answer by speaking"}
      className={cn("grid size-11 place-items-center rounded-xl border transition-colors", listening ? "animate-pulse border-danger bg-danger-soft text-danger" : "border-border bg-surface text-muted hover:text-ink")}>
      {listening ? <MicOff className="size-5" /> : <Mic className="size-5" />}
    </button>
  );
}
