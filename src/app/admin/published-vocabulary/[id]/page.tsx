import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { vocabulary, vocabularyExamples, verbForms } from "@/db/schema";
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
    .where(and(eq(vocabulary.id, id), eq(vocabulary.status, "published")))
    .limit(1);
  if (!word) notFound();
  const [examples, forms] = await Promise.all([
    db
      .select()
      .from(vocabularyExamples)
      .where(eq(vocabularyExamples.vocabularyId, id)),
    db.select().from(verbForms).where(eq(verbForms.vocabularyId, id)),
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
      initialExamples={examples.map((e) => ({
        id: e.id,
        sentenceDe: e.sentenceDe,
        translationEn: e.translationEn,
        explanation: e.explanation ?? "",
      }))}
      existingForms={forms.length}
    />
  );
}
