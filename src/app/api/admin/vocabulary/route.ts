import { NextRequest, NextResponse } from "next/server";
import { and, eq, ne, sql } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { vocabulary, verbForms } from "@/db/schema";
import { isLocalAdminRequest } from "@/lib/admin/local-admin";
import { nounPatterns } from "@/db/schema";
import { matchNounPattern } from "@/lib/grammar/match-noun-pattern";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";


const generatedVerbSchema = z.object({
  infinitive: z.string().trim().min(1).max(120),
  auxiliary: z.enum(["haben", "sein", "both"]),
  pastParticiple: z.string().trim().min(1).max(120),
  separable: z.boolean(),
  prefix: z.string().max(80),
  notes: z.string().max(3000),
  forms: z
    .array(
      z.object({
        tense: z.enum([
          "present",
          "preterite",
          "perfect",
          "pluperfect",
          "future_i",
          "konjunktiv_ii",
        ]),
        person: z.enum(["ich", "du", "er/sie/es", "wir", "ihr", "sie/Sie"]),
        form: z.string().trim().min(1).max(160),
      }),
    )
    .length(36),
});

const editSchema = z.object({
  id: z.string().min(1).max(200),
  action: z.enum(["publish", "reject"]),
  lemma: z.string().trim().min(1).max(120),
  meaningEn: z.string().trim().min(1).max(1000),
  partOfSpeech: z.string().trim().min(1).max(60),
  cefrLevel: z.enum(["A1", "A2", "B1", "B2", "C1"]),
  gender: z.enum(["masculine", "feminine", "neuter", "none"]),
  plural: z.string().trim().max(120).nullable(),
  notes: z.string().max(3000).nullable(),
  verbData: generatedVerbSchema.nullable().optional(),
});



function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET(request: NextRequest) {
  if (!isLocalAdminRequest(request)) {
    return errorResponse("Not authorized.", 403);
  }

  try {
    const drafts = await db
      .select({
        id: vocabulary.id,
        lemma: vocabulary.lemma,
        meaningEn: vocabulary.meaningEn,
        partOfSpeech: vocabulary.partOfSpeech,
        cefrLevel: vocabulary.cefrLevel,
        gender: vocabulary.gender,
        plural: vocabulary.plural,
        notes: vocabulary.notes,
        status: vocabulary.status,
      })
      .from(vocabulary)
      .where(eq(vocabulary.status, "draft"))
      .orderBy(vocabulary.lemma);

    return NextResponse.json({
      success: true,
      drafts,
    });
  } catch (error) {
    console.error("Review list failed:", error);
    return errorResponse("Could not load drafts.", 500);
  }
}

