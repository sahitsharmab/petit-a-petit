import { z } from "zod";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { getSettings } from "@/lib/services/stats";
import { handle, ok, parseBody } from "@/lib/api";

const Patch = z.object({
  displayName: z.string().trim().max(40).optional(),
  dailyGoalMinutes: z.number().int().min(5).max(120).optional(),
  reminderEnabled: z.boolean().optional(),
  reminderTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
  aiEnabled: z.boolean().optional(),
  showTranslations: z.boolean().optional(),
  speechRate: z.number().min(0.5).max(1.3).optional(),
  autoPlayAudio: z.boolean().optional(),
}).strict();

export const dynamic = "force-dynamic";
export const GET = handle(async () => ok(await getSettings(await getDb())));
export const PUT = handle(async (req: Request) => {
  const patch = await parseBody(req, Patch);
  const db = await getDb();
  await db.update(schema.learningSettings).set({ ...patch, updatedAt: new Date().toISOString() }).where(eq(schema.learningSettings.id, 1)).run();
  return ok(await getSettings(db));
});
