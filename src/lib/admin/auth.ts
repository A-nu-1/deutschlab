import "server-only";

import {
  createHash,
  createHmac,
  timingSafeEqual,
} from "node:crypto";

export const OWNER_SESSION_COOKIE = "deutschlab_owner_session";

const SESSION_DURATION_SECONDS = 8 * 60 * 60;

function getSessionSecret(): string | null {
  const secret = process.env.DEUTSCHLAB_ADMIN_SESSION_SECRET;

  if (!secret || secret.length < 32) {
    return null;
  }

  return secret;
}

function signExpiry(expiry: string): string | null {
  const secret = getSessionSecret();

  if (!secret) return null;

  return createHmac("sha256", secret)
    .update(`deutschlab-owner:${expiry}`)
    .digest("base64url");
}

function safeStringEqual(a: string, b: string): boolean {
  const hashA = createHash("sha256").update(a).digest();
  const hashB = createHash("sha256").update(b).digest();

  return timingSafeEqual(hashA, hashB);
}

export function verifyOwnerPassword(password: string): boolean {
  const expected = process.env.DEUTSCHLAB_OWNER_PASSWORD;

  if (!expected || !getSessionSecret()) {
    return false;
  }

  return safeStringEqual(password, expected);
}

export function createOwnerSession(): string | null {
  const expiry = String(
    Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS,
  );

  const signature = signExpiry(expiry);

  if (!signature) return null;

  return `${expiry}.${signature}`;
}

export function isOwnerSessionValid(
  token: string | undefined,
): boolean {
  if (!token) return false;

  const separator = token.indexOf(".");

  if (separator < 1) return false;

  const expiry = token.slice(0, separator);
  const signature = token.slice(separator + 1);

  if (!/^\d+$/.test(expiry) || !signature) {
    return false;
  }

  const expiryNumber = Number(expiry);

  if (
    !Number.isSafeInteger(expiryNumber) ||
    expiryNumber <= Math.floor(Date.now() / 1000)
  ) {
    return false;
  }

  const expectedSignature = signExpiry(expiry);

  if (!expectedSignature) return false;

  return safeStringEqual(signature, expectedSignature);
}

export function isOwnerRequest(request: Request): boolean {
  const cookieHeader = request.headers.get("cookie") ?? "";

  const token = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) =>
      part.startsWith(`${OWNER_SESSION_COOKIE}=`),
    )
    ?.slice(OWNER_SESSION_COOKIE.length + 1);

  return isOwnerSessionValid(token);
}

export function ownerCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  };
}

export function expiredOwnerCookieOptions() {
  return {
    ...ownerCookieOptions(),
    maxAge: 0,
    expires: new Date(0),
  };
}