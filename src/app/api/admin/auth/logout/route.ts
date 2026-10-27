import { NextRequest, NextResponse } from "next/server";

import {
  expiredOwnerCookieOptions,
  OWNER_SESSION_COOKIE,
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

  const response = NextResponse.redirect(
    new URL("/owner-login", request.url),
    303,
  );

  response.cookies.set(
    OWNER_SESSION_COOKIE,
    "",
    expiredOwnerCookieOptions(),
  );

  return response;
}