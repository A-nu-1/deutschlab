import { NextRequest, NextResponse } from "next/server";

import {
  createOwnerSession,
  OWNER_SESSION_COOKIE,
  ownerCookieOptions,
  verifyOwnerPassword,
} from "@/lib/admin/auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");

  if (origin && origin !== new URL(request.url).origin) {
    return NextResponse.json(
      { error: "Request not allowed." },
      { status: 403 },
    );
  }

  const body = await request.json().catch(() => null);

  if (
    !body ||
    typeof body.password !== "string" ||
    body.password.length === 0 ||
    body.password.length > 1024
  ) {
    return NextResponse.json(
      { error: "Enter your owner password." },
      { status: 400 },
    );
  }

  if (!verifyOwnerPassword(body.password)) {
    return NextResponse.json(
      { error: "Incorrect password or authentication is not configured." },
      { status: 401 },
    );
  }

  const token = createOwnerSession();

  if (!token) {
    return NextResponse.json(
      { error: "Authentication is not configured correctly." },
      { status: 503 },
    );
  }

  const response = NextResponse.json({ success: true });

  response.cookies.set(
    OWNER_SESSION_COOKIE,
    token,
    ownerCookieOptions(),
  );

  return response;
}