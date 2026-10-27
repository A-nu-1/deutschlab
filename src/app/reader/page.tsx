
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { vocabulary, nounPatterns, grammarRules } from "@/db/schema";
import ReaderClient from "./reader-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function ReaderPage() {
  const [words, patterns, rules] = await Promise.all([
    db
      .select()
      .from(vocabulary)
      .where(eq(vocabulary.status, "published"))
      .orderBy(asc(vocabulary.lemma)),
    db.select().from(nounPatterns),
    db
      .select()
      .from(grammarRules)
      .where(eq(grammarRules.status, "published")),
  ]);

  return (
    <ReaderClient
      words={words.map((word) => ({
        id: word.id,
        lemma: word.lemma,
        partOfSpeech: word.partOfSpeech,
        meaningEn: word.meaningEn,
        gender: word.gender,
        plural: word.plural,
        genitive: word.genitive,
        cefrLevel: word.cefrLevel,
        patternId: word.patternId,
      }))}
      patterns={patterns.map((pattern) => ({
        id: pattern.id,
        name: pattern.name,
        ruleId: pattern.ruleId,
      }))}
      rules={rules.map((rule) => ({
        id: rule.id,
        title: rule.titleDe || rule.title,
        slug: rule.slug,
      }))}
    />
  );
}
