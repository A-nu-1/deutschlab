import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { vocabulary, verbForms, vocabularyExamples } from "@/db/schema";
import { isLocalAdminRequest } from "@/lib/admin/local-admin";

export const runtime = "nodejs";
const persons = ["ich", "du", "er/sie/es", "wir", "ihr", "sie/Sie"] as const;
const tenseMap = {
  present: ["present", "indicative"],
  preterite: ["preterite", "indicative"],
  perfect: ["perfect", "indicative"],
  pluperfect: ["pluperfect", "indicative"],
  future_i: ["future1", "indicative"],
  konjunktiv_ii: ["konjunktiv2", "subjunctive"],
} as const;
const formSchema = z.object({
  tense: z.enum([
    "present",
    "preterite",
    "perfect",
    "pluperfect",
    "future_i",
    "konjunktiv_ii",
  ]),
  person: z.enum(persons),
  form: z.string().trim().min(1).max(160),
});
const payloadSchema = z.object({
  examples: z
    .array(
      z.object({
        id: z.string().nullable(),
        sentenceDe: z.string().trim().min(1).max(1000),
        translationEn: z.string().trim().min(1).max(1000),
        explanation: z.string().trim().max(1000),
      }),
    )
    .max(100),
  verbData: z
    .object({
      infinitive: z.string().trim().min(1),
      auxiliary: z.enum(["haben", "sein", "both"]),
      forms: z.array(formSchema).length(36),
    })
    .nullable(),
});
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isLocalAdminRequest(request))
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  const { id: encoded } = await params;
  let id: string;
  try {
    id = decodeURIComponent(encoded);
  } catch {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }
  const parsed = payloadSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success)
    return NextResponse.json(
      { error: "Invalid vocabulary data" },
      { status: 400 },
    );
  const data = parsed.data;
  try {
    const [word] = await db
      .select()
      .from(vocabulary)
      .where(and(eq(vocabulary.id, id), eq(vocabulary.status, "published")))
      .limit(1);
    if (!word)
      return NextResponse.json(
        { error: "Published vocabulary not found" },
        { status: 404 },
      );
    if (data.verbData) {
      if (
        word.partOfSpeech !== "verb" ||
        data.verbData.infinitive.toLocaleLowerCase("de") !==
          word.lemma.toLocaleLowerCase("de")
      )
        return NextResponse.json(
          { error: "Verb does not match published word" },
          { status: 400 },
        );
      const keys = new Set(
        data.verbData.forms.map((f) => `${f.tense}:${f.person}`),
      );
      if (keys.size !== 36)
        return NextResponse.json(
          { error: "Missing or duplicate conjugations" },
          { status: 400 },
        );
    }
    const currentExamples = await db
      .select({ id: vocabularyExamples.id })
      .from(vocabularyExamples)
      .where(eq(vocabularyExamples.vocabularyId, id));
    const owned = new Set(currentExamples.map((x) => x.id));
    const submitted = data.examples
      .map((x) => x.id)
      .filter((x): x is string => x !== null);
    if (
      submitted.some((x) => !owned.has(x)) ||
      new Set(submitted).size !== submitted.length
    )
      return NextResponse.json(
        { error: "Invalid example ID" },
        { status: 400 },
      );
    await db.transaction(async (tx) => {
      for (const item of data.examples) {
        const values = {
          sentenceDe: item.sentenceDe,
          translationEn: item.translationEn,
          explanation: item.explanation || null,
        };
        if (item.id)
          await tx
            .update(vocabularyExamples)
            .set(values)
            .where(
              and(
                eq(vocabularyExamples.id, item.id),
                eq(vocabularyExamples.vocabularyId, id),
              ),
            );
        else
          await tx
            .insert(vocabularyExamples)
            .values({ id: crypto.randomUUID(), vocabularyId: id, ...values });
      }
      if (data.verbData) {
        const existing = await tx
          .select({
            tense: verbForms.tense,
            mood: verbForms.mood,
            person: verbForms.person,
          })
          .from(verbForms)
          .where(eq(verbForms.vocabularyId, id));
        const existingKeys = new Set(
          existing.map((f) => `${f.tense}:${f.mood}:${f.person}`),
        );
        const missing = data.verbData.forms.flatMap((f) => {
          const [tense, mood] = tenseMap[f.tense];
          if (existingKeys.has(`${tense}:${mood}:${f.person}`)) return [];
          return [
            {
              id: crypto.randomUUID(),
              vocabularyId: id,
              tense,
              mood,
              person: f.person,
              form: f.form,
              auxiliary: data.verbData!.auxiliary,
            },
          ];
        });
        if (missing.length) await tx.insert(verbForms).values(missing);
      }
    });
    return NextResponse.json({
      success: true,
      message: "Saved. Existing conjugations preserved.",
    });
  } catch (e) {
    console.error("Published vocabulary update failed", e);
    return NextResponse.json({ error: "Could not save" }, { status: 500 });
  }
}
