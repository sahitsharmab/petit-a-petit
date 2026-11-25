"use client";
import * as React from "react";
import type { Gloss } from "@/lib/content/types";
import { cn } from "@/lib/utils";

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Text with tap-to-reveal word hints: each gloss's span gets a dotted underline; tapping it
 * (or Enter on it) shows the word in a small bubble.
 * `renderPlain` renders the text between hints (e.g. to draw "___" gaps).
 */
export function GlossedText({ text, glosses, revealed, onReveal, renderPlain = (s) => s, lang }: {
  text: string;
  glosses?: Gloss[];
  revealed: string[];
  onReveal: (key: string) => void;
  renderPlain?: (s: string) => React.ReactNode;
  lang?: string;
}) {
  const parts = React.useMemo(() => {
    const out: ({ plain: string } | { gloss: Gloss; text: string })[] = [];
    if (!glosses?.length) return [{ plain: text }];
    const spans = glosses
      .map((g) => {
        const m = new RegExp(`(?<![\\p{L}\\d])${esc(g.span)}(?![\\p{L}\\d])`, "iu").exec(text);
        return m ? { g, start: m.index, end: m.index + m[0].length } : null;
      })
      .filter((x): x is { g: Gloss; start: number; end: number } => !!x)
      .sort((a, b) => a.start - b.start);
    let pos = 0;
    for (const s of spans) {
      if (s.start < pos) continue;
      if (s.start > pos) out.push({ plain: text.slice(pos, s.start) });
      out.push({ gloss: s.g, text: text.slice(s.start, s.end) });
      pos = s.end;
    }
    if (pos < text.length) out.push({ plain: text.slice(pos) });
    return out;
  }, [text, glosses]);

  return (
    <>
      {parts.map((p, i) => "plain" in p
        ? <React.Fragment key={i}>{renderPlain(p.plain)}</React.Fragment>
        : <GlossWord key={i} gloss={p.gloss} text={p.text} open={revealed.includes(p.gloss.key)} onReveal={onReveal} lang={lang} />)}
    </>
  );
}

function GlossWord({ gloss, text, open, onReveal, lang }: { gloss: Gloss; text: string; open: boolean; onReveal: (key: string) => void; lang?: string }) {
  // Tap to open (counted as using the hint), tap again to close.
  const [show, setShow] = React.useState(open);
  return (
    <span className="relative inline-block">
      <button type="button" lang={lang}
        onClick={() => { if (!show) onReveal(gloss.key); setShow(!show); }}
        onKeyDown={(e) => { if (e.key === "Escape") setShow(false); }}
        aria-label={`${text}: show the word`} aria-expanded={show}
        className={cn("cursor-help rounded-sm underline decoration-dotted decoration-2 underline-offset-[6px] transition-colors",
          show ? "decoration-primary text-primary" : "decoration-primary/50 hover:decoration-primary")}>
        {text}
      </button>
      {show && (
        <span role="tooltip"
          className="absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-ink px-2.5 py-1.5 text-center font-sans text-sm font-medium leading-tight text-background shadow-lg">
          {gloss.meaning}
          {gloss.note && <span className="block text-xs font-normal opacity-75">{gloss.note}</span>}
        </span>
      )}
    </span>
  );
}
