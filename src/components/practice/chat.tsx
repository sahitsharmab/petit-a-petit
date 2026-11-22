"use client";
import * as React from "react";
import Link from "next/link";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { ArrowLeft, BookOpenText, CircleAlert, Flag, Languages, Lightbulb, Loader2, SendHorizontal, Sparkles, Wand2 } from "lucide-react";
import type { ChatMessage, ConversationRecord } from "@/lib/services/conversations";
import { api } from "@/lib/client";
import { SKILL_BY_ID } from "@/lib/content/curriculum";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { SpeakButton } from "@/components/speech/speak-button";
import { useSpeech } from "@/components/speech/use-speech";
import { AccentBar } from "@/components/lesson/accent-bar";
import { MicButton } from "@/components/lesson/exercise-views";
import { StartLessonButton } from "@/components/dashboard/start-lesson-button";
import { cn } from "@/lib/utils";

export function Chat({ initial, scenario, settings, initialFinished }: {
  initial: ConversationRecord;
  scenario: { title: string; goal: string; partner: string; vocabulary: { fr: string; en: string }[] };
  settings: { showTranslations: boolean; speechRate: number; autoPlayAudio: boolean };
  initialFinished: boolean;
}) {
  const [conv, setConv] = React.useState(initial);
  const [finished, setFinished] = React.useState(initialFinished);
  const [text, setText] = React.useState("");
  const [busy, setBusy] = React.useState<null | "send" | "end" | "explain">(null);
  const [error, setError] = React.useState<string | null>(null);
  const [showEn, setShowEn] = React.useState(settings.showTranslations);
  const [showHints, setShowHints] = React.useState(false);
  const [translateLast, setTranslateLast] = React.useState(false);
  const [explanation, setExplanation] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);
  const endRef = React.useRef<HTMLDivElement>(null);
  const { speak } = useSpeech(settings.speechRate);
  const spokenCount = React.useRef(initial.messages.length);

  const lastPartner = [...conv.messages].reverse().find((m) => m.role === "partner");
  const done = conv.status === "completed";

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    if (conv.messages.length > spokenCount.current) {
      spokenCount.current = conv.messages.length;
      const last = conv.messages[conv.messages.length - 1];
      if (last.role === "partner" && settings.autoPlayAudio) speak(last.fr);
    }
  }, [conv.messages, speak, settings.autoPlayAudio]);

  const send = async (payload: { text: string; replyIndex?: number }) => {
    if (busy || done) return;
    setBusy("send");
    setError(null);
    try {
      const res = await api<{ conversation: ConversationRecord; finished: boolean }>(`/api/conversations/${conv.id}/message`, payload);
      setConv(res.conversation);
      setFinished(res.finished);
      setText("");
      setShowHints(false);
      setTranslateLast(false);
      setExplanation(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
      inputRef.current?.focus();
    }
  };

  const end = async () => {
    setBusy("end");
    setError(null);
    try {
      const res = await api<{ conversation: ConversationRecord }>(`/api/conversations/${conv.id}/end`);
      setConv(res.conversation);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const explain = async () => {
    setBusy("explain");
    try {
      const res = await api<{ text: string }>(`/api/conversations/${conv.id}/explain`);
      setExplanation(res.text);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  if (done && conv.summary) return <ConversationSummaryView conv={conv} title={scenario.title} speak={speak} />;

  return (
    <MotionConfig reducedMotion="user">
      <div className="mx-auto flex max-w-2xl flex-col pb-64">
        <div className="flex items-center justify-between gap-3">
          <Link href="/practice" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"><ArrowLeft className="size-4" /> Practice</Link>
          <label className="flex items-center gap-2 text-sm text-muted">English <Switch checked={showEn} onCheckedChange={setShowEn} aria-label="Show English translations" /></label>
        </div>
        <header className="mt-4 space-y-1">
          <h1 className="font-display text-[1.9rem] font-semibold leading-tight">{scenario.title}</h1>
          <p className="text-sm text-muted"><span className="font-medium text-ink">Goal:</span> {scenario.goal}</p>
          <p className="text-xs text-subtle">{conv.mode === "ai" ? <><Sparkles className="mr-1 inline size-3" />AI partner · adapted to {conv.level}</> : <>Guided conversation · {conv.level}</>}</p>
        </header>

        <div className="mt-6 space-y-4" aria-live="polite">
          {conv.messages.map((m, i) => <Bubble key={i} m={m} showEn={showEn || (translateLast && m === lastPartner)} speak={speak} />)}
          {busy === "send" && (
            <div className="flex items-center gap-2 pl-10 text-sm text-muted"><Loader2 className="size-4 animate-spin" /> …</div>
          )}
          <div ref={endRef} />
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 backdrop-blur lg:left-[248px]">
        <div className="mx-auto max-w-2xl space-y-3 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6">
          {error && <p role="alert" className="text-sm text-danger">{error}</p>}
          <AnimatePresence>
            {explanation && (
              <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="whitespace-pre-line rounded-xl bg-primary-soft/60 px-4 py-2.5 text-sm">{explanation}</motion.p>
            )}
          </AnimatePresence>
          {finished ? (
            <div className="flex flex-col items-center gap-2 py-2 text-center">
              <p className="text-sm text-muted">The conversation has reached its end. Bravo !</p>
              <Button onClick={end} disabled={!!busy} size="lg">{busy === "end" ? <Loader2 className="animate-spin" /> : <Flag />} See my feedback</Button>
            </div>
          ) : (
            <>
              {showHints && lastPartner?.suggestions?.length ? (
                <div className="flex flex-wrap gap-2">
                  {lastPartner.suggestions.map((s, i) => (
                    <button key={i} type="button" onClick={() => setText(s.fr)} disabled={!!busy}
                      className="rounded-xl border border-primary/25 bg-primary-soft/50 px-3 py-1.5 text-left text-sm hover:bg-primary-soft" lang="fr">
                      {s.fr}{showEn && <span className="block text-xs text-muted" lang="en">{s.en}</span>}
                    </button>
                  ))}
                </div>
              ) : null}
              <div className="flex flex-wrap items-center gap-1">
                <HelpButton icon={Lightbulb} label="Hint" onClick={() => setShowHints((v) => !v)} active={showHints} />
                <HelpButton icon={Languages} label="Translate" onClick={() => setTranslateLast((v) => !v)} active={translateLast} />
                <HelpButton icon={Wand2} label="Explain" onClick={explain} busy={busy === "explain"} />
                <button type="button" onClick={end} disabled={!!busy || !conv.messages.some((m) => m.role === "learner")} className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-muted hover:bg-surface-2 hover:text-ink disabled:opacity-40">
                  <Flag className="size-4" /> End & review
                </button>
              </div>
              <form className="flex items-end gap-2" onSubmit={(e) => { e.preventDefault(); if (text.trim()) void send({ text }); }}>
                <textarea ref={inputRef} value={text} onChange={(e) => setText(e.target.value)} rows={1} lang="fr" aria-label="Your reply in French"
                  placeholder="Répondez en français…" autoComplete="off" autoCorrect="off" spellCheck={false}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (text.trim()) void send({ text }); } }}
                  className="max-h-32 min-h-11 flex-1 resize-none rounded-xl border-2 border-border bg-surface px-3.5 py-2.5 outline-none focus:border-primary" />
                <MicButton onText={(t) => setText((prev) => (prev ? prev + " " : "") + t)} />
                <Button type="submit" size="icon" className="size-11" disabled={!text.trim() || !!busy} aria-label="Send"><SendHorizontal className="size-5" /></Button>
              </form>
              <AccentBar inputRef={inputRef} onInsert={setText} />
            </>
          )}
        </div>
      </div>
    </MotionConfig>
  );
}

function HelpButton({ icon: Icon, label, onClick, active, busy }: { icon: typeof Lightbulb; label: string; onClick: () => void; active?: boolean; busy?: boolean }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active}
      className={cn("inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm transition-colors", active ? "bg-primary-soft text-primary" : "text-muted hover:bg-surface-2 hover:text-ink")}>
      {busy ? <Loader2 className="size-4 animate-spin" /> : <Icon className="size-4" />} {label}
    </button>
  );
}

