import "server-only";

import { isOwnerRequest } from "@/lib/admin/auth";

/**
 * Backward-compatible name for existing API routes.
 * Authorization now depends on a valid owner session,
 * not the development environment or request origin alone.
 */
export function isLocalAdminRequest(request: Request): boolean {
  return isOwnerRequest(request);
}