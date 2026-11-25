import { sql } from "drizzle-orm";
import { index, integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

const now = sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`;

export const curriculumWeeks = sqliteTable("curriculum_weeks", {
  number: integer("number").primaryKey(),
  title: text("title").notNull(),
  focus: text("focus").notNull(),
  cefr: text("cefr").notNull(),
  description: text("description").notNull(),
});

export const learningSkills = sqliteTable("learning_skills", {
  id: text("id").primaryKey(),
  weekNumber: integer("week_number").notNull().references(() => curriculumWeeks.number),
  position: integer("position").notNull(),
  title: text("title").notNull(),
  short: text("short").notNull(),
  cefr: text("cefr").notNull(),
  category: text("category").notNull(),
  summary: text("summary").notNull(),
  /** JSON: objectives, explanation sections, tip, practice spec. */
  content: text("content", { mode: "json" }).notNull(),
});

/** Lesson blueprints: the ordered section mix a lesson is assembled from. */
export const lessonTemplates = sqliteTable("lesson_templates", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  blocks: text("blocks", { mode: "json" }).notNull(),
});

export const generatedLessons = sqliteTable(
  "generated_lessons",
  {
    id: text("id").primaryKey(),
    kind: text("kind").notNull(), // daily | practice | review
    /** Europe/Paris calendar date (YYYY-MM-DD) the lesson belongs to. */
    lessonDate: text("lesson_date").notNull(),
    /** Unique per day for daily lessons; null for ad-hoc practice. */
    dailyKey: text("daily_key"),
    primarySkillId: text("primary_skill_id").notNull(),
    reviewSkillIds: text("review_skill_ids", { mode: "json" }).$type<string[]>().notNull(),
    templateId: text("template_id").notNull(),
    weekNumber: integer("week_number").notNull(),
    dayNumber: integer("day_number").notNull(),
    title: text("title").notNull(),
    subtitle: text("subtitle").notNull(),
    /** "new" | "continue" | "consolidate" | "welcome-back" | "review" */
    mode: text("mode").notNull(),
    source: text("source").notNull(), // local | ai | mixed
    /** JSON: intro/explanation shown before exercises, plan rationale. */
    intro: text("intro", { mode: "json" }).notNull(),
    seed: integer("seed").notNull(),
    createdAt: text("created_at").notNull().default(now),
  },
  (t) => [uniqueIndex("generated_lessons_daily_key").on(t.dailyKey), index("generated_lessons_date").on(t.lessonDate)],
);

export const exercises = sqliteTable(
  "exercises",
  {
    id: text("id").primaryKey(),
    lessonId: text("lesson_id").notNull().references(() => generatedLessons.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    type: text("type").notNull(),
    skillId: text("skill_id").notNull(),
    section: text("section").notNull(),
    itemKey: text("item_key").notNull(),
    /** Full exercise JSON including accepted answers. */
    payload: text("payload", { mode: "json" }).notNull(),
  },
  (t) => [index("exercises_lesson").on(t.lessonId)],
);

export const lessonSessions = sqliteTable(
  "lesson_sessions",
  {
    id: text("id").primaryKey(),
    lessonId: text("lesson_id").notNull().references(() => generatedLessons.id, { onDelete: "cascade" }),
    status: text("status").notNull(), // in_progress | completed
    /** JSON player state: phase, queue, index, per-exercise results. */
    state: text("state", { mode: "json" }).notNull(),
    studyDate: text("study_date").notNull(),
    activeSeconds: integer("active_seconds").notNull().default(0),
    score: real("score"),
    summary: text("summary", { mode: "json" }),
    startedAt: text("started_at").notNull().default(now),
    updatedAt: text("updated_at").notNull().default(now),
    completedAt: text("completed_at"),
  },
  (t) => [index("lesson_sessions_lesson").on(t.lessonId), index("lesson_sessions_date").on(t.studyDate)],
);

export const exerciseAttempts = sqliteTable(
  "exercise_attempts",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    sessionId: text("session_id").notNull().references(() => lessonSessions.id, { onDelete: "cascade" }),
    exerciseId: text("exercise_id").notNull(),
    skillId: text("skill_id").notNull(),
    itemKey: text("item_key").notNull(),
    exerciseType: text("exercise_type").notNull(),
    answer: text("answer").notNull(),
    expected: text("expected").notNull(),
    verdict: text("verdict").notNull(), // correct | almost | incorrect
    isCorrect: integer("is_correct", { mode: "boolean" }).notNull(),
    /** First attempt of this exercise in the session (counts for mastery). */
    isFirst: integer("is_first", { mode: "boolean" }).notNull(),
    mistakeTag: text("mistake_tag"),
    note: text("note"),
    hintsUsed: integer("hints_used").notNull().default(0),
    judgedBy: text("judged_by").notNull().default("local"),
    studyDate: text("study_date").notNull(),
    createdAt: text("created_at").notNull().default(now),
  },
  (t) => [index("attempts_skill").on(t.skillId), index("attempts_date").on(t.studyDate), index("attempts_session").on(t.sessionId)],
);

export const skillMastery = sqliteTable("skill_mastery", {
  skillId: text("skill_id").primaryKey(),
  attempts: integer("attempts").notNull().default(0),
  correct: integer("correct").notNull().default(0),
  incorrect: integer("incorrect").notNull().default(0),
  mastery: real("mastery").notNull().default(0),
  consecutiveCorrect: integer("consecutive_correct").notNull().default(0),
  lessonsAsPrimary: integer("lessons_as_primary").notNull().default(0),
  /** Set once the skill first meets the pass criteria; the curriculum frontier never moves back. */
  passedAt: text("passed_at"),
  status: text("status").notNull().default("new"), // new | learning | reviewing | mastered
  firstPracticedAt: text("first_practiced_at"),
  lastPracticedAt: text("last_practiced_at"),
});

/** Spaced-repetition schedule for skills and individual items. */
export const reviewSchedule = sqliteTable(
  "review_schedule",
  {
    itemKey: text("item_key").primaryKey(),
    itemType: text("item_type").notNull(), // skill | conj | mcq | sent | tr | dlg | gtr | vocab
    skillId: text("skill_id").notNull(),
    label: text("label").notNull(),
    ease: real("ease").notNull().default(2.5),
    intervalDays: real("interval_days").notNull().default(0),
    reps: integer("reps").notNull().default(0),
    lapses: integer("lapses").notNull().default(0),
    attempts: integer("attempts").notNull().default(0),
    correct: integer("correct").notNull().default(0),
    dueDate: text("due_date").notNull(),
    lastReviewedDate: text("last_reviewed_date"),
  },
  (t) => [index("review_due").on(t.dueDate), index("review_skill").on(t.skillId)],
);

export const conversationSessions = sqliteTable("conversation_sessions", {
  id: text("id").primaryKey(),
  scenarioId: text("scenario_id").notNull(),
  mode: text("mode").notNull(), // ai | scripted
  status: text("status").notNull(), // active | completed
  level: text("level").notNull(),
  messages: text("messages", { mode: "json" }).notNull(),
  /** Scripted mode: current node id. */
  nodeId: text("node_id"),
  summary: text("summary", { mode: "json" }),
  studyDate: text("study_date").notNull(),
  activeSeconds: integer("active_seconds").notNull().default(0),
  createdAt: text("created_at").notNull().default(now),
  updatedAt: text("updated_at").notNull().default(now),
});

export const learningSettings = sqliteTable("learning_settings", {
  id: integer("id").primaryKey(),
  displayName: text("display_name").notNull().default(""),
  dailyGoalMinutes: integer("daily_goal_minutes").notNull().default(15),
  reminderEnabled: integer("reminder_enabled", { mode: "boolean" }).notNull().default(false),
  reminderTime: text("reminder_time").notNull().default("20:30"),
  aiEnabled: integer("ai_enabled", { mode: "boolean" }).notNull().default(true),
  showTranslations: integer("show_translations", { mode: "boolean" }).notNull().default(true),
  speechRate: real("speech_rate").notNull().default(0.9),
  autoPlayAudio: integer("auto_play_audio", { mode: "boolean" }).notNull().default(true),
  updatedAt: text("updated_at").notNull().default(now),
});

/**
 * The settings row a new (or reset) learner starts with. Audio is off until the learner
 * switches it on. (The column default stays true so existing databases need no migration.)
 */
export const NEW_LEARNER_SETTINGS = { id: 1, autoPlayAudio: false };

/**
 * The learner's own AI provider key (one row). The key is encrypted (AES-256-GCM) with a
 * server-side secret; only the last characters are kept in clear for display.
 * Never exported, never sent to the browser, and kept when progress is reset.
 */
export const aiCredentials = sqliteTable("ai_credentials", {
  id: integer("id").primaryKey(),
  provider: text("provider").notNull(),
  model: text("model").notNull(),
  keyEncrypted: text("key_encrypted").notNull(),
  keyHint: text("key_hint").notNull(),
  updatedAt: text("updated_at").notNull().default(now),
});

/**
 * How often the learner has met each hinted word (see lib/content/lexicon.ts). `streak` counts
 * sightings in a row without opening the hint; at 3 the word counts as known and its hint stops
 * appearing. Opening the hint resets it. Cleared with progress; not part of backups.
 */
export const wordExposure = sqliteTable("word_exposure", {
  key: text("key").primaryKey(),
  seen: integer("seen").notNull().default(0),
  revealed: integer("revealed").notNull().default(0),
  streak: integer("streak").notNull().default(0),
  updatedAt: text("updated_at").notNull().default(now),
});

/** Cache of validated AI outputs keyed by request hash. */
export const aiCache = sqliteTable("ai_cache", {
  key: text("key").primaryKey(),
  kind: text("kind").notNull(),
  provider: text("provider").notNull(),
  payload: text("payload", { mode: "json" }).notNull(),
  createdAt: text("created_at").notNull().default(now),
});