function Bubble({ m, showEn, speak }: { m: ChatMessage; showEn: boolean; speak: (t: string) => void }) {
  if (m.role === "note") return <p className="rounded-xl bg-surface-2 px-4 py-2 text-center text-xs text-muted">{m.fr}</p>;
  const partner = m.role === "partner";
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={cn("flex flex-col gap-1.5", partner ? "items-start" : "items-end")}>
      <div className={cn("flex max-w-[88%] items-end gap-2", !partner && "flex-row-reverse")}>
        {partner && <div className="grid size-8 shrink-0 place-items-center rounded-full bg-primary-soft text-xs font-semibold text-primary" aria-hidden>FR</div>}
        <div className={cn("rounded-2xl px-4 py-2.5 shadow-soft", partner ? "rounded-bl-md border border-border bg-surface" : "rounded-br-md bg-primary text-primary-ink")}>
          <div className="flex items-start gap-1.5">
            <p className="text-[1.02rem]" lang="fr">{m.fr}</p>
            {partner && <SpeakButton onSpeak={() => speak(m.fr)} className="-my-1 -mr-2" />}
          </div>
          {partner && showEn && m.en && <p className="mt-1 text-sm text-muted">{m.en}</p>}
        </div>
      </div>
      {m.correction && (
        <div className="max-w-[88%] rounded-xl border border-warning/25 bg-warning-soft px-3.5 py-2 text-sm">
          <p className="flex items-center gap-1.5 font-medium text-warning"><CircleAlert className="size-3.5" /> Better: <span className="text-ink" lang="fr">{m.correction.corrected}</span></p>
          {m.correction.explanation && <p className="mt-0.5 text-muted">{m.correction.explanation}</p>}
        </div>
      )}
      {m.model && !m.correction && (
        <p className="max-w-[88%] text-xs text-muted">Understood ✓ · a natural way to say it: <span lang="fr" className="text-ink">{m.model}</span></p>
      )}
    </motion.div>
  );
}

