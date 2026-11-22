import { getDb } from "@/lib/db";
import { createLessonEnhancer } from "@/lib/ai/features";
import { getOrCreateDailyLesson } from "@/lib/services/lessons";
import { handle, ok } from "@/lib/api";

export const dynamic = "force-dynamic";

export const POST = handle(async () => {
  const db = await getDb();
  const lesson = await getOrCreateDailyLesson(db, new Date(), await createLessonEnhancer(db));
  return ok({ lessonId: lesson.id, source: lesson.source });
});
