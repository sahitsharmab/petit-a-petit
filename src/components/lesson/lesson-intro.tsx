"use client";
import { useCourse } from "@/components/course/course-context";
import { motion } from "motion/react";
import { ArrowRight, Compass, Lightbulb, Sparkles, Target } from "lucide-react";
import type { LessonIntro as Intro } from "@/lib/services/lessons";
import { Button } from "@/components/ui/button";
import { spokenCell } from "@/lib/content/speak-table";
import { SpeakButton } from "../speech/speak-button";

export function LessonIntro({ intro, eyebrow, title, subtitle, count, minutes, onStart, speak }: {
  intro: Intro; eyebrow: string; title: string; subtitle: string; count: number; minutes: number; onStart: () => void; speak: (t: string) => void;
}) {
  const tl = useCourse().code;
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-2xl space-y-7 pb-36">
      <header className="space-y-3">
        <p className="text-sm font-medium text-primary">{eyebrow}</p>
        <h1 className="font-display text-[2.1rem] font-semibold leading-[1.1] text-balance sm:text-[2.6rem]">{title}</h1>
        <p className="text-muted">{subtitle} · {count} exercises · about {minutes} min</p>
      </header>

      {intro.rationale.length > 0 && (
        <section className="rounded-2xl border border-primary/20 bg-primary-soft/50 p-4 sm:p-5" aria-label="Why this lesson today">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-primary"><Compass className="size-4" /> Why today</h2>
          <ul className="mt-2 space-y-1.5 text-[0.95rem]">
            {intro.rationale.map((r, i) => <li key={i}>{r}</li>)}
          </ul>
        </section>
      )}

      {intro.aiIntro && (
        <p className="flex gap-2.5 text-[1.02rem] leading-relaxed text-pretty"><Sparkles className="mt-1 size-4 shrink-0 text-primary" /> {intro.aiIntro}</p>
      )}

      {intro.objectives.length > 0 && (
        <section>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-muted"><Target className="size-4" /> By the end you can</h2>
          <ul className="mt-2 grid gap-2 sm:grid-cols-2">
            {intro.objectives.map((o) => (
              <li key={o} className="rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm">{o}</li>
            ))}
          </ul>
        </section>
      )}

      {intro.showExplanation && intro.explanation.map((sec) => (
        <section key={sec.heading} className="card space-y-3 p-5 sm:p-6">
          <h2 className="font-display text-xl font-semibold">{sec.heading}</h2>
          {sec.body && <p className="leading-relaxed text-pretty text-ink/90">{sec.body}</p>}
          {sec.table && (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-2/70 text-muted">
                  <tr>{sec.table.headers.map((h, i) => <th key={i} scope="col" className="px-3.5 py-2 font-medium">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {sec.table.rows.map((row, r) => (
                    <tr key={r} className="border-t border-border">
                      {row.map((cell, c) => {
                        const say = spokenCell(sec.table!.headers, row, c);
                        return (
                          <td key={c} className={say ? "px-3.5 py-2 font-medium" : "px-3.5 py-2"} lang={say ? tl : undefined}>
                            <span className="inline-flex items-center gap-1">
                              {cell}
                              {say && <SpeakButton onSpeak={() => speak(say)} className="size-6 [&_svg]:size-3.5" label={`Listen: ${say}`} />}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {sec.examples && <Examples examples={sec.examples} speak={speak} />}
        </section>
      ))}

      {intro.aiExamples && intro.aiExamples.length > 0 && (
        <section className="card space-y-3 p-5 sm:p-6">
          <h2 className="flex items-center gap-2 font-display text-xl font-semibold">Fresh examples <Sparkles className="size-4 text-primary" /></h2>
          <Examples examples={intro.aiExamples} speak={speak} />
        </section>
      )}

      {intro.showExplanation && intro.tip && (
        <p className="flex gap-2.5 rounded-2xl bg-warning-soft px-4 py-3.5 text-[0.95rem]"><Lightbulb className="mt-0.5 size-4 shrink-0 text-warning" /> {intro.tip}</p>
      )}

      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-2xl justify-end px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6">
          <Button size="lg" onClick={onStart} autoFocus className="w-full sm:w-auto">Start practice <ArrowRight /></Button>
        </div>
      </div>
    </motion.div>
  );
}

function Examples({ examples, speak }: { examples: { fr: string; en: string }[]; speak: (t: string) => void }) {
  const tl = useCourse().code;
  return (
    <ul className="space-y-2">
      {examples.map((e) => (
        <li key={e.fr} className="flex items-start gap-2 rounded-xl bg-surface-2/60 px-3.5 py-2.5">
          <SpeakButton onSpeak={() => speak(e.fr)} className="-ml-1 -mt-0.5" label={`Listen: ${e.fr}`} />
          <div>
            <p className="font-medium" lang={tl}>{e.fr}</p>
            <p className="text-sm text-muted">{e.en}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
