CREATE TABLE `word_exposure` (
	`key` text PRIMARY KEY NOT NULL,
	`seen` integer DEFAULT 0 NOT NULL,
	`revealed` integer DEFAULT 0 NOT NULL,
	`streak` integer DEFAULT 0 NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL
);
