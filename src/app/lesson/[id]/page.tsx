import { cache } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getDb } from "@/lib/db";
import { toPublic } from "@/lib/content/types";
import { getLesson, getLessonExercises } from "@/lib/services/lessons";
import { getOrStartSession, type SessionSummary } from "@/lib/services/sessions";
import { getSettings } from "@/lib/services/stats";
import { withGlosses } from "@/lib/services/words";
import { lessonWords } from "@/lib/content/lexicon";
import { getSkill } from "@/lib/content/curriculum";
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
  // Words the page's own tables already teach (verb headings, French columns) aren't listed again.
  // The page always shows the topic's current material, so lessons made before an update get it too.
  const explanation = getSkill(lesson.primarySkillId).explanation;
  const explained = explanation.flatMap((s) => [...(s.table?.headers ?? []), ...(s.table?.rows.map((r) => r[0]) ?? [])]);
  const intro = { ...lesson.intro, explanation, words: lessonWords(rawExercises, db.lang, explained) };
  const eyebrow = lesson.kind === "daily"
    ? `Week ${lesson.weekNumber} · Day ${lesson.dayNumber} — ${formatDateLong(lesson.lessonDate)}`
    : lesson.kind === "review" ? "Review session" : `Practice · Week ${lesson.weekNumber}`;
  return (
    <CourseProvider lang={db.lang}>
      <LessonPlayer
        key={session.id}
        lesson={{ id: lesson.id, title: lesson.title, subtitle: lesson.subtitle, eyebrow, intro, primarySkillId: lesson.primarySkillId, kind: lesson.kind }}
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
