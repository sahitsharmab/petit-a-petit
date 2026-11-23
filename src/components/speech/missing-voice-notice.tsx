"use client";
import { VolumeX, X } from "lucide-react";
import { useCourse } from "@/components/course/course-context";
import { dismissMissingVoice, useMissingVoice } from "./use-speech";

/** Explains why audio didn't play: this device has no voice for the course language. */
export function MissingVoiceNotice() {
  const missing = useMissingVoice();
  const course = useCourse();
  if (!missing) return null;
  return (
    <div role="alert" className="fixed inset-x-0 bottom-20 z-50 px-4 lg:bottom-6">
      <div className="mx-auto flex max-w-lg gap-3 rounded-2xl border border-border bg-surface p-4 text-sm shadow-lg">
        <VolumeX className="mt-0.5 size-5 shrink-0 text-warning" />
        <div className="flex-1 space-y-1.5">
          <p className="font-medium text-ink">This device has no {course.name} voice</p>
          <p className="text-muted">
            Audio stays off rather than reading {course.name} with an English voice. To add one:
          </p>
          <ul className="list-disc space-y-0.5 pl-4 text-muted">
            <li><b>Windows:</b> Settings → Time &amp; language → Speech → Add voices → {course.name}, then restart the browser.</li>
            <li><b>Android:</b> Settings → Text-to-speech → Google → install {course.name}.</li>
            <li><b>iPhone / Mac:</b> Settings → Accessibility → Spoken Content → Voices → {course.name}.</li>
            <li>Or use <b>Chrome</b> or <b>Edge</b> on a computer: they include {course.name} voices.</li>
          </ul>
        </div>
        <button type="button" onClick={dismissMissingVoice} aria-label="Dismiss"
          className="grid size-8 shrink-0 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-ink">
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
