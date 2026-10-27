
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { grammarRules } from "@/db/schema";
import { isLocalAdminRequest } from "@/lib/admin/local-admin";
import {
  matchExistingGrammar,
} from "@/lib/grammar/match-grammar-rule";
import { and } from "drizzle-orm";

export const runtime = "nodejs";

const suggestionSchema = z.object({
  title: z.string().trim().min(3).max(200),
  explanationEn: z.string().trim().min(10).max(5000),
  exampleFromText: z.string().trim().max(1000),
  suggestedLevel: z.enum(["A1", "A2", "B1", "B2", "C1"]),
});

export async function POST(request: NextRequest) {
  if (!isLocalAdminRequest(request)) {
    return NextResponse.json(
      { error: "Not authorized." },
      { status: 403 }
    );
  }

  try {
    const body: unknown = await request.json();
    const parsed = suggestionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid grammar suggestion." },
        { status: 400 }
      );
    }

    const suggestion = parsed.data;

    const existingSlug =
      matchExistingGrammar(suggestion);

    if (existingSlug) {
      const [existing] = await db
        .select({
          slug: grammarRules.slug,
          status: grammarRules.status,
        })
        .from(grammarRules)
        .where(eq(grammarRules.slug, existingSlug))
        .limit(1);

      if (existing) {
        return NextResponse.json({
          success: true,
          result: "existing",
          slug: existing.slug,
          status: existing.status,
          message: "Related grammar lesson already exists.",
        });
      }
    }

    // Prevent exact duplicate draft titles.
    const allRules = await db
      .select({
        slug: grammarRules.slug,
        title: grammarRules.title,
        status: grammarRules.status,
      })
      .from(grammarRules);

    const normalizedTitle =
      suggestion.title.toLocaleLowerCase("de").trim();

    const duplicate = allRules.find(
      (rule) =>
        rule.title.toLocaleLowerCase("de").trim() ===
        normalizedTitle
    );

    if (duplicate) {
      return NextResponse.json({
        success: true,
        result: "existing",
        slug: duplicate.slug,
        status: duplicate.status,
        message: "This grammar title already exists.",
      });
    }

    const id = crypto.randomUUID();

    // Each draft gets a unique technical slug.
    // We can choose a descriptive one during review.
    const slug = `draft-${id}`;

    await db.insert(grammarRules).values({
      id,
      slug,
      title: suggestion.title,
      category: "ai-discovery",
      cefrLevel: suggestion.suggestedLevel,
      explanationEn: suggestion.explanationEn,
      explanationDe: null,
      notes:
        "AI-generated grammar draft. Verify before publishing.\n" +
        `Example from analyzed text: ${suggestion.exampleFromText}`,
      status: "draft",
      sourceType: "ai",
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        success: true,
        result: "created",
        message: "Grammar draft saved for review.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Grammar draft save failed:", error);

    return NextResponse.json(
      { error: "Could not save grammar draft." },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  if (!isLocalAdminRequest(request)) {
    return NextResponse.json(
      { error: "Not authorized." },
      { status: 403 },
    );
  }

  const drafts = await db
    .select()
    .from(grammarRules)
    .where(eq(grammarRules.status, "draft"))
    .orderBy(grammarRules.title);

  return NextResponse.json({
    success: true,
    drafts,
  });
}

 
const reviewSchema = z.object({
  id: z.string().min(1),
  action: z.enum(["publish", "reject"]),
  title: z.string().trim().min(3).max(200),
  explanationEn: z.string().trim().min(10).max(5000),
  cefrLevel: z.enum(["A1", "A2", "B1", "B2", "C1"]),
});

export async function PATCH(request: NextRequest) {
  if (!isLocalAdminRequest(request)) {
    return NextResponse.json(
      { error: "Not authorized." },
      { status: 403 }
    );
  }

  const parsed = reviewSchema.safeParse(
    await request.json().catch(() => null)
  );

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid review data." },
      { status: 400 }
    );
  }

  const data = parsed.data;

  if (data.action === "publish") {
    const possibleMatch = matchExistingGrammar({
      title: data.title,
      explanationEn: data.explanationEn,
      exampleFromText: "",
      suggestedLevel: data.cefrLevel,
    });

    if (possibleMatch) {
      const [existing] = await db
        .select({ id: grammarRules.id })
        .from(grammarRules)
        .where(
          and(
            eq(grammarRules.slug, possibleMatch),
            eq(grammarRules.status, "published")
          )
        )
        .limit(1);

      if (existing && existing.id !== data.id) {
        return NextResponse.json(
          {
            error:
              "A related published lesson already exists. " +
              "Review it instead of creating a duplicate.",
          },
          { status: 409 }
        );
      }
    }
  }

  const [updated] = await db
    .update(grammarRules)
    .set({
      title: data.title,
      explanationEn: data.explanationEn,
      cefrLevel: data.cefrLevel,
      status:
        data.action === "publish"
          ? "published"
          : "rejected",
    })
    .where(
      and(
        eq(grammarRules.id, data.id),
        eq(grammarRules.status, "draft")
      )
    )
    .returning({ id: grammarRules.id });

  if (!updated) {
    return NextResponse.json(
      { error: "Draft has already been reviewed." },
      { status: 409 }
    );
  }

  return NextResponse.json({
    success: true,
    message:
      data.action === "publish"
        ? "Grammar rule published."
        : "Grammar draft rejected.",
  });
}
