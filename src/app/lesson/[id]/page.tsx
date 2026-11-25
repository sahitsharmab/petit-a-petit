import { cache } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getDb } from "@/lib/db";
import { toPublic } from "@/lib/content/types";
import { getLesson, getLessonExercises } from "@/lib/services/lessons";
import { getOrStartSession, type SessionSummary } from "@/lib/services/sessions";
import { getSettings } from "@/lib/services/stats";
import { withGlosses } from "@/lib/services/words";
import { formatDateLong } from "@/lib/learning/dates";
import { LessonPlayer } from "@/components/lesson/lesson-player";
import { CourseProvider } from "@/components/course/course-context";
import { MissingVoiceNotice } from "@/components/speech/missing-voice-notice";

export const dynamic = "force-dynamic";

/** One lookup per request, shared by the page title and the page. */
const lessonFor = cache(async (id: string) => getLesson(await getDb(), id));

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const lesson = await lessonFor(id);
  return { title: lesson?.title ?? "Lesson" };
}

export default async function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await getDb();
  const lesson = await lessonFor(id);
  if (!lesson) notFound();
  const [rawExercises, session, settings] = await Promise.all([getLessonExercises(db, id), getOrStartSession(db, id), getSettings(db)]);
  const exercises = (await withGlosses(db, rawExercises)).map(toPublic);
  const eyebrow = lesson.kind === "daily"
    ? `Week ${lesson.weekNumber} · Day ${lesson.dayNumber} — ${formatDateLong(lesson.lessonDate)}`
    : lesson.kind === "review" ? "Review session" : `Practice · Week ${lesson.weekNumber}`;
  return (
    <CourseProvider lang={db.lang}>
      <LessonPlayer
        key={session.id}
        lesson={{ id: lesson.id, title: lesson.title, subtitle: lesson.subtitle, eyebrow, intro: lesson.intro, primarySkillId: lesson.primarySkillId, kind: lesson.kind }}
        exercises={exercises}
        sessionId={session.id}
        initialState={session.state}
        initialSummary={session.status === "completed" ? (session.summary as SessionSummary) : null}
        settings={{ speechRate: settings.speechRate, autoPlayAudio: settings.autoPlayAudio, showTranslations: settings.showTranslations }}
      />
      <MissingVoiceNotice />
    </CourseProvider>
  );
}
