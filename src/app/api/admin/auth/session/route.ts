import { NextResponse } from "next/server";
import { isOwnerRequest } from "@/lib/admin/auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  return NextResponse.json(
    { authenticated: isOwnerRequest(request) },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}