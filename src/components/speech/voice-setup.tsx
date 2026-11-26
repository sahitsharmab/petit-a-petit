"use client";
import type * as React from "react";
import { useCourse } from "@/components/course/course-context";

/**
 * How to install a voice for the course language, per device. Shown in Settings (always)
 * and in the notice that appears when a device has no voice at all.
 */
export function VoiceSetupSteps({ compact = false }: { compact?: boolean }) {
  const lang = useCourse().name;
  const steps: [string, React.ReactNode][] = [
    ["iPhone / iPad", <>Settings → Accessibility → Spoken Content → Voices → {lang}. Tap a voice marked <b>Enhanced</b> or <b>Premium</b> to download it (much clearer than the default). Safari and Chrome both use it.</>],
    ["Android", <>Settings → search <b>Text-to-speech</b> → Preferred engine: <b>Speech Services by Google</b> → tap the gear → Install voice data → {lang}. Then close and reopen Chrome.</>],
    ["Windows", <>Settings → Time &amp; language → Speech → Add voices → {lang}, then restart the browser. Or use <b>Edge</b>: it has natural-sounding {lang} voices built in.</>],
    ["Mac", <>System Settings → Accessibility → Spoken Content → System voice → Manage Voices → {lang}. Pick an Enhanced or Premium voice.</>],
  ];
  return (
    <ul className={compact ? "list-disc space-y-0.5 pl-4 text-muted" : "space-y-2.5 text-sm"}>
      {steps.map(([device, text]) => (
        <li key={device} className={compact ? undefined : "rounded-xl bg-surface-2/60 px-3.5 py-2.5"}>
          <b className="text-ink">{device}:</b> <span className="text-muted">{text}</span>
        </li>
      ))}
    </ul>
  );
}
