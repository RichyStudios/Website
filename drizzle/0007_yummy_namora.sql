ALTER TABLE `posts` ADD `end_date` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `posts` ADD `author` text DEFAULT 'Noble & New' NOT NULL;--> statement-breakpoint
ALTER TABLE `posts` ADD `published_at` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `posts` ADD `capacity` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `posts` ADD `contact_email` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `posts` ADD `registration_url` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `posts` ADD `accessibility` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `posts` ADD `featured` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
UPDATE `posts` SET `published_at` = unixepoch() * 1000 WHERE `published_at` = 0;--> statement-breakpoint
PRAGMA optimize;
