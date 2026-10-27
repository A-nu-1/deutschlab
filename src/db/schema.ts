import {
  sqliteTable,
  text,
  index,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

// Common identifiers and timestamps
const newId = () => crypto.randomUUID();

// 1. Grammar rules: the central reference library
export const grammarRules = sqliteTable(
  "grammar_rules",
  {
    id: text("id").primaryKey().$defaultFn(newId),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    titleDe: text("title_de"),
    category: text("category").notNull(),
    cefrLevel: text("cefr_level").notNull(),
    explanationEn: text("explanation_en").notNull(),
    explanationDe: text("explanation_de"),
    notes: text("notes"),
    status: text("status").notNull().default("draft"),
    sourceType: text("source_type")
      .notNull()
      .default("manual"),
    createdAt: text("created_at")
      .notNull()
      .default(""),
  },
  (t) => [
    index("grammar_level_idx").on(t.cefrLevel),
    index("grammar_category_idx").on(t.category),
  ]
);

// 2. Examples belonging to grammar rules
export const grammarExamples = sqliteTable(
  "grammar_examples",
  {
    id: text("id").primaryKey().$defaultFn(newId),
    ruleId: text("rule_id")
      .notNull()
      .references(() => grammarRules.id, {
        onDelete: "cascade",
      }),
    sentenceDe: text("sentence_de").notNull(),
    translationEn: text("translation_en"),
    explanation: text("explanation"),
    cefrLevel: text("cefr_level"),
  },
  (t) => [index("example_rule_idx").on(t.ruleId)]
);

// 3. Grammar exceptions and common mistakes
export const grammarExceptions = sqliteTable(
  "grammar_exceptions",
  {
    id: text("id").primaryKey().$defaultFn(newId),
    ruleId: text("rule_id")
      .notNull()
      .references(() => grammarRules.id, {
        onDelete: "cascade",
      }),
    title: text("title").notNull(),
    explanation: text("explanation").notNull(),
    exampleDe: text("example_de"),
    exampleEn: text("example_en"),
  },
  (t) => [index("exception_rule_idx").on(t.ruleId)]
);

// 4. Noun gender and morphology patterns
export const nounPatterns = sqliteTable(
  "noun_patterns",
  {
    id: text("id").primaryKey().$defaultFn(newId),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    gender: text("gender", {
      enum: ["masculine", "feminine", "neuter", "mixed"],
    }).notNull(),
    patternType: text("pattern_type").notNull(),
    ending: text("ending"),
    explanation: text("explanation").notNull(),
    confidence: text("confidence").notNull().default("usual"),
    cefrLevel: text("cefr_level").notNull(),
    ruleId: text("rule_id").references(() => grammarRules.id, {
      onDelete: "set null",
    }),
  }
);

// 5. Vocabulary: nouns, verbs, adjectives, expressions
export const vocabulary = sqliteTable(
  "vocabulary",
  {
    id: text("id").primaryKey().$defaultFn(newId),
    lemma: text("lemma").notNull(),
    partOfSpeech: text("part_of_speech").notNull(),
    meaningEn: text("meaning_en").notNull(),
    meaningDe: text("meaning_de"),
    gender: text("gender", {
      enum: ["masculine", "feminine", "neuter"],
    }),
    plural: text("plural"),
    genitive: text("genitive"),
    cefrLevel: text("cefr_level").notNull(),
    patternId: text("pattern_id").references(
      () => nounPatterns.id,
      { onDelete: "set null" }
    ),
    notes: text("notes"),
    status: text("status").notNull().default("draft"),
    createdAt: text("created_at").notNull().default(""),
  },
  (t) => [
    index("vocab_lemma_idx").on(t.lemma),
    index("vocab_level_idx").on(t.cefrLevel),
    index("vocab_gender_idx").on(t.gender),
  ]
);

// 6. Conjugations and verb forms
export const verbForms = sqliteTable(
  "verb_forms",
  {
    id: text("id").primaryKey().$defaultFn(newId),
    vocabularyId: text("vocabulary_id")
      .notNull()
      .references(() => vocabulary.id, {
        onDelete: "cascade",
      }),
    tense: text("tense").notNull(),
    mood: text("mood").notNull().default("indicative"),
    person: text("person").notNull(),
    form: text("form").notNull(),
    auxiliary: text("auxiliary"),
    notes: text("notes"),
  },
  (t) => [
    uniqueIndex("verb_form_unique_idx").on(
      t.vocabularyId,
      t.tense,
      t.mood,
      t.person
    ),
  ]
);

// 7. Related grammar concepts
export const conceptRelations = sqliteTable(
  "concept_relations",
  {
    id: text("id").primaryKey().$defaultFn(newId),
    sourceRuleId: text("source_rule_id")
      .notNull()
      .references(() => grammarRules.id, {
        onDelete: "cascade",
      }),
    targetRuleId: text("target_rule_id")
      .notNull()
      .references(() => grammarRules.id, {
        onDelete: "cascade",
      }),
    relationType: text("relation_type").notNull(),
  },
  (t) => [
    uniqueIndex("concept_relation_unique_idx").on(
      t.sourceRuleId,
      t.targetRuleId,
      t.relationType
    ),
  ]
);

// 8. Example sentences belonging to vocabulary entries
export const vocabularyExamples = sqliteTable(
  "vocabulary_examples",
  {
    id: text("id").primaryKey().$defaultFn(newId),

    vocabularyId: text("vocabulary_id")
      .notNull()
      .references(() => vocabulary.id, {
        onDelete: "cascade",
      }),

    sentenceDe: text("sentence_de").notNull(),
    translationEn: text("translation_en").notNull(),
    explanation: text("explanation"),
  },
  (t) => [
    index("vocabulary_example_word_idx").on(t.vocabularyId),
  ]
);