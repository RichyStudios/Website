CREATE TABLE `games` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`category` text NOT NULL,
	`thumbnail` text NOT NULL,
	`html` text NOT NULL,
	`css` text NOT NULL,
	`javascript` text NOT NULL,
	`python` text DEFAULT '' NOT NULL,
	`published` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_games_published_updated` ON `games` (`published`,`updated_at`);--> statement-breakpoint
ALTER TABLE `support_requests` ADD `first_name` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `support_requests` ADD `last_name` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `support_requests` ADD `phone` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `support_requests` ADD `notification_status` text DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE `support_requests` ADD `notification_error` text DEFAULT '' NOT NULL;--> statement-breakpoint
INSERT INTO `settings` (`key`,`value`) VALUES ('support_notification_email','richynoble75@live.com') ON CONFLICT(`key`) DO UPDATE SET `value`=excluded.`value`;--> statement-breakpoint
INSERT INTO `settings` (`key`,`value`) VALUES ('support_subject','DeafTech Support') ON CONFLICT(`key`) DO UPDATE SET `value`=excluded.`value`;--> statement-breakpoint
PRAGMA optimize;
