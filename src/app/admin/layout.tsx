import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  isOwnerSessionValid,
  OWNER_SESSION_COOKIE,
} from "@/lib/admin/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const cookieStore = await cookies();

  const token = cookieStore.get(OWNER_SESSION_COOKIE)?.value;

  if (!isOwnerSessionValid(token)) {
    redirect("/owner-login");
  }

  return (
    <>
      <header className="flex items-center justify-between border-b border-white/10 bg-[#11131f] px-5 py-3 text-white">
        <span className="font-semibold text-violet-300">
          DeutschLab · Owner
        </span>

        <form action="/api/admin/auth/logout" method="post">
          <button
            type="submit"
            className="rounded-lg border border-white/10 px-3 py-2 text-sm transition hover:bg-white/5"
          >
            Sign out
          </button>
        </form>
      </header>

      {children}
    </>
  );
}