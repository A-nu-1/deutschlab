import { notFound } from "next/navigation";
import Link from "next/link";
import ReviewClient from "./review-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default function AdminReviewPage() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#11131f] px-5 py-8 text-white md:px-12">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/"
          className="text-sm text-violet-300 hover:text-violet-200"
        >
          ← Back to DeutschLab
        </Link>

        <div className="mt-8 mb-8">
          <h1 className="text-3xl font-bold">
            🛡️ Vocabulary Review
          </h1>

          <p className="mt-3 text-slate-400">
            Review AI discoveries before adding them
            to our permanent German library.
          </p>
        </div>

        <ReviewClient />
      </div>
    </main>
  );
}