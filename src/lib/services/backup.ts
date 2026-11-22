import fs from "node:fs";
import path from "node:path";
import { getTableColumns } from "drizzle-orm";
import type { SQLiteColumn, SQLiteTable } from "drizzle-orm/sqlite-core";
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
/** Every table must be present: a missing section is an incomplete file, not an empty table. */
export const BackupSchema = z.object({
  app: z.literal("petit-a-petit"),
  version: z.number().int().min(1).max(BACKUP_VERSION),
  exportedAt: z.string(),
  data: z.object(Object.fromEntries(NAMES.map((n) => [n, z.array(Row)])) as Record<TableName, z.ZodArray<typeof Row>>),
});

// ───────────────────────── validation ─────────────────────────

export class BackupError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BackupError";
  }
}

/** Check one row against the table's columns: no unknown keys, required values present, primitive types right. */
function checkRow(table: SQLiteTable, name: string, row: Record<string, unknown>, i: number) {
  const columns = getTableColumns(table) as Record<string, SQLiteColumn>;
  const where = `${name}[${i}]`;
  for (const key of Object.keys(row)) if (!(key in columns)) throw new BackupError(`${where} has an unknown field "${key}".`);
  for (const [key, col] of Object.entries(columns)) {
    const v = row[key];
    if (v === undefined || v === null) {
      if (col.notNull && !col.hasDefault) throw new BackupError(`${where} is missing "${key}".`);
      if (v === null && col.notNull) throw new BackupError(`${where} has an empty "${key}".`);
      continue;
    }
    const ok = col.dataType === "string" ? typeof v === "string"
      : col.dataType === "number" ? typeof v === "number" && Number.isFinite(v)
        : col.dataType === "boolean" ? typeof v === "boolean"
          : true; // json columns are checked structurally below
    if (!ok) throw new BackupError(`${where}.${key} should be a ${col.dataType}.`);
  }
}

const ResultSchema = z.object({
  attempts: z.number().int().min(0),
  hintsUsed: z.number().int().min(0),
  firstVerdict: z.enum(["correct", "almost", "incorrect"]).nullable(),
  verdict: z.enum(["correct", "almost", "incorrect"]).nullable(),
  done: z.boolean(),
}).loose();
const PlayerStateSchema = z.object({
  phase: z.enum(["intro", "exercise", "summary"]),
  queue: z.array(z.string()),
  index: z.number().int().min(0),
  results: z.record(z.string(), ResultSchema),
  retryFrom: z.number().int().min(0).nullable(),
  masteryBefore: z.number(),
});
const ExercisePayloadSchema = z.object({
  id: z.string(), type: z.string(), skillId: z.string(), itemKey: z.string(), prompt: z.string(), accepted: z.array(z.string()),
}).loose();

