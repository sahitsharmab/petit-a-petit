"use client";
import { VolumeX, X } from "lucide-react";
import { useCourse } from "@/components/course/course-context";
import { dismissMissingVoice, useMissingVoice } from "./use-speech";
import { VoiceSetupSteps } from "./voice-setup";

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
          <VoiceSetupSteps compact />
          <p className="text-muted">These steps are also in Settings → Audio &amp; display.</p>
        </div>
        <button type="button" onClick={dismissMissingVoice} aria-label="Dismiss"
          className="grid size-8 shrink-0 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-ink">
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
