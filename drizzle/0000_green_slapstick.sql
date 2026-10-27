CREATE TABLE `concept_relations` (
	`id` text PRIMARY KEY NOT NULL,
	`source_rule_id` text NOT NULL,
	`target_rule_id` text NOT NULL,
	`relation_type` text NOT NULL,
	FOREIGN KEY (`source_rule_id`) REFERENCES `grammar_rules`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`target_rule_id`) REFERENCES `grammar_rules`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `concept_relation_unique_idx` ON `concept_relations` (`source_rule_id`,`target_rule_id`,`relation_type`);--> statement-breakpoint
CREATE TABLE `grammar_examples` (
	`id` text PRIMARY KEY NOT NULL,
	`rule_id` text NOT NULL,
	`sentence_de` text NOT NULL,
	`translation_en` text,
	`explanation` text,
	`cefr_level` text,
	FOREIGN KEY (`rule_id`) REFERENCES `grammar_rules`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `example_rule_idx` ON `grammar_examples` (`rule_id`);--> statement-breakpoint
CREATE TABLE `grammar_exceptions` (
	`id` text PRIMARY KEY NOT NULL,
	`rule_id` text NOT NULL,
	`title` text NOT NULL,
	`explanation` text NOT NULL,
	`example_de` text,
	`example_en` text,
	FOREIGN KEY (`rule_id`) REFERENCES `grammar_rules`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `exception_rule_idx` ON `grammar_exceptions` (`rule_id`);--> statement-breakpoint
CREATE TABLE `grammar_rules` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`title_de` text,
	`category` text NOT NULL,
	`cefr_level` text NOT NULL,
	`explanation_en` text NOT NULL,
	`explanation_de` text,
	`notes` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`source_type` text DEFAULT 'manual' NOT NULL,
	`created_at` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `grammar_rules_slug_unique` ON `grammar_rules` (`slug`);--> statement-breakpoint
CREATE INDEX `grammar_level_idx` ON `grammar_rules` (`cefr_level`);--> statement-breakpoint
CREATE INDEX `grammar_category_idx` ON `grammar_rules` (`category`);--> statement-breakpoint
CREATE TABLE `noun_patterns` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`gender` text NOT NULL,
	`pattern_type` text NOT NULL,
	`ending` text,
	`explanation` text NOT NULL,
	`confidence` text DEFAULT 'usual' NOT NULL,
	`cefr_level` text NOT NULL,
	`rule_id` text,
	FOREIGN KEY (`rule_id`) REFERENCES `grammar_rules`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `noun_patterns_slug_unique` ON `noun_patterns` (`slug`);--> statement-breakpoint
CREATE TABLE `verb_forms` (
	`id` text PRIMARY KEY NOT NULL,
	`vocabulary_id` text NOT NULL,
	`tense` text NOT NULL,
	`mood` text DEFAULT 'indicative' NOT NULL,
	`person` text NOT NULL,
	`form` text NOT NULL,
	`auxiliary` text,
	`notes` text,
	FOREIGN KEY (`vocabulary_id`) REFERENCES `vocabulary`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `verb_form_unique_idx` ON `verb_forms` (`vocabulary_id`,`tense`,`mood`,`person`);--> statement-breakpoint
CREATE TABLE `vocabulary` (
	`id` text PRIMARY KEY NOT NULL,
	`lemma` text NOT NULL,
	`part_of_speech` text NOT NULL,
	`meaning_en` text NOT NULL,
	`meaning_de` text,
	`gender` text,
	`plural` text,
	`genitive` text,
	`cefr_level` text NOT NULL,
	`pattern_id` text,
	`notes` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`created_at` text DEFAULT '' NOT NULL,
	FOREIGN KEY (`pattern_id`) REFERENCES `noun_patterns`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `vocab_lemma_idx` ON `vocabulary` (`lemma`);--> statement-breakpoint
CREATE INDEX `vocab_level_idx` ON `vocabulary` (`cefr_level`);--> statement-breakpoint
CREATE INDEX `vocab_gender_idx` ON `vocabulary` (`gender`);