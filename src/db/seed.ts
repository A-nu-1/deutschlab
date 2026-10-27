import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

import {
  grammarRules,
  grammarExamples,
  grammarExceptions,
  nounPatterns,
  vocabulary,
  verbForms,
  conceptRelations,
} from "./schema";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  throw new Error("Missing Turso environment variables");
}

const client = createClient({ url, authToken });
const db = drizzle(client);

const now = new Date().toISOString();

// Stable IDs allow the seed to be run repeatedly.
const id = (type: string, name: string) => `seed:${type}:${name}`;

async function main() {
  console.log("🇩🇪 Starting DeutschLab seed...");

  // =============================================
  // 1. GRAMMAR RULES
  // =============================================

  const rules = [
    {
      slug: "masculine-n-declension",
      title: "Masculine N-Declension",
      titleDe: "Die N-Deklination",
      category: "nouns",
      cefrLevel: "B1",
      explanationEn:
        "Certain masculine nouns add -(e)n in the accusative, dative and genitive singular. Some nouns, such as Name, have the genitive ending -ns.",
      explanationDe:
        "Bestimmte maskuline Nomen erhalten im Akkusativ, Dativ und Genitiv Singular -(e)n. Einige, zum Beispiel Name, bilden den Genitiv mit -ns.",
    },
    {
      slug: "feminine-ung-ending",
      title: "Feminine Nouns Ending in -ung",
      titleDe: "Feminine Nomen auf -ung",
      category: "noun-gender",
      cefrLevel: "A2",
      explanationEn:
        "Nouns formed with the suffix -ung are feminine. Examples include die Zeitung, die Entscheidung and die Regierung.",
      explanationDe:
        "Nomen mit dem Suffix -ung sind feminin, zum Beispiel die Zeitung, die Entscheidung und die Regierung.",
    },
    {
      slug: "feminine-heit-keit",
      title: "Feminine Nouns Ending in -heit and -keit",
      titleDe: "Nomen auf -heit und -keit",
      category: "noun-gender",
      cefrLevel: "A2",
      explanationEn:
        "Nouns formed with the suffixes -heit and -keit are feminine, such as die Freiheit and die Möglichkeit.",
      explanationDe: "Nomen mit den Suffixen -heit und -keit sind feminin.",
    },
    {
      slug: "neuter-diminutives",
      title: "Neuter Diminutives",
      titleDe: "Verkleinerungsformen",
      category: "noun-gender",
      cefrLevel: "A2",
      explanationEn:
        "Diminutive nouns ending in -chen or -lein are neuter, regardless of the gender of the original noun.",
      explanationDe:
        "Verkleinerungsformen mit -chen oder -lein sind immer neutral.",
    },
    {
      slug: "masculine-days-months",
      title: "Days and Months Are Masculine",
      titleDe: "Wochentage und Monate",
      category: "noun-gender",
      cefrLevel: "A1",
      explanationEn:
        "Names of weekdays and months are masculine, for example der Montag and der Januar.",
      explanationDe: "Wochentage und Monate sind maskulin.",
    },
    {
      slug: "perfect-tense",
      title: "The Perfect Tense",
      titleDe: "Das Perfekt",
      category: "verbs",
      cefrLevel: "A2",
      explanationEn:
        "The German Perfekt generally uses haben or sein plus the past participle. It is especially common when speaking about the past.",
      explanationDe:
        "Das Perfekt besteht aus haben oder sein und dem Partizip II.",
    },
    {
      slug: "subordinate-weil",
      title: "Subordinate Clauses with weil",
      titleDe: "Nebensätze mit weil",
      category: "sentence-structure",
      cefrLevel: "A2",
      explanationEn:
        "Weil introduces a subordinate clause expressing a reason. The finite verb normally appears at the end of that clause.",
      explanationDe:
        "Weil leitet einen kausalen Nebensatz ein. Das finite Verb steht am Ende.",
    },
    {
      slug: "subordinate-obwohl",
      title: "Concessive Clauses with obwohl",
      titleDe: "Nebensätze mit obwohl",
      category: "sentence-structure",
      cefrLevel: "B1",
      explanationEn:
        "Obwohl introduces a subordinate clause expressing a contrast or concession. The finite verb appears at the end.",
      explanationDe:
        "Obwohl leitet einen konzessiven Nebensatz ein. Das finite Verb steht am Ende.",
    },
    {
      slug: "konjunktiv-two",
      title: "Konjunktiv II",
      titleDe: "Konjunktiv II",
      category: "verbs",
      cefrLevel: "B1",
      explanationEn:
        "Konjunktiv II is used for hypothetical situations, wishes and polite requests. Common forms include hätte, wäre and würde plus infinitive.",
      explanationDe:
        "Der Konjunktiv II drückt unter anderem Wünsche, irreale Situationen und höfliche Bitten aus.",
    },
  ] as const;

  for (const rule of rules) {
    await db
      .insert(grammarRules)
      .values({
        id: id("rule", rule.slug),
        ...rule,
        status: "published",
        sourceType: "manual",
        createdAt: now,
      })
      .onConflictDoUpdate({
        target: grammarRules.slug,
        set: {
          title: rule.title,
          titleDe: rule.titleDe,
          category: rule.category,
          cefrLevel: rule.cefrLevel,
          explanationEn: rule.explanationEn,
          explanationDe: rule.explanationDe,
        },
      });
  }

  console.log(`✅ ${rules.length} grammar rules`);

  // =============================================
  // 2. NOUN PATTERNS
  // =============================================

  const patterns = [
    {
      slug: "masculine-n-declension",
      name: "Masculine N-Declension",
      gender: "masculine",
      patternType: "declension",
      ending: null,
      explanation:
        "Certain masculine nouns take -(e)n in most singular cases outside the nominative.",
      confidence: "restricted",
      cefrLevel: "B1",
      ruleSlug: "masculine-n-declension",
    },
    {
      slug: "feminine-ung",
      name: "Feminine -ung",
      gender: "feminine",
      patternType: "suffix",
      ending: "-ung",
      explanation: "Nouns formed with the suffix -ung are feminine.",
      confidence: "strong",
      cefrLevel: "A2",
      ruleSlug: "feminine-ung-ending",
    },
    {
      slug: "feminine-heit-keit",
      name: "Feminine -heit/-keit",
      gender: "feminine",
      patternType: "suffix",
      ending: "-heit/-keit",
      explanation: "Nouns with these suffixes are feminine.",
      confidence: "strong",
      cefrLevel: "A2",
      ruleSlug: "feminine-heit-keit",
    },
    {
      slug: "neuter-chen",
      name: "Neuter -chen",
      gender: "neuter",
      patternType: "suffix",
      ending: "-chen",
      explanation: "Diminutive nouns ending in -chen are neuter.",
      confidence: "strong",
      cefrLevel: "A2",
      ruleSlug: "neuter-diminutives",
    },
    {
      slug: "neuter-lein",
      name: "Neuter -lein",
      gender: "neuter",
      patternType: "suffix",
      ending: "-lein",
      explanation: "Diminutive nouns ending in -lein are neuter.",
      confidence: "strong",
      cefrLevel: "A2",
      ruleSlug: "neuter-diminutives",
    },
    {
      slug: "masculine-weekdays",
      name: "Masculine Weekdays",
      gender: "masculine",
      patternType: "semantic",
      ending: null,
      explanation: "Names of weekdays are masculine.",
      confidence: "strong",
      cefrLevel: "A1",
      ruleSlug: "masculine-days-months",
    },
  ] as const;

  for (const pattern of patterns) {
    await db
      .insert(nounPatterns)
      .values({
        id: id("pattern", pattern.slug),
        slug: pattern.slug,
        name: pattern.name,
        gender: pattern.gender,
        patternType: pattern.patternType,
        ending: pattern.ending,
        explanation: pattern.explanation,
        confidence: pattern.confidence,
        cefrLevel: pattern.cefrLevel,
        ruleId: id("rule", pattern.ruleSlug),
      })
      .onConflictDoUpdate({
        target: nounPatterns.slug,
        set: {
          name: pattern.name,
          gender: pattern.gender,
          patternType: pattern.patternType,
          ending: pattern.ending,
          explanation: pattern.explanation,
          confidence: pattern.confidence,
          cefrLevel: pattern.cefrLevel,
          ruleId: id("rule", pattern.ruleSlug),
        },
      });
  }

  console.log(`✅ ${patterns.length} noun patterns`);

  // =============================================
  // 3. VOCABULARY
  // =============================================

  const words = [
    [
      "der-name",
      "Name",
      "noun",
      "name",
      "masculine",
      "Namen",
      "Namens",
      "A2",
      "masculine-n-declension",
    ],
    [
      "der-junge",
      "Junge",
      "noun",
      "boy",
      "masculine",
      "Jungen",
      "Jungen",
      "A1",
      "masculine-n-declension",
    ],
    [
      "der-kollege",
      "Kollege",
      "noun",
      "male colleague",
      "masculine",
      "Kollegen",
      "Kollegen",
      "A2",
      "masculine-n-declension",
    ],
    ["die-dame", "Dame", "noun", "lady", "feminine", "Damen", null, "A2", null],
    [
      "die-zeitung",
      "Zeitung",
      "noun",
      "newspaper",
      "feminine",
      "Zeitungen",
      null,
      "A1",
      "feminine-ung",
    ],
    [
      "die-entscheidung",
      "Entscheidung",
      "noun",
      "decision",
      "feminine",
      "Entscheidungen",
      null,
      "B1",
      "feminine-ung",
    ],
    [
      "die-regierung",
      "Regierung",
      "noun",
      "government",
      "feminine",
      "Regierungen",
      null,
      "B1",
      "feminine-ung",
    ],
    [
      "die-freiheit",
      "Freiheit",
      "noun",
      "freedom",
      "feminine",
      "Freiheiten",
      null,
      "B1",
      "feminine-heit-keit",
    ],
    [
      "die-moeglichkeit",
      "Möglichkeit",
      "noun",
      "possibility",
      "feminine",
      "Möglichkeiten",
      null,
      "B1",
      "feminine-heit-keit",
    ],
    [
      "das-maedchen",
      "Mädchen",
      "noun",
      "girl",
      "neuter",
      "Mädchen",
      "Mädchens",
      "A1",
      "neuter-chen",
    ],
    [
      "das-haeuschen",
      "Häuschen",
      "noun",
      "little house",
      "neuter",
      "Häuschen",
      "Häuschens",
      "B1",
      "neuter-chen",
    ],
    [
      "das-buechlein",
      "Büchlein",
      "noun",
      "little book",
      "neuter",
      "Büchlein",
      "Büchleins",
      "B1",
      "neuter-lein",
    ],
    [
      "der-montag",
      "Montag",
      "noun",
      "Monday",
      "masculine",
      "Montage",
      "Montags",
      "A1",
      "masculine-weekdays",
    ],
    [
      "verb-machen",
      "machen",
      "verb",
      "to do / make",
      null,
      null,
      null,
      "A1",
      null,
    ],
    ["verb-gehen", "gehen", "verb", "to go", null, null, null, "A1", null],
    ["verb-sein", "sein", "verb", "to be", null, null, null, "A1", null],
    [
      "der-mann",
      "Mann",
      "noun",
      "man",
      "masculine",
      "Männer",
      "Mannes",
      "A1",
      null,
    ],
    [
      "die-bedeutung",
      "Bedeutung",
      "noun",
      "meaning / significance",
      "feminine",
      "Bedeutungen",
      null,
      "B1",
      "feminine-ung",
    ],
  ] as const;

  for (const [
    key,
    lemma,
    partOfSpeech,
    meaningEn,
    gender,
    plural,
    genitive,
    cefrLevel,
    patternSlug,
  ] of words) {
    await db
      .insert(vocabulary)
      .values({
        id: id("word", key),
        lemma,
        partOfSpeech,
        meaningEn,
        gender,
        plural,
        genitive,
        cefrLevel,
        patternId: patternSlug ? id("pattern", patternSlug) : null,
        status: "published",
        createdAt: now,
      })
      .onConflictDoUpdate({
        target: vocabulary.id,
        set: {
          lemma,
          partOfSpeech,
          meaningEn,
          gender,
          plural,
          genitive,
          cefrLevel,
          patternId: patternSlug ? id("pattern", patternSlug) : null,
        },
      });
  }

  console.log(`✅ ${words.length} vocabulary entries`);

  // =============================================
  // 4. VERB CONJUGATIONS
  // =============================================

  const conjugations = [
    {
      word: "verb-machen",
      forms: ["mache", "machst", "macht", "machen", "macht", "machen"],
    },
    {
      word: "verb-gehen",
      forms: ["gehe", "gehst", "geht", "gehen", "geht", "gehen"],
    },
    {
      word: "verb-sein",
      forms: ["bin", "bist", "ist", "sind", "seid", "sind"],
    },
  ];

  const persons = ["ich", "du", "er/sie/es", "wir", "ihr", "sie/Sie"];

  for (const verb of conjugations) {
    for (let i = 0; i < persons.length; i++) {
      await db
        .insert(verbForms)
        .values({
          id: id("form", `${verb.word}:present:${i}`),
          vocabularyId: id("word", verb.word),
          tense: "present",
          mood: "indicative",
          person: persons[i],
          form: verb.forms[i],
        })
        .onConflictDoUpdate({
          target: [
            verbForms.vocabularyId,
            verbForms.tense,
            verbForms.mood,
            verbForms.person,
          ],
          set: { form: verb.forms[i] },
        });
    }
  }

  console.log("✅ 18 present-tense verb forms");

  // =============================================
  // 5. GRAMMAR EXAMPLES
  // =============================================

  const examples = [
    {
      rule: "masculine-n-declension",
      key: "name-genitive",
      de: "Ich kenne den Namen des Mannes.",
      en: "I know the man's name.",
      note: "Name takes -n in the accusative singular.",
      level: "B1",
    },
    {
      rule: "masculine-n-declension",
      key: "junge-accusative",
      de: "Ich sehe den Jungen.",
      en: "I see the boy.",
      note: "Junge becomes Jungen in the accusative singular.",
      level: "A2",
    },
    {
      rule: "feminine-ung-ending",
      key: "zeitung",
      de: "Ich lese die Zeitung.",
      en: "I read the newspaper.",
      note: "Zeitung has the feminine suffix -ung.",
      level: "A1",
    },
    {
      rule: "feminine-heit-keit",
      key: "moeglichkeit",
      de: "Es gibt viele Möglichkeiten.",
      en: "There are many possibilities.",
      note: "Möglichkeit ends in -keit.",
      level: "B1",
    },
    {
      rule: "neuter-diminutives",
      key: "maedchen",
      de: "Das Mädchen spielt im Garten.",
      en: "The girl is playing in the garden.",
      note: "The -chen suffix makes Mädchen neuter.",
      level: "A1",
    },
    {
      rule: "masculine-days-months",
      key: "montag",
      de: "Der Montag ist oft stressig.",
      en: "Monday is often stressful.",
      note: "Weekdays are masculine.",
      level: "A1",
    },
    {
      rule: "perfect-tense",
      key: "gehen",
      de: "Ich bin gestern nach Hause gegangen.",
      en: "I went home yesterday.",
      note: "Gehen forms the Perfekt with sein.",
      level: "A2",
    },
    {
      rule: "subordinate-weil",
      key: "lernen",
      de: "Ich lerne Deutsch, weil ich in der Schweiz lebe.",
      en: "I learn German because I live in Switzerland.",
      note: "The finite verb lebe is at the end of the weil clause.",
      level: "A2",
    },
    {
      rule: "subordinate-obwohl",
      key: "regen",
      de: "Obwohl es regnet, gehe ich spazieren.",
      en: "Although it is raining, I go for a walk.",
      note: "Regnet appears at the end of the subordinate clause.",
      level: "B1",
    },
    {
      rule: "konjunktiv-two",
      key: "zeit",
      de: "Wenn ich mehr Zeit hätte, würde ich jeden Tag lesen.",
      en: "If I had more time, I would read every day.",
      note: "Hätte and würde express a hypothetical situation.",
      level: "B1",
    },
  ];

  for (const example of examples) {
    await db
      .insert(grammarExamples)
      .values({
        id: id("example", example.key),
        ruleId: id("rule", example.rule),
        sentenceDe: example.de,
        translationEn: example.en,
        explanation: example.note,
        cefrLevel: example.level,
      })
      .onConflictDoUpdate({
        target: grammarExamples.id,
        set: {
          sentenceDe: example.de,
          translationEn: example.en,
          explanation: example.note,
          cefrLevel: example.level,
        },
      });
  }

  console.log(`✅ ${examples.length} grammar examples`);

  // =============================================
  // 6. EXCEPTIONS
  // =============================================

  const exceptions = [
    {
      key: "dame",
      rule: "masculine-n-declension",
      title: "die Dame is not masculine",
      explanation:
        "Not every noun ending in -e is masculine. Dame is feminine and does not follow masculine N-declension.",
      de: "Ich spreche mit der Dame.",
      en: "I am speaking with the lady.",
    },
    {
      key: "name-genitive",
      rule: "masculine-n-declension",
      title: "Special genitive: des Namens",
      explanation:
        "Name has the genitive singular Namens, not Namen. Its accusative and dative singular forms are Namen.",
      de: "Die Bedeutung des Namens ist interessant.",
      en: "The meaning of the name is interesting.",
    },
    {
      key: "maedchen-gender",
      rule: "neuter-diminutives",
      title: "das Mädchen is grammatically neuter",
      explanation:
        "Mädchen refers to a girl, but its diminutive suffix -chen makes its grammatical gender neuter.",
      de: "Das Mädchen liest ein Buch.",
      en: "The girl is reading a book.",
    },
  ];

  for (const item of exceptions) {
    await db
      .insert(grammarExceptions)
      .values({
        id: id("exception", item.key),
        ruleId: id("rule", item.rule),
        title: item.title,
        explanation: item.explanation,
        exampleDe: item.de,
        exampleEn: item.en,
      })
      .onConflictDoUpdate({
        target: grammarExceptions.id,
        set: {
          title: item.title,
          explanation: item.explanation,
          exampleDe: item.de,
          exampleEn: item.en,
        },
      });
  }

  console.log(`✅ ${exceptions.length} exceptions`);

  // =============================================
  // 7. CONCEPT RELATIONSHIPS
  // =============================================

  const relations = [
    ["subordinate-weil", "subordinate-obwohl", "related"],
    ["perfect-tense", "konjunktiv-two", "related-verb-grammar"],
  ];

  for (const [source, target, relationType] of relations) {
    await db
      .insert(conceptRelations)
      .values({
        id: id("relation", `${source}:${target}`),
        sourceRuleId: id("rule", source),
        targetRuleId: id("rule", target),
        relationType,
      })
      .onConflictDoNothing();
  }

  console.log(`✅ ${relations.length} concept relations`);
  console.log("🎉 DEUTSCHLAB SEED COMPLETE!");
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(() => client.close());