/** Structural and cross-row checks; throws BackupError with a learner-readable reason. */
export function validateBackup(raw: unknown) {
  const parsed = BackupSchema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const where = issue.path.join(".") || "file";
    if (issue.path[0] === "data" && issue.path.length === 2 && issue.code === "invalid_type") {
      throw new BackupError(`This backup is incomplete: the "${String(issue.path[1])}" section is missing.`);
    }
    throw new BackupError(`This isn't a valid Petit à Petit backup (${where}: ${issue.message}).`);
  }
  const backup = parsed.data;
  const d = backup.data;
  for (const n of NAMES) d[n].forEach((row, i) => checkRow(TABLES[n] as SQLiteTable, n, row, i));

  const lessonIds = new Set(d.generatedLessons.map((r) => r.id as string));
  const exercisesByLesson = new Map<string, Set<string>>();
  d.exercises.forEach((r, i) => {
    if (!lessonIds.has(r.lessonId as string)) throw new BackupError(`exercises[${i}] belongs to a lesson that isn't in the backup.`);
    const p = ExercisePayloadSchema.safeParse(r.payload);
    if (!p.success || p.data.id !== r.id) throw new BackupError(`exercises[${i}] has a damaged exercise definition.`);
    (exercisesByLesson.get(r.lessonId as string) ?? exercisesByLesson.set(r.lessonId as string, new Set()).get(r.lessonId as string)!).add(r.id as string);
  });

  const attemptsBySession = new Map<string, number>();
  for (const a of d.exerciseAttempts) attemptsBySession.set(a.sessionId as string, (attemptsBySession.get(a.sessionId as string) ?? 0) + 1);

  const sessionIds = new Set<string>();
  d.lessonSessions.forEach((r, i) => {
    sessionIds.add(r.id as string);
    if (!lessonIds.has(r.lessonId as string)) throw new BackupError(`lessonSessions[${i}] belongs to a lesson that isn't in the backup.`);
    const st = PlayerStateSchema.safeParse(r.state);
    if (!st.success) throw new BackupError(`lessonSessions[${i}] has a damaged lesson state.`);
    const known = exercisesByLesson.get(r.lessonId as string) ?? new Set<string>();
    if (st.data.queue.some((id) => !known.has(id))) throw new BackupError(`lessonSessions[${i}] refers to exercises that aren't in the backup.`);
    if (st.data.index > st.data.queue.length) throw new BackupError(`lessonSessions[${i}] has an impossible position.`);
    if (r.status === "completed" && (r.summary === null || r.summary === undefined)) throw new BackupError(`lessonSessions[${i}] is completed but has no summary.`);
    // The answer history must be there for every answer the session state records.
    const answered = Object.values(st.data.results).reduce((sum, x) => sum + x.attempts, 0);
    const rows = attemptsBySession.get(r.id as string) ?? 0;
    if (rows < answered) {
      throw new BackupError(`This backup is incomplete: a lesson records ${answered} answer${answered === 1 ? "" : "s"} but only ${rows} ${rows === 1 ? "is" : "are"} in the file.`);
    }
  });
  d.exerciseAttempts.forEach((a, i) => {
    if (!sessionIds.has(a.sessionId as string)) throw new BackupError(`exerciseAttempts[${i}] belongs to a lesson session that isn't in the backup.`);
  });
  if (d.learningSettings.length > 1) throw new BackupError("This backup has more than one settings record.");
  return backup;
}

// ───────────────────────── import / reset ─────────────────────────

function clear(db: DB) {
  for (const n of [...NAMES].reverse()) db.delete(TABLES[n]).run();
}

function countRows(data: Record<TableName, unknown[]>): Record<TableName, number> {
  return Object.fromEntries(NAMES.map((n) => [n, data[n].length])) as Record<TableName, number>;
}

/** Validate a backup and report what it contains, without changing anything. */
export function previewImport(raw: unknown) {
  return countRows(validateBackup(raw).data);
}

/** Save the current progress as a JSON file before it is replaced. Keeps the 10 most recent. */
export function writeSafetyCopy(db: DB, dir: string, now: Date = new Date()): string {
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `pre-import-${now.toISOString().replace(/[:.]/g, "-")}.json`);
  fs.writeFileSync(file, JSON.stringify(exportProgress(db), null, 2));
  const old = fs.readdirSync(dir).filter((f) => /^pre-import-.*\.json$/.test(f)).sort().reverse().slice(10);
  for (const f of old) fs.rmSync(path.join(dir, f), { force: true });
  return file;
}

/**
 * Replace all progress with a backup. The file is fully validated first, and the replacement
 * runs in one transaction, so an invalid file or row leaves the current progress untouched.
 * Pass `safetyCopyDir` to save the current progress to a file before replacing it.
 */
export function importProgress(db: DB, raw: unknown, opts: { safetyCopyDir?: string } = {}) {
  const backup = validateBackup(raw);
  const safetyCopy = opts.safetyCopyDir ? writeSafetyCopy(db, opts.safetyCopyDir) : undefined;
  db.transaction((tx) => {
    const t = tx as unknown as DB;
    clear(t);
    for (const n of NAMES) for (const row of backup.data[n]) t.insert(TABLES[n]).values(row as never).run();
    t.insert(schema.learningSettings).values({ id: 1 }).onConflictDoNothing().run();
  });
  return Object.assign(countRows(backup.data), safetyCopy ? { safetyCopy } : {}) as Record<TableName, number> & { safetyCopy?: string };
}

export function resetProgress(db: DB) {
  db.transaction((tx) => {
    const t = tx as unknown as DB;
    clear(t);
    t.insert(schema.learningSettings).values({ id: 1 }).run();
  });
}
