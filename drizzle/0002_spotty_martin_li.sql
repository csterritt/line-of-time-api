CREATE TABLE `event` (
	`id` text PRIMARY KEY NOT NULL,
	`start_date` text NOT NULL,
	`end_date` text,
	`name` text NOT NULL,
	`basic_description` text NOT NULL,
	`longer_description` text,
	`reference_urls` text NOT NULL,
	`related_event_ids` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
