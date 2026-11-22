import { z } from "zod";
import { getDb } from "@/lib/db";
import { SKILL_BY_ID } from "@/lib/content/curriculum";
import { createPracticeLesson } from "@/lib/services/lessons";
import { handle, ok, parseBody } from "@/lib/api";

const Body = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("skill"), skillId: z.string().refine((id) => !!SKILL_BY_ID[id], "Unknown skill") }),
  z.object({ kind: z.literal("week"), week: z.number().int().min(1).max(12) }),
  z.object({ kind: z.literal("review") }),
]);

export const POST = handle(async (req: Request) => {
  const body = await parseBody(req, Body);
  const lesson = createPracticeLesson(getDb(), body);
  return ok({ lessonId: lesson.id });
});
