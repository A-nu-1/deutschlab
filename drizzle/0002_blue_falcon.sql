CREATE TABLE `example_grammar` (
	`example_id` text NOT NULL,
	`rule_id` text NOT NULL,
	FOREIGN KEY (`example_id`) REFERENCES `examples`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`rule_id`) REFERENCES `grammar_rules`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `example_grammar_unique_idx` ON `example_grammar` (`example_id`,`rule_id`);--> statement-breakpoint
CREATE INDEX `example_grammar_rule_idx` ON `example_grammar` (`rule_id`);--> statement-breakpoint
CREATE TABLE `example_vocabulary` (
	`example_id` text NOT NULL,
	`vocabulary_id` text NOT NULL,
	FOREIGN KEY (`example_id`) REFERENCES `examples`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`vocabulary_id`) REFERENCES `vocabulary`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `example_vocabulary_unique_idx` ON `example_vocabulary` (`example_id`,`vocabulary_id`);--> statement-breakpoint
CREATE INDEX `example_vocabulary_word_idx` ON `example_vocabulary` (`vocabulary_id`);--> statement-breakpoint
CREATE TABLE `examples` (
	`id` text PRIMARY KEY NOT NULL,
	`sentence_de` text NOT NULL,
	`translation_en` text NOT NULL,
	`explanation` text,
	`cefr_level` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`source_type` text DEFAULT 'manual' NOT NULL,
	`created_at` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE INDEX `examples_level_idx` ON `examples` (`cefr_level`);--> statement-breakpoint
CREATE INDEX `examples_status_idx` ON `examples` (`status`);--> statement-breakpoint
DROP TABLE `grammar_examples`;--> statement-breakpoint
DROP TABLE `vocabulary_examples`;