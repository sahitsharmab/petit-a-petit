CREATE TABLE `ai_cache` (
	`key` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`provider` text NOT NULL,
	`payload` text NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `conversation_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`scenario_id` text NOT NULL,
	`mode` text NOT NULL,
	`status` text NOT NULL,
	`level` text NOT NULL,
	`messages` text NOT NULL,
	`node_id` text,
	`summary` text,
	`study_date` text NOT NULL,
	`active_seconds` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `curriculum_weeks` (
	`number` integer PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`focus` text NOT NULL,
	`cefr` text NOT NULL,
	`description` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `exercise_attempts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`session_id` text NOT NULL,
	`exercise_id` text NOT NULL,
	`skill_id` text NOT NULL,
	`item_key` text NOT NULL,
	`exercise_type` text NOT NULL,
	`answer` text NOT NULL,
	`expected` text NOT NULL,
	`verdict` text NOT NULL,
	`is_correct` integer NOT NULL,
	`is_first` integer NOT NULL,
	`mistake_tag` text,
	`note` text,
	`hints_used` integer DEFAULT 0 NOT NULL,
	`judged_by` text DEFAULT 'local' NOT NULL,
	`study_date` text NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `lesson_sessions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `attempts_skill` ON `exercise_attempts` (`skill_id`);--> statement-breakpoint
CREATE INDEX `attempts_date` ON `exercise_attempts` (`study_date`);--> statement-breakpoint
CREATE INDEX `attempts_session` ON `exercise_attempts` (`session_id`);--> statement-breakpoint
CREATE TABLE `exercises` (
	`id` text PRIMARY KEY NOT NULL,
	`lesson_id` text NOT NULL,
	`position` integer NOT NULL,
	`type` text NOT NULL,
	`skill_id` text NOT NULL,
	`section` text NOT NULL,
	`item_key` text NOT NULL,
	`payload` text NOT NULL,
	FOREIGN KEY (`lesson_id`) REFERENCES `generated_lessons`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `exercises_lesson` ON `exercises` (`lesson_id`);--> statement-breakpoint
CREATE TABLE `generated_lessons` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`lesson_date` text NOT NULL,
	`daily_key` text,
	`primary_skill_id` text NOT NULL,
	`review_skill_ids` text NOT NULL,
	`template_id` text NOT NULL,
	`week_number` integer NOT NULL,
	`day_number` integer NOT NULL,
	`title` text NOT NULL,
	`subtitle` text NOT NULL,
	`mode` text NOT NULL,
	`source` text NOT NULL,
	`intro` text NOT NULL,
	`seed` integer NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `generated_lessons_daily_key` ON `generated_lessons` (`daily_key`);--> statement-breakpoint
CREATE INDEX `generated_lessons_date` ON `generated_lessons` (`lesson_date`);--> statement-breakpoint
CREATE TABLE `learning_settings` (
	`id` integer PRIMARY KEY NOT NULL,
	`display_name` text DEFAULT '' NOT NULL,
	`daily_goal_minutes` integer DEFAULT 15 NOT NULL,
	`reminder_enabled` integer DEFAULT false NOT NULL,
	`reminder_time` text DEFAULT '20:30' NOT NULL,
	`ai_enabled` integer DEFAULT true NOT NULL,
	`show_translations` integer DEFAULT true NOT NULL,
	`speech_rate` real DEFAULT 0.9 NOT NULL,
	`auto_play_audio` integer DEFAULT true NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `learning_skills` (
	`id` text PRIMARY KEY NOT NULL,
	`week_number` integer NOT NULL,
	`position` integer NOT NULL,
	`title` text NOT NULL,
	`short` text NOT NULL,
	`cefr` text NOT NULL,
	`category` text NOT NULL,
	`summary` text NOT NULL,
	`content` text NOT NULL,
	FOREIGN KEY (`week_number`) REFERENCES `curriculum_weeks`(`number`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `lesson_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`lesson_id` text NOT NULL,
	`status` text NOT NULL,
	`state` text NOT NULL,
	`study_date` text NOT NULL,
	`active_seconds` integer DEFAULT 0 NOT NULL,
	`score` real,
	`summary` text,
	`started_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`completed_at` text,
	FOREIGN KEY (`lesson_id`) REFERENCES `generated_lessons`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `lesson_sessions_lesson` ON `lesson_sessions` (`lesson_id`);--> statement-breakpoint
CREATE INDEX `lesson_sessions_date` ON `lesson_sessions` (`study_date`);--> statement-breakpoint
CREATE TABLE `lesson_templates` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`blocks` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `review_schedule` (
	`item_key` text PRIMARY KEY NOT NULL,
	`item_type` text NOT NULL,
	`skill_id` text NOT NULL,
	`label` text NOT NULL,
	`ease` real DEFAULT 2.5 NOT NULL,
	`interval_days` real DEFAULT 0 NOT NULL,
	`reps` integer DEFAULT 0 NOT NULL,
	`lapses` integer DEFAULT 0 NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`correct` integer DEFAULT 0 NOT NULL,
	`due_date` text NOT NULL,
	`last_reviewed_date` text
);
--> statement-breakpoint
CREATE INDEX `review_due` ON `review_schedule` (`due_date`);--> statement-breakpoint
CREATE INDEX `review_skill` ON `review_schedule` (`skill_id`);--> statement-breakpoint
CREATE TABLE `skill_mastery` (
	`skill_id` text PRIMARY KEY NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`correct` integer DEFAULT 0 NOT NULL,
	`incorrect` integer DEFAULT 0 NOT NULL,
	`mastery` real DEFAULT 0 NOT NULL,
	`consecutive_correct` integer DEFAULT 0 NOT NULL,
	`lessons_as_primary` integer DEFAULT 0 NOT NULL,
	`passed_at` text,
	`status` text DEFAULT 'new' NOT NULL,
	`first_practiced_at` text,
	`last_practiced_at` text
);
