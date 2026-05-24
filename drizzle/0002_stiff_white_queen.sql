CREATE TABLE `jobImports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`messageId` int NOT NULL,
	`jobId` int NOT NULL,
	`matchScore` varchar(50),
	`tier` varchar(50),
	`importedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `jobImports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `scheduledMessages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`reportDate` timestamp NOT NULL,
	`messageContent` text NOT NULL,
	`status` enum('pending','sent','archived') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`sentAt` timestamp,
	CONSTRAINT `scheduledMessages_id` PRIMARY KEY(`id`)
);