function ConversationSummaryView({ conv, title, speak }: { conv: ConversationRecord; title: string; speak: (t: string) => void }) {
  const s = conv.summary!;
  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-16">
      <Link href="/practice" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"><ArrowLeft className="size-4" /> Practice</Link>
      <section className="card space-y-2 p-6">
        <p className="text-sm font-medium text-primary">Conversation feedback</p>
        <h1 className="font-display text-3xl font-semibold">{title}</h1>
        <p className="text-pretty">{s.summary}</p>
        {s.encouragement && <p className="text-sm text-muted">{s.encouragement}</p>}
      </section>
      <section className="card p-6">
        <h2 className="font-semibold">Grammar corrections</h2>
        {s.corrections.length ? (
          <ul className="mt-3 divide-y divide-border">
            {s.corrections.map((c, i) => (
              <li key={i} className="space-y-0.5 py-3 first:pt-0 last:pb-0">
                <p className="text-sm text-danger line-through decoration-danger/50" lang="fr">{c.original}</p>
                <p className="font-medium text-success" lang="fr">{c.corrected}</p>
                <p className="text-sm text-muted">{c.explanation}</p>
              </li>
            ))}
          </ul>
        ) : <p className="mt-2 text-sm text-muted">No corrections needed. Excellent !</p>}
      </section>
      <section className="card p-6">
        <h2 className="flex items-center gap-2 font-semibold"><BookOpenText className="size-4 text-subtle" /> Useful vocabulary</h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {s.vocabulary.map((v) => (
            <li key={v.fr} className="flex items-center gap-2 rounded-xl bg-surface-2/60 px-3 py-2">
              <SpeakButton onSpeak={() => speak(v.fr)} className="size-7" />
              <span><span className="font-medium" lang="fr">{v.fr}</span><span className="block text-xs text-muted">{v.en}</span></span>
            </li>
          ))}
        </ul>
      </section>
      {s.reviewSkillIds.length > 0 && (
        <section className="card p-6">
          <h2 className="font-semibold">Recommended review</h2>
          <p className="text-sm text-muted">Added to your next warm-up — or practise now:</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {s.reviewSkillIds.map((id) => SKILL_BY_ID[id] && <StartLessonButton key={id} label={SKILL_BY_ID[id].title} practice={{ kind: "skill", skillId: id }} size="sm" variant="outline" showArrow={false} />)}
          </div>
        </section>
      )}
      <div className="flex justify-end gap-2">
        <Button asChild variant="outline"><Link href="/practice">Another situation</Link></Button>
        <Button asChild><Link href="/">Back to today</Link></Button>
      </div>
    </div>
  );
}
