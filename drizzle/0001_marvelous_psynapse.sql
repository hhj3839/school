CREATE TABLE `classroom` (
	`id` integer PRIMARY KEY NOT NULL,
	`opened` integer DEFAULT 1 NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL
);

--> statement-breakpoint
INSERT INTO classroom (id,opened,revision) VALUES (1,1,0);
