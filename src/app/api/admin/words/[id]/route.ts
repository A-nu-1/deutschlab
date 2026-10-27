
import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { vocabulary } from "@/db/schema";
import { isLocalAdminRequest } from "@/lib/admin/local-admin";

export const runtime = "nodejs";

const editSchema = z.object({
  meaningEn: z.string().trim().min(1).max(1000),
  meaningDe: z.string().trim().max(1000),
  cefrLevel: z.enum(["A1", "A2", "B1", "B2", "C1"]),
  plural: z.string().trim().max(120),
  genitive: z.string().trim().max(120),
  notes: z.string().max(3000),
});

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (!isLocalAdminRequest(request)) {
    return NextResponse.json(
      { error: "Not authorized." },
      { status: 403 }
    );
  }

 const { id: encodedId } = await context.params;

let id: string;

try {
  id = decodeURIComponent(encodedId);
} catch {
  return NextResponse.json(
    { error: "Invalid word ID." },
    { status: 400 }
  );
}

  const body: unknown = await request.json().catch(() => null);
  const parsed = editSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid word details." },
      { status: 400 }
    );
  }

  try {
    const data = parsed.data;

    const [updated] = await db
      .update(vocabulary)
      .set({
        meaningEn: data.meaningEn,
        meaningDe: data.meaningDe || null,
        cefrLevel: data.cefrLevel,
        plural: data.plural || null,
        genitive: data.genitive || null,
        notes: data.notes || null,
      })
      .where(
        and(
          eq(vocabulary.id, id),
          eq(vocabulary.partOfSpeech, "noun"),
          eq(vocabulary.status, "published")
        )
      )
      .returning({ id: vocabulary.id });

    if (!updated) {
      return NextResponse.json(
        { error: "Published noun not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Vocabulary updated successfully.",
    });
  } catch (error) {
    console.error("Vocabulary update failed:", error);

    return NextResponse.json(
      { error: "Could not update vocabulary." },
      { status: 500 }
    );
  }
}
