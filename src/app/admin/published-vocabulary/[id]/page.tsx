
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  vocabulary,
  examples as sharedExamples,
  exampleVocabulary,
  verbForms,
} from "@/db/schema";
import PublishedVocabularyEditor from "@/components/vocabulary/published-vocabulary-editor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (process.env.NODE_ENV !== "development") notFound();

  const { id: encoded } = await params;

  let id: string;

  try {
    id = decodeURIComponent(encoded);
  } catch {
    notFound();
  }

  const [word] = await db
    .select()
    .from(vocabulary)
    .where(
      and(
        eq(vocabulary.id, id),
        eq(vocabulary.status, "published"),
      ),
    )
    .limit(1);

  if (!word) notFound();

  const [examples, forms] = await Promise.all([
    db
      .select({
        id: sharedExamples.id,
        sentenceDe: sharedExamples.sentenceDe,
        translationEn: sharedExamples.translationEn,
        explanation: sharedExamples.explanation,
      })
      .from(exampleVocabulary)
      .innerJoin(
        sharedExamples,
        eq(exampleVocabulary.exampleId, sharedExamples.id),
      )
      .where(eq(exampleVocabulary.vocabularyId, id)),

    db
      .select()
      .from(verbForms)
      .where(eq(verbForms.vocabularyId, id)),
  ]);

  return (
    <PublishedVocabularyEditor
      word={{
        id: word.id,
        lemma: word.lemma,
        meaningEn: word.meaningEn,
        partOfSpeech: word.partOfSpeech,
        cefrLevel: word.cefrLevel,
      }}
      initialExamples={examples.map((example) => ({
        id: example.id,
        sentenceDe: example.sentenceDe,
        translationEn: example.translationEn,
        explanation: example.explanation ?? "",
      }))}
      existingForms={forms.length}
    />
  );
}