export async function PATCH(request: NextRequest) {
  if (!isLocalAdminRequest(request)) {
    return errorResponse("Not authorized.", 403);
  }

  try {
    const body: unknown = await request.json();
    const parsed = editSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse("Invalid review data.", 400);
    }

    const data = parsed.data;
    if (
      data.action === "publish" &&
      data.partOfSpeech.toLowerCase() === "verb"
    ) {
      if (!data.verbData) {
        return errorResponse(
          "Verb conjugations must be reviewed before publishing.",
          400,
        );
      }

      const normalizedLemma = data.lemma.trim().toLocaleLowerCase("de");

      if (
        data.verbData.infinitive.trim().toLocaleLowerCase("de") !==
        normalizedLemma
      ) {
        return errorResponse(
          "Generated conjugations belong to a different infinitive. Regenerate them.",
          400,
        );
      }

      const combinations = new Set(
        data.verbData.forms.map((form) => `${form.tense}:${form.person}`),
      );

      if (combinations.size !== 36) {
        return errorResponse(
          "The conjugation table contains duplicate or missing forms.",
          400,
        );
      }
    }
    const partOfSpeech = data.partOfSpeech.toLowerCase();

    const lemma =
      partOfSpeech === "noun"
        ? data.lemma.replace(/^(der|die|das)\s+/iu, "").trim()
        : data.lemma.trim();

    if (!lemma) {
      return errorResponse("Lemma cannot be empty.", 400);
    }

    if (
      partOfSpeech === "noun" &&
      data.gender === "none" &&
      data.action === "publish"
    ) {
      return errorResponse(
        "Please verify the noun's gender before publishing.",
        400,
      );
    }

    // Keep duplicate checking case-insensitive.
    // This is a starter check; later we'll support
    // homographs and distinct dictionary senses.
    if (data.action === "publish") {
      const duplicates = await db
        .select({ id: vocabulary.id })
        .from(vocabulary)
        .where(
          and(
            sql`lower(trim(${vocabulary.lemma})) = ${lemma.toLowerCase()}`,
            eq(vocabulary.partOfSpeech, partOfSpeech),
            ne(vocabulary.id, data.id),
            eq(vocabulary.status, "published"),
          ),
        )
        .limit(1);

      if (duplicates.length > 0) {
        return errorResponse(
          "A published entry already exists for this lemma and part of speech.",
          409,
        );
      }
    }

    const newStatus = data.action === "publish" ? "published" : "rejected";

    let patternId: string | null = null;

    if (data.action === "publish" && partOfSpeech === "noun") {
      const gender = data.gender === "none" ? null : data.gender;

      const patternSlug = matchNounPattern(lemma, gender);

      if (patternSlug) {
        const [pattern] = await db
          .select({ id: nounPatterns.id })
          .from(nounPatterns)
          .where(eq(nounPatterns.slug, patternSlug))
          .limit(1);

        patternId = pattern?.id ?? null;
      }
    }

    const updated = await db.transaction(async (tx) => {
      const rows = await tx
        .update(vocabulary)
        .set({
          lemma,
          meaningEn: data.meaningEn,
          partOfSpeech,
          cefrLevel: data.cefrLevel,
          gender:
            partOfSpeech === "noun" && data.gender !== "none"
              ? data.gender
              : null,
          plural: partOfSpeech === "noun" ? data.plural?.trim() || null : null,
          patternId,
          notes: data.notes,
          status: newStatus,
        })
        .where(and(eq(vocabulary.id, data.id), eq(vocabulary.status, "draft")))
        .returning({
          id: vocabulary.id,
          status: vocabulary.status,
        });

      if (rows.length === 0) {
        return rows;
      }

      if (
        newStatus === "published" &&
        partOfSpeech === "verb" &&
        data.verbData
      ) {
        const tenseMapping: Record<string, { tense: string; mood: string }> = {
          present: {
            tense: "present",
            mood: "indicative",
          },
          preterite: {
            tense: "preterite",
            mood: "indicative",
          },
          perfect: {
            tense: "perfect",
            mood: "indicative",
          },
          pluperfect: {
            tense: "pluperfect",
            mood: "indicative",
          },
          future_i: {
            tense: "future1",
            mood: "indicative",
          },
          konjunktiv_ii: {
            tense: "konjunktiv2",
            mood: "subjunctive",
          },
        };

        const rowsToInsert = data.verbData.forms.map((form) => {
          const mapped = tenseMapping[form.tense];

          return {
            id: crypto.randomUUID(),
            vocabularyId: data.id,
            tense: mapped.tense,
            mood: mapped.mood,
            person: form.person,
            form: form.form,
            auxiliary: data.verbData!.auxiliary,
            notes: null,
          };
        });

        await tx.insert(verbForms).values(rowsToInsert);
      }

      return rows;
    });

    if (updated.length === 0) {
      return errorResponse(
        "This draft no longer exists or was already reviewed.",
        409,
      );
    }

    return NextResponse.json({
      success: true,
      status: newStatus,
      message:
        newStatus === "published"
          ? "Vocabulary entry published."
          : "Vocabulary draft rejected.",
    });
  } catch (error) {
    console.error("Review update failed:", error);
    return errorResponse("Could not update this draft.", 500);
  }
}
