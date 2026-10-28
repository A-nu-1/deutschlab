
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  grammarRules,
  examples,
  exampleGrammar,
  grammarExceptions,
  vocabulary,
} from "@/db/schema";
import LibraryClient from "./library-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  const [rules, examplesList, exceptions, words] = await Promise.all([
    db
      .select()
      .from(grammarRules)
      .where(eq(grammarRules.status, "published"))
      .orderBy(asc(grammarRules.title)),

    db
  .select({
    id: examples.id,
    ruleId: exampleGrammar.ruleId,
    sentenceDe: examples.sentenceDe,
    translationEn: examples.translationEn,
    explanation: examples.explanation,
    cefrLevel: examples.cefrLevel,
    status: examples.status,
    sourceType: examples.sourceType,
    createdAt: examples.createdAt,
  })
  .from(exampleGrammar)
  .innerJoin(
    examples,
    eq(exampleGrammar.exampleId, examples.id),
  )
  .where(eq(examples.status, "published")),

    db.select().from(grammarExceptions),

    db
      .select()
      .from(vocabulary)
      .where(eq(vocabulary.status, "published"))
      .orderBy(asc(vocabulary.lemma)),
  ]);

  return (
    <LibraryClient
      rules={rules}
      examples={examplesList}
      exceptions={exceptions}
      words={words}
    />
  );
}
