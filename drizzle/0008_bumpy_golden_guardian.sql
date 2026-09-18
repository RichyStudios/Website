PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_posts` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`title` text NOT NULL,
	`summary` text NOT NULL,
	`body` text NOT NULL,
	`image` text NOT NULL,
	`date` text NOT NULL,
	`end_date` text DEFAULT '' NOT NULL,
	`location` text DEFAULT '' NOT NULL,
	`author` text DEFAULT 'Signova Technology' NOT NULL,
	`published_at` integer DEFAULT 0 NOT NULL,
	`capacity` integer DEFAULT 0 NOT NULL,
	`contact_email` text DEFAULT '' NOT NULL,
	`registration_url` text DEFAULT '' NOT NULL,
	`accessibility` text DEFAULT '' NOT NULL,
	`featured` integer DEFAULT 0 NOT NULL,
	`published` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_posts`("id", "kind", "title", "summary", "body", "image", "date", "end_date", "location", "author", "published_at", "capacity", "contact_email", "registration_url", "accessibility", "featured", "published") SELECT "id", "kind", "title", "summary", "body", "image", "date", "end_date", "location", "author", "published_at", "capacity", "contact_email", "registration_url", "accessibility", "featured", "published" FROM `posts`;--> statement-breakpoint
DROP TABLE `posts`;--> statement-breakpoint
ALTER TABLE `__new_posts` RENAME TO `posts`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `idx_posts_kind_published` ON `posts` (`kind`,`published`);
--> statement-breakpoint
UPDATE `posts` SET `author` = 'Signova Technology' WHERE `author` = 'Noble & New';
