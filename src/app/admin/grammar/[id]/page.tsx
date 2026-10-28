
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  grammarRules,
  examples as sharedExamples,
  exampleGrammar,
  grammarExceptions,
} from "@/db/schema";
import GrammarEditor from "./grammar-editor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditGrammarPage({ params }: Props) {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  const { id: encodedId } = await params;

  let id: string;

  try {
    id = decodeURIComponent(encodedId);
  } catch {
    notFound();
  }

  const [rule] = await db
    .select()
    .from(grammarRules)
    .where(
      and(
        eq(grammarRules.id, id),
        eq(grammarRules.status, "published")
      )
    )
    .limit(1);

  if (!rule) notFound();

  const examples = await db
    .select({
      id: sharedExamples.id,
      sentenceDe: sharedExamples.sentenceDe,
      translationEn: sharedExamples.translationEn,
      explanation: sharedExamples.explanation,
    })
    .from(exampleGrammar)
    .innerJoin(
      sharedExamples,
      eq(exampleGrammar.exampleId, sharedExamples.id)
    )
    .where(eq(exampleGrammar.ruleId, rule.id));

  const exceptions = await db
    .select()
    .from(grammarExceptions)
    .where(eq(grammarExceptions.ruleId, rule.id));

  return (
    <main className="min-h-screen bg-[#11131f] px-5 py-8 text-white md:px-10">
      <div className="mx-auto max-w-4xl">
        <GrammarEditor
          rule={{
            id: rule.id,
            slug: rule.slug,
            title: rule.title,
            titleDe: rule.titleDe ?? "",
            explanationEn: rule.explanationEn,
            explanationDe: rule.explanationDe ?? "",
            cefrLevel: rule.cefrLevel,
          }}
          initialExamples={examples.map((example) => ({
            id: example.id,
            sentenceDe: example.sentenceDe,
            translationEn: example.translationEn,
            explanation: example.explanation ?? "",
          }))}
          initialExceptions={exceptions.map((item) => ({
            id: item.id,
            title: item.title,
            explanation: item.explanation,
            exampleDe: item.exampleDe ?? "",
            exampleEn: item.exampleEn ?? "",
          }))}
        />
      </div>
    </main>
  );
}
