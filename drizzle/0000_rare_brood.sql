CREATE TABLE `workspace` (
	`id` integer PRIMARY KEY NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`state` text NOT NULL,
	`updated_at` text NOT NULL
);
