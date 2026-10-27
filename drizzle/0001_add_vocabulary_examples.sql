CREATE TABLE `vocabulary_examples` (
	`id` text PRIMARY KEY NOT NULL,
	`vocabulary_id` text NOT NULL,
	`sentence_de` text NOT NULL,
	`translation_en` text NOT NULL,
	`explanation` text,
	FOREIGN KEY (`vocabulary_id`) REFERENCES `vocabulary`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `vocabulary_example_word_idx` ON `vocabulary_examples` (`vocabulary_id`);