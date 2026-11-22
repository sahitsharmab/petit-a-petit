"use client";
import * as React from "react";

import { useCourse } from "@/components/course/course-context";

/** Insert accented characters (the course's: French accents, or German umlauts and ß) at the cursor. */
export function AccentBar({ inputRef, onInsert, disabled }: {
  inputRef: React.RefObject<HTMLInputElement | HTMLTextAreaElement | null>;
  onInsert: (value: string) => void;
  disabled?: boolean;
}) {
  const course = useCourse();
  const ACCENTS = course.accents;
  const insert = (ch: string) => {
    const el = inputRef.current;
    if (!el) return;
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    const next = el.value.slice(0, start) + ch + el.value.slice(end);
    onInsert(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + ch.length, start + ch.length);
    });
  };
  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label={course.accentsLabel}>
      {ACCENTS.map((a) => (
        <button key={a} type="button" disabled={disabled} onMouseDown={(e) => e.preventDefault()} onClick={() => insert(a)}
          className="h-8 min-w-8 rounded-lg border border-border bg-surface px-2 text-sm font-medium text-ink transition-colors hover:border-primary/40 hover:bg-primary-soft disabled:opacity-40">
          {a}
        </button>
      ))}
    </div>
  );
}
