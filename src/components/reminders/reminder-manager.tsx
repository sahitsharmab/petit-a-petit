"use client";
import * as React from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { BellRing, X } from "lucide-react";
import { nextParisTime } from "@/lib/learning/dates";
import { useCourse } from "@/components/course/course-context";

/**
 * In-tab reminder. While any page of the app is open, it waits until the
 * chosen Europe/Paris time, then shows an in-app banner and — if permission
 * was granted — a browser notification. It cannot fire when the browser or
 * computer is closed; that's stated clearly in Settings.
 */
export function ReminderManager({ enabled, time, lessonDone }: { enabled: boolean; time: string; lessonDone: boolean }) {
  const course = useCourse();
  const [show, setShow] = React.useState(false);

  React.useEffect(() => {
    if (!enabled || lessonDone) return;
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      const at = nextParisTime(time);
      // Re-check at most every 6h so sleep/wake and DST don't drift.
      const delay = Math.min(at.getTime() - Date.now(), 6 * 3600_000);
      timer = setTimeout(() => {
        if (Date.now() >= at.getTime() - 1000) fire();
        schedule();
      }, Math.max(1000, delay));
    };
    const fire = () => {
      setShow(true);
      try {
        if ("Notification" in window && Notification.permission === "granted") {
          const n = new Notification(course.reminder, {
            body: "Your lesson for today is ready — about 15 minutes.",
            tag: "daily-lesson",
          });
          n.onclick = () => { window.focus(); window.location.href = "/"; };
        }
      } catch { /* notifications unsupported */ }
    };
    schedule();
    return () => clearTimeout(timer);
  }, [enabled, time, lessonDone, course.reminder]);

  return (
    <AnimatePresence>
      {show && !lessonDone && (
        <motion.div role="status" initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
          className="card fixed left-1/2 top-4 z-50 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-center gap-3 p-3 pl-4 shadow-lift">
          <BellRing className="size-5 shrink-0 text-primary" />
          <p className="flex-1 text-sm"><span className="font-medium">{course.reminder}</span> Your daily lesson is waiting.</p>
          <Link href="/" onClick={() => setShow(false)} className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-ink">Open</Link>
          <button onClick={() => setShow(false)} aria-label="Dismiss reminder" className="rounded-lg p-1.5 text-muted hover:bg-surface-2"><X className="size-4" /></button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
