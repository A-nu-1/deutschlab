
import { NextRequest, NextResponse } from "next/server";
import { eq, sql, and } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { vocabulary } from "@/db/schema";
import { analysisSchema } from "@/lib/ai/analysis-schema";
import { isLocalAdminRequest } from "@/lib/admin/local-admin";

export const runtime = "nodejs";

// Reuse the schema already used to validate Gemini output.
const requestSchema = z.object({
  word: analysisSchema.shape.vocabulary.element,
});

export async function POST(request: NextRequest) {
  if (!isLocalAdminRequest(request)) {
    return NextResponse.json(
      { error: "Not authorized." },
      { status: 403 },
    );
  }
  try {
    const body = await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid vocabulary data." },
        { status: 400 }
      );
    }

    const suggestion = parsed.data.word;

    // Normalize noun lemmas before saving.
// Gemini sometimes returns "die Voraussetzung"
// instead of the dictionary lemma "Voraussetzung".
const partOfSpeech = suggestion.partOfSpeech
  .trim()
  .toLowerCase();

const rawLemma = suggestion.lemma.trim();

const lemma =
  partOfSpeech === "noun"
    ? rawLemma.replace(/^(der|die|das)\s+/iu, "").trim()
    : rawLemma;

    if (
      !lemma ||
      lemma.length > 120 ||
      !suggestion.meaningEn.trim() ||
      suggestion.meaningEn.length > 1000 ||
      suggestion.partOfSpeech.length > 60
    ) {
      return NextResponse.json(
        { error: "Invalid word details." },
        { status: 400 }
      );
    }

   

    // Check whether this lemma + grammatical category
    // is already present, including unpublished drafts.
    const existing = await db
      .select({
        id: vocabulary.id,
        status: vocabulary.status,
        lemma: vocabulary.lemma,
      })
      .from(vocabulary)
      .where(
        and(
          sql`lower(trim(${vocabulary.lemma})) = ${lemma.toLocaleLowerCase("de")}`,
          eq(vocabulary.partOfSpeech, partOfSpeech)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({
        success: true,
        result: "exists",
        status: existing[0].status,
        message:
          existing[0].status === "published"
            ? "Already in your published library."
            : "Already saved as a draft.",
      });
    }

    const id = crypto.randomUUID();

    await db.insert(vocabulary).values({
      id,
      lemma,
      partOfSpeech,
      meaningEn: suggestion.meaningEn.trim(),
      gender:
        partOfSpeech === "noun" &&
        suggestion.gender !== "none"
          ? suggestion.gender
          : null,
      cefrLevel: suggestion.level,
      notes:
        `AI suggestion awaiting review.\n` +
        `Observed form: ${suggestion.word}\n` +
        `Explanation: ${suggestion.explanation}`,
      status: "draft",
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        success: true,
        result: "created",
        status: "draft",
        message: "Saved as a draft for review.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Vocabulary draft error:", error);

    return NextResponse.json(
      { error: "Could not save vocabulary draft." },
      { status: 500 }
    );
  }
}
