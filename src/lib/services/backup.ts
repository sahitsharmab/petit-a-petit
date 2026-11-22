import { z } from "zod";
import type { DB } from "@/lib/db";
import { schema } from "@/lib/db";

/** User-data tables, in insert order (parents first). Curriculum seed and AI cache are excluded. */
const TABLES = {
  generatedLessons: schema.generatedLessons,
  exercises: schema.exercises,
  lessonSessions: schema.lessonSessions,
  exerciseAttempts: schema.exerciseAttempts,
  skillMastery: schema.skillMastery,
  reviewSchedule: schema.reviewSchedule,
  conversationSessions: schema.conversationSessions,
  learningSettings: schema.learningSettings,
} as const;

type TableName = keyof typeof TABLES;
const NAMES = Object.keys(TABLES) as TableName[];

export const BACKUP_VERSION = 1;

export function exportProgress(db: DB) {
  const data = Object.fromEntries(NAMES.map((n) => [n, db.select().from(TABLES[n]).all()]));
  return { app: "petit-a-petit", version: BACKUP_VERSION, exportedAt: new Date().toISOString(), data };
}

const Row = z.record(z.string(), z.unknown());
export const BackupSchema = z.object({
  app: z.literal("petit-a-petit"),
  version: z.number().int().min(1).max(BACKUP_VERSION),
  exportedAt: z.string(),
  data: z.object(Object.fromEntries(NAMES.map((n) => [n, z.array(Row).default([])])) as Record<TableName, z.ZodDefault<z.ZodArray<typeof Row>>>),
});

function clear(db: DB) {
  for (const n of [...NAMES].reverse()) db.delete(TABLES[n]).run();
}

/** Replace all progress with a backup. Runs in one transaction: any invalid row aborts the import. */
export function importProgress(db: DB, raw: unknown) {
  const backup = BackupSchema.parse(raw);
  const counts: Record<string, number> = {};
  db.transaction((tx) => {
    const t = tx as unknown as DB;
    clear(t);
    for (const n of NAMES) {
      const rows = backup.data[n];
      for (const row of rows) t.insert(TABLES[n]).values(row as never).run();
      counts[n] = rows.length;
    }
    t.insert(schema.learningSettings).values({ id: 1 }).onConflictDoNothing().run();
  });
  return counts;
}

export function resetProgress(db: DB) {
  db.transaction((tx) => {
    const t = tx as unknown as DB;
    clear(t);
    t.insert(schema.learningSettings).values({ id: 1 }).run();
  });
}
