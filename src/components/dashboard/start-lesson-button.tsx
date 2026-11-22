"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { api } from "@/lib/client";
import type { PracticeRequest } from "@/lib/services/lessons";

/** Starts (or resumes) today's lesson, or creates a practice session. */
export function StartLessonButton({ label, practice, lessonId, size = "lg", variant, className, showArrow = true, loadingLabel }: {
  label: string; practice?: PracticeRequest; lessonId?: string; size?: ButtonProps["size"]; variant?: ButtonProps["variant"];
  className?: string; showArrow?: boolean; loadingLabel?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const go = async () => {
    setBusy(true);
    setError(null);
    try {
      if (lessonId) return router.push(`/lesson/${lessonId}`);
      const res = practice
        ? await api<{ lessonId: string }>("/api/lessons/practice", practice)
        : await api<{ lessonId: string }>("/api/lessons/today");
      router.push(`/lesson/${res.lessonId}`);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  };
  return (
    <div className="space-y-2">
      <Button size={size} variant={variant} onClick={go} disabled={busy} className={className}>
        {busy ? <Loader2 className="animate-spin" /> : null}
        {busy ? loadingLabel ?? "Preparing…" : label}
        {!busy && showArrow ? <ArrowRight /> : null}
      </Button>
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
    </div>
  );
}
