CREATE TABLE `support_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`request_id` text NOT NULL,
	`sender` text NOT NULL,
	`body` text NOT NULL,
	`delivery_status` text DEFAULT 'pending' NOT NULL,
	`delivery_error` text DEFAULT '' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`request_id`) REFERENCES `support_requests`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_support_messages_request_created` ON `support_messages` (`request_id`,`created_at`);