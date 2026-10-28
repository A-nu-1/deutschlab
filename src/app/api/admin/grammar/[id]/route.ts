
import { NextRequest, NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import {
  grammarRules,
  examples,
  exampleGrammar,
  grammarExceptions,
} from "@/db/schema";
import { isLocalAdminRequest } from "@/lib/admin/local-admin";

export const runtime = "nodejs";

const exampleSchema = z.object({
  id: z.string().nullable(),
  sentenceDe: z.string().trim().min(1).max(2000),
  translationEn: z.string().trim().max(2000),
  explanation: z.string().trim().max(2000),
});

const exceptionSchema = z.object({
  id: z.string().nullable(),
  title: z.string().trim().min(1).max(200),
  explanation: z.string().trim().min(1).max(3000),
  exampleDe: z.string().trim().max(2000),
  exampleEn: z.string().trim().max(2000),
});

const updateSchema = z.object({
  title: z.string().trim().min(3).max(200),
  titleDe: z.string().trim().max(200),
  explanationEn: z.string().trim().min(10).max(10000),
  explanationDe: z.string().trim().max(10000),
  cefrLevel: z.enum(["A1", "A2", "B1", "B2", "C1"]),
  examples: z.array(exampleSchema).max(100),
  exceptions: z.array(exceptionSchema).max(100),
});

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  if (!isLocalAdminRequest(request)) {
    return NextResponse.json(
      { error: "Not authorized." },
      { status: 403 },
    );
  }

  const { id: encodedId } = await context.params;

  let id: string;

  try {
    id = decodeURIComponent(encodedId);
  } catch {
    return NextResponse.json(
      { error: "Invalid grammar ID." },
      { status: 400 },
    );
  }

  const body: unknown = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid grammar data." },
      { status: 400 },
    );
  }

  const data = parsed.data;

  try {
    const [rule] = await db
      .select({ id: grammarRules.id })
      .from(grammarRules)
      .where(
        and(
          eq(grammarRules.id, id),
          eq(grammarRules.status, "published"),
        ),
      )
      .limit(1);

    if (!rule) {
      return NextResponse.json(
        { error: "Published grammar rule not found." },
        { status: 404 },
      );
    }

    const currentLinks = await db
      .select({ exampleId: exampleGrammar.exampleId })
      .from(exampleGrammar)
      .where(eq(exampleGrammar.ruleId, id));

    const ownedIds = new Set(
      currentLinks.map((item) => item.exampleId),
    );

    const submittedIds = data.examples
      .map((example) => example.id)
      .filter((value): value is string => value !== null);

    if (
      submittedIds.some((exampleId) => !ownedIds.has(exampleId)) ||
      new Set(submittedIds).size !== submittedIds.length
    ) {
      return NextResponse.json(
        { error: "Invalid or duplicate example ID." },
        { status: 400 },
      );
    }

    const currentExceptions = await db
      .select({ id: grammarExceptions.id })
      .from(grammarExceptions)
      .where(eq(grammarExceptions.ruleId, id));

    const ownedExceptionIds = new Set(
      currentExceptions.map((item) => item.id),
    );

    const submittedExceptionIds = data.exceptions
      .map((item) => item.id)
      .filter((value): value is string => value !== null);

    if (
      submittedExceptionIds.some(
        (exceptionId) => !ownedExceptionIds.has(exceptionId),
      ) ||
      new Set(submittedExceptionIds).size !== submittedExceptionIds.length
    ) {
      return NextResponse.json(
        { error: "Invalid or duplicate exception ID." },
        { status: 400 },
      );
    }

    await db.transaction(async (tx) => {
      await tx
        .update(grammarRules)
        .set({
          title: data.title,
          titleDe: data.titleDe || null,
          explanationEn: data.explanationEn,
          explanationDe: data.explanationDe || null,
          cefrLevel: data.cefrLevel,
        })
        .where(eq(grammarRules.id, id));

      const retainedExampleIds: string[] = [];

      for (const example of data.examples) {
        let exampleId = example.id;

        if (exampleId) {
          // Update the shared sentence itself.
          await tx
            .update(examples)
            .set({
              sentenceDe: example.sentenceDe,
              translationEn: example.translationEn,
              explanation: example.explanation || null,
              cefrLevel: data.cefrLevel,
            })
            .where(eq(examples.id, exampleId));
        } else {
          // Create a new shared sentence.
          exampleId = crypto.randomUUID();

          await tx.insert(examples).values({
            id: exampleId,
            sentenceDe: example.sentenceDe,
            translationEn: example.translationEn,
            explanation: example.explanation || null,
            cefrLevel: data.cefrLevel,
            status: "published",
            sourceType: "manual",
            createdAt: new Date().toISOString(),
          });

          await tx.insert(exampleGrammar).values({
            exampleId,
            ruleId: id,
          });
        }

        retainedExampleIds.push(exampleId);
      }

      // Remove this rule's links to examples removed in the editor.
      // Do not delete the shared example records themselves.
      const removedIds = [...ownedIds].filter(
        (exampleId) => !retainedExampleIds.includes(exampleId),
      );

      if (removedIds.length > 0) {
        await tx
          .delete(exampleGrammar)
          .where(
            and(
              eq(exampleGrammar.ruleId, id),
              inArray(exampleGrammar.exampleId, removedIds),
            ),
          );
      }

      for (const item of data.exceptions) {
        const values = {
          title: item.title,
          explanation: item.explanation,
          exampleDe: item.exampleDe || null,
          exampleEn: item.exampleEn || null,
        };

        if (item.id) {
          await tx
            .update(grammarExceptions)
            .set(values)
            .where(
              and(
                eq(grammarExceptions.id, item.id),
                eq(grammarExceptions.ruleId, id),
              ),
            );
        } else {
          await tx.insert(grammarExceptions).values({
            id: crypto.randomUUID(),
            ruleId: id,
            ...values,
          });
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: "Grammar lesson and examples saved.",
    });
  } catch (error) {
    console.error("Grammar update failed:", error);

    return NextResponse.json(
      { error: "Could not save grammar changes." },
      { status: 500 },
    );
  }
}
