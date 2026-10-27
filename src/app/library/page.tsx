import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  grammarRules,
  grammarExamples,
  grammarExceptions,
  vocabulary,
} from "@/db/schema";
import LibraryClient from "./library-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  const [rules, examples, exceptions, words] = await Promise.all([
    db
      .select()
      .from(grammarRules)
      .where(eq(grammarRules.status, "published"))
      .orderBy(asc(grammarRules.title)),

    db.select().from(grammarExamples),

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
      examples={examples}
      exceptions={exceptions}
      words={words}
    />
  );
}