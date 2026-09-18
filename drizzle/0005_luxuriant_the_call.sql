CREATE TABLE `support_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`device` text NOT NULL,
	`issue` text NOT NULL,
	`asl_code` text DEFAULT '' NOT NULL,
	`consent_at` integer NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_support_requests_status_created` ON `support_requests` (`status`,`created_at`);--> statement-breakpoint
PRAGMA optimize;
