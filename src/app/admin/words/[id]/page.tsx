
import { notFound } from "next/navigation";
import { eq, and } from "drizzle-orm";

import { db } from "@/db";
import { vocabulary } from "@/db/schema";
import WordEditor from "./word-editor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditWordPage({ params }: Props) {
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

  const [word] = await db
    .select()
    .from(vocabulary)
    .where(
      and(
        eq(vocabulary.id, id),
        eq(vocabulary.partOfSpeech, "noun"),
        eq(vocabulary.status, "published")
      )
    )
    .limit(1);

 if (!word) notFound();

  return (
    <main className="min-h-screen bg-[#11131f] px-5 py-8 text-white md:px-12">
      <div className="mx-auto max-w-3xl">
        <WordEditor
          word={{
            id: word.id,
            lemma: word.lemma,
            meaningEn: word.meaningEn,
            meaningDe: word.meaningDe,
            cefrLevel: word.cefrLevel,
            plural: word.plural,
            genitive: word.genitive,
            notes: word.notes,
          }}
        />
      </div>
    </main>
  );
}
