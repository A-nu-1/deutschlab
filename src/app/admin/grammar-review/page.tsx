"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Draft = {
  id: string;
  title: string;
  explanationEn: string;
  cefrLevel: string;
  notes: string | null;
};

export default function GrammarReviewPage() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/admin/grammar-drafts", {
        cache: "no-store",
      });

      const contentType = response.headers.get("content-type") ?? "";

      if (!contentType.includes("application/json")) {
        throw new Error(
          `Grammar API returned HTTP ${response.status} instead of JSON. ` +
            "Check src/app/api/admin/grammar-drafts/route.ts.",
        );
      }

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Cannot load grammar drafts.");
      }

      if (!Array.isArray(data.drafts)) {
        throw new Error("Unexpected grammar API response.");
      }

      setDrafts(data.drafts);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Load failed.");
    } finally {
      setLoading(false);
    }
  }, []);

 useEffect(() => {
  let cancelled = false;

  fetch("/api/admin/grammar-drafts", {
    cache: "no-store",
  })
    .then(async (response) => {
      if (
        !response.headers
          .get("content-type")
          ?.includes("application/json")
      ) {
        throw new Error(
          `Grammar API returned HTTP ${response.status}.`
        );
      }

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Cannot load grammar drafts."
        );
      }

      if (!Array.isArray(data.drafts)) {
        throw new Error("Invalid grammar draft response.");
      }

      return data.drafts as Draft[];
    })
    .then((items) => {
      if (!cancelled) setDrafts(items);
    })
    .catch((error: unknown) => {
      if (!cancelled) {
        setMessage(
          error instanceof Error
            ? error.message
            : "Could not load grammar drafts."
        );
      }
    })
    .finally(() => {
      if (!cancelled) setLoading(false);
    });

  return () => {
    cancelled = true;
  };
}, []);

  function edit(id: string, changes: Partial<Draft>) {
    setDrafts((previous) =>
      previous.map((item) => (item.id === id ? { ...item, ...changes } : item)),
    );
  }

  async function review(draft: Draft, action: "publish" | "reject") {
    if (busy) return;

    if (
      !window.confirm(
        `${action === "publish" ? "Publish" : "Reject"} "${draft.title}"?`,
      )
    ) {
      return;
    }

    setBusy(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/grammar-drafts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: draft.id,
          action,
          title: draft.title,
          explanationEn: draft.explanationEn,
          cefrLevel: draft.cefrLevel,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Review failed.");
      }

      setMessage(data.message);
      setDrafts((previous) => previous.filter((item) => item.id !== draft.id));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Review failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#11131f] px-5 py-8 text-white md:px-12">
      <div className="mx-auto max-w-5xl space-y-6">
        <Link href="/admin/review" className="text-sm text-violet-300">
          ← Vocabulary Review
        </Link>

        <h1 className="text-3xl font-bold">📖 Grammar Review</h1>

        <p className="text-slate-400">
          Review AI-generated grammar lessons before publication.
        </p>

        <button
          onClick={() => void load()}
          className="rounded-lg bg-violet-500/20 px-4 py-2 text-violet-300"
        >
          Refresh
        </button>

        {message && (
          <p role="status" className="text-sm text-amber-300">
            {message}
          </p>
        )}

        {loading ? (
          <p>Loading...</p>
        ) : drafts.length === 0 ? (
          <div className="rounded-xl bg-[#1c2030] p-6 text-emerald-300">
            No pending grammar drafts.
          </div>
        ) : (
          drafts.map((draft) => (
            <section
              key={draft.id}
              className="space-y-4 rounded-2xl border border-violet-500/20 bg-[#1c2030] p-5"
            >
              <label className="block text-sm text-slate-300">
                Lesson title
                <input
                  value={draft.title}
                  onChange={(e) => edit(draft.id, { title: e.target.value })}
                  className="mt-2 w-full rounded-lg bg-[#11131f] p-3 text-white"
                />
              </label>

              <label className="block text-sm text-slate-300">
                English explanation
                <textarea
                  rows={6}
                  value={draft.explanationEn}
                  onChange={(e) =>
                    edit(draft.id, {
                      explanationEn: e.target.value,
                    })
                  }
                  className="mt-2 w-full rounded-lg bg-[#11131f] p-3 text-white"
                />
              </label>

              <label className="block text-sm text-slate-300">
                CEFR level
                <select
                  value={draft.cefrLevel}
                  onChange={(e) =>
                    edit(draft.id, {
                      cefrLevel: e.target.value,
                    })
                  }
                  className="ml-3 rounded-lg bg-[#11131f] p-2 text-white"
                >
                  {["A1", "A2", "B1", "B2", "C1"].map((level) => (
                    <option key={level}>{level}</option>
                  ))}
                </select>
              </label>

              {draft.notes && (
                <p className="whitespace-pre-wrap rounded-lg bg-[#11131f] p-3 text-xs text-slate-400">
                  {draft.notes}
                </p>
              )}

              <div className="flex flex-wrap gap-3">
                <button
                  disabled={busy}
                  onClick={() => void review(draft, "publish")}
                  className="rounded-lg bg-emerald-600 px-4 py-2 disabled:opacity-50"
                >
                  ✓ Publish
                </button>

                <button
                  disabled={busy}
                  onClick={() => void review(draft, "reject")}
                  className="rounded-lg bg-red-500/20 px-4 py-2 text-red-300 disabled:opacity-50"
                >
                  ✕ Reject
                </button>
              </div>
            </section>
          ))
        )}
      </div>
    </main>
  );
}
