
import { NextRequest, NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import {
  vocabulary,
  verbForms,
  examples,
  exampleVocabulary,
} from "@/db/schema";
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
  if (!isLocalAdminRequest(request)) {
    return NextResponse.json(
      { error: "Not authorized" },
      { status: 403 },
    );
  }

  const { id: encoded } = await params;

  let id: string;

  try {
    id = decodeURIComponent(encoded);
  } catch {
    return NextResponse.json(
      { error: "Invalid ID" },
      { status: 400 },
    );
  }

  const parsed = payloadSchema.safeParse(
    await request.json().catch(() => null),
  );

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid vocabulary data" },
      { status: 400 },
    );
  }

  const data = parsed.data;

  try {
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

    if (!word) {
      return NextResponse.json(
        { error: "Published vocabulary not found" },
        { status: 404 },
      );
    }

    if (data.verbData) {
      if (
        word.partOfSpeech !== "verb" ||
        data.verbData.infinitive.toLocaleLowerCase("de") !==
          word.lemma.toLocaleLowerCase("de")
      ) {
        return NextResponse.json(
          { error: "Verb does not match published word" },
          { status: 400 },
        );
      }

      const keys = new Set(
        data.verbData.forms.map((f) => `${f.tense}:${f.person}`),
      );

      if (keys.size !== 36) {
        return NextResponse.json(
          { error: "Missing or duplicate conjugations" },
          { status: 400 },
        );
      }
    }

    const currentLinks = await db
      .select({ exampleId: exampleVocabulary.exampleId })
      .from(exampleVocabulary)
      .where(eq(exampleVocabulary.vocabularyId, id));

    const owned = new Set(currentLinks.map((item) => item.exampleId));

    const submitted = data.examples
      .map((item) => item.id)
      .filter((value): value is string => value !== null);

    if (
      submitted.some((exampleId) => !owned.has(exampleId)) ||
      new Set(submitted).size !== submitted.length
    ) {
      return NextResponse.json(
        { error: "Invalid example ID" },
        { status: 400 },
      );
    }

    await db.transaction(async (tx) => {
      const retainedExampleIds: string[] = [];

      for (const item of data.examples) {
        let exampleId = item.id;

        if (exampleId) {
          await tx
            .update(examples)
            .set({
              sentenceDe: item.sentenceDe,
              translationEn: item.translationEn,
              explanation: item.explanation || null,
            })
            .where(eq(examples.id, exampleId));
        } else {
          exampleId = crypto.randomUUID();

          await tx.insert(examples).values({
            id: exampleId,
            sentenceDe: item.sentenceDe,
            translationEn: item.translationEn,
            explanation: item.explanation || null,
            status: "published",
            sourceType: "manual",
            createdAt: new Date().toISOString(),
          });

          await tx.insert(exampleVocabulary).values({
            exampleId,
            vocabularyId: id,
          });
        }

        retainedExampleIds.push(exampleId);
      }

      // Remove this vocabulary relationship only.
      // Shared examples and their grammar relationships remain intact.
      const removedIds = [...owned].filter(
        (exampleId) => !retainedExampleIds.includes(exampleId),
      );

      if (removedIds.length > 0) {
        await tx
          .delete(exampleVocabulary)
          .where(
            and(
              eq(exampleVocabulary.vocabularyId, id),
              inArray(exampleVocabulary.exampleId, removedIds),
            ),
          );
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
          existing.map((form) => `${form.tense}:${form.mood}:${form.person}`),
        );

        const missing = data.verbData.forms.flatMap((form) => {
          const [tense, mood] = tenseMap[form.tense];

          if (existingKeys.has(`${tense}:${mood}:${form.person}`)) {
            return [];
          }

          return [
            {
              id: crypto.randomUUID(),
              vocabularyId: id,
              tense,
              mood,
              person: form.person,
              form: form.form,
              auxiliary: data.verbData!.auxiliary,
            },
          ];
        });

        if (missing.length > 0) {
          await tx.insert(verbForms).values(missing);
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: "Saved. Existing conjugations preserved.",
    });
  } catch (error) {
    console.error("Published vocabulary update failed", error);

    return NextResponse.json(
      { error: "Could not save" },
      { status: 500 },
    );
  }
}
