"use client";

import { useCallback, useEffect, useState } from "react";
import VerbFormsGenerator, { type GeneratedVerb } from "./verb-forms-generator";

type Gender = "masculine" | "feminine" | "neuter" | "none";

type Draft = {
  id: string;
  lemma: string;
  meaningEn: string;
  partOfSpeech: string;
  cefrLevel: string;
  gender: Gender | null;
  plural: string | null;
  notes: string | null;
  status: string;
};

const inputClass =
  "w-full rounded-lg border border-white/10 " +
  "bg-[#11131f] px-3 py-2 text-white " +
  "outline-none focus:border-violet-400";

const genderClasses: Record<Gender, string> = {
  masculine: "text-blue-400",
  feminine: "text-pink-400",
  neuter: "text-yellow-400",
  none: "text-violet-300",
};

const articles: Record<Gender, string> = {
  masculine: "der",
  feminine: "die",
  neuter: "das",
  none: "",
};

export default function ReviewClient() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [generatedVerbs, setGeneratedVerbs] = useState<
    Record<string, GeneratedVerb>
  >({});
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadDrafts = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/vocabulary", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Could not load drafts.");
      }

      setDrafts(data.drafts);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/admin/vocabulary", {
      cache: "no-store",
    })
      .then(async (response) => {
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Could not load drafts.");
        }

        return data.drafts as Draft[];
      })
      .then((items) => {
        if (!cancelled) setDrafts(items);
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setError(
            error instanceof Error ? error.message : "Could not load drafts.",
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

function updateDraft(id: string, updates: Partial<Draft>) {
  if (
    "lemma" in updates ||
    "meaningEn" in updates ||
    "cefrLevel" in updates ||
    "partOfSpeech" in updates
  ) {
    setGeneratedVerbs((previous) => {
      const next = { ...previous };
      delete next[id];
      return next;
    });
  }

  setDrafts((previous) =>
    previous.map((draft) =>
      draft.id === id ? { ...draft, ...updates } : draft
    )
  );
}

 async function review(draft: Draft, action: "publish" | "reject") {
  if (busyId) return;

  if (
    action === "publish" &&
    draft.partOfSpeech === "verb" &&
    !generatedVerbs[draft.id]
  ) {
    setError(
      "Generate and review the verb conjugations before publishing."
    );
    return;
  }

  const confirmed = window.confirm(
      action === "publish"
        ? `Publish "${draft.lemma}" to the public library?`
        : `Reject "${draft.lemma}"?`,
    );

    if (!confirmed) return;

    setBusyId(draft.id);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/admin/vocabulary", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: draft.id,
          action,
          lemma: draft.lemma,
          meaningEn: draft.meaningEn,
          partOfSpeech: draft.partOfSpeech,
          cefrLevel: draft.cefrLevel,
          gender: draft.gender || "none",
          plural: draft.plural,
          notes: draft.notes,
          verbData:
            action === "publish" && draft.partOfSpeech === "verb"
              ? (generatedVerbs[draft.id] ?? null)
              : null,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Review failed.");
      }

      setDrafts((previous) => previous.filter((item) => item.id !== draft.id));

     

      setMessage(result.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not review draft.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#1c2030] p-5">
        <div>
          <p className="text-sm text-slate-400">Pending vocabulary reviews</p>
          <p className="mt-1 text-3xl font-bold text-violet-300">
            {drafts.length}
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadDrafts()}
          disabled={loading || busyId !== null}
          className="rounded-xl bg-violet-500/15 px-4 py-2 text-sm text-violet-300 hover:bg-violet-500/25 disabled:opacity-50"
        >
          ↻ Refresh
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300"
        >
          {error}
        </div>
      )}

      {message && (
        <div
          role="status"
          className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300"
        >
          {message}
        </div>
      )}

      {loading ? (
        <p className="text-slate-400">Loading vocabulary drafts...</p>
      ) : drafts.length === 0 && !error ? (
        <div className="rounded-2xl border border-white/10 bg-[#1c2030] p-10 text-center">
          <p className="text-xl font-semibold text-emerald-300">
            All caught up!
          </p>
          <p className="mt-2 text-sm text-slate-400">
            There are no pending vocabulary drafts.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {drafts.map((draft) => {
            const gender = draft.gender || "none";

            return (
              <article
                key={draft.id}
                className="space-y-5 rounded-2xl border border-violet-500/20 bg-[#1c2030] p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className={`text-xl font-bold ${genderClasses[gender]}`}>
                    {draft.partOfSpeech === "noun"
                      ? `${articles[gender]} `
                      : ""}
                    {draft.lemma}
                  </h2>
                  <p className="mt-1 text-xs font-normal text-slate-400">
                    {draft.partOfSpeech.toUpperCase()} · {draft.cefrLevel}
                  </p>
                  <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs text-amber-300">
                    Draft
                  </span>
                </div>

                <div className="space-y-4">
                  <Field label="German lemma">
                    <input
                      className={inputClass}
                      value={draft.lemma}
                      onChange={(e) =>
                        updateDraft(draft.id, {
                          lemma: e.target.value,
                        })
                      }
                    />
                  </Field>

                  <Field label="English meaning">
                    <textarea
                      className={inputClass}
                      rows={2}
                      value={draft.meaningEn}
                      onChange={(e) =>
                        updateDraft(draft.id, {
                          meaningEn: e.target.value,
                        })
                      }
                    />
                  </Field>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Part of speech">
                      <select
                        className={inputClass}
                        value={draft.partOfSpeech}
                        onChange={(e) => {
                          const partOfSpeech = e.target.value;

                          updateDraft(draft.id, {
                            partOfSpeech,
                            gender:
                              partOfSpeech === "noun" ? draft.gender : null,
                            plural:
                              partOfSpeech === "noun" ? draft.plural : null,
                          });
                        }}
                      >
                        {[
                          "noun",
                          "verb",
                          "adjective",
                          "adverb",
                          "conjunction",
                          "preposition",
                          "pronoun",
                          "expression",
                        ].map((value) => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label="CEFR level">
                      <select
                        className={inputClass}
                        value={draft.cefrLevel}
                        onChange={(e) =>
                          updateDraft(draft.id, {
                            cefrLevel: e.target.value,
                          })
                        }
                      >
                        {["A1", "A2", "B1", "B2", "C1"].map((value) => (
                          <option key={value}>{value}</option>
                        ))}
                      </select>
                    </Field>

                    {draft.partOfSpeech === "noun" && (
                      <>
                        <Field label="Noun gender">
                          <select
                            className={inputClass}
                            value={draft.gender || "none"}
                            onChange={(e) =>
                              updateDraft(draft.id, {
                                gender: e.target.value as Gender,
                              })
                            }
                          >
                            <option value="none">
                              Select grammatical gender
                            </option>
                            <option value="masculine">der — Masculine</option>
                            <option value="feminine">die — Feminine</option>
                            <option value="neuter">das — Neuter</option>
                          </select>
                        </Field>

                        <Field label="Plural form">
                          <input
                            className={inputClass}
                            value={draft.plural || ""}
                            onChange={(e) =>
                              updateDraft(draft.id, {
                                plural: e.target.value,
                              })
                            }
                            placeholder="e.g. Voraussetzungen"
                          />
                        </Field>
                      </>
                    )}

                    {draft.partOfSpeech === "verb" && (
                      <div className="sm:col-span-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                        <h3 className="font-semibold text-emerald-300">
                          Verb · Zeitformen
                        </h3>

                        <p className="mt-2 text-sm leading-6 text-slate-300">
                          Check the infinitive and English meaning before
                          publication. We will maintain auxiliary verbs,
                          separable prefixes, participles and conjugations as
                          structured verb data.
                        </p>

                        <p className="mt-3 text-xs text-slate-400">
                          Example: ablehnen → lehnte ab → hat abgelehnt
                        </p>
                        <div className="mt-5 border-t border-emerald-500/20 pt-4">
                          <VerbFormsGenerator
                            key={`${draft.lemma}:${draft.meaningEn}:${draft.cefrLevel}`}
                            lemma={draft.lemma}
                            meaningEn={draft.meaningEn}
                            cefrLevel={draft.cefrLevel}
                            onChange={(data) => {
                              setGeneratedVerbs((previous) => {
                                const next = { ...previous };

                                if (data) {
                                  next[draft.id] = data;
                                } else {
                                  delete next[draft.id];
                                }

                                return next;
                              });
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {draft.partOfSpeech === "adjective" && (
                      <div className="sm:col-span-2 rounded-xl border border-sky-500/20 bg-sky-500/5 p-4">
                        <h3 className="font-semibold text-sky-300">
                          Adjektiv · Adjective
                        </h3>

                        <p className="mt-2 text-sm leading-6 text-slate-300">
                          Verify the base adjective and its meaning.
                          Comparative, superlative and related examples will be
                          stored separately when we extend our vocabulary
                          schema.
                        </p>
                      </div>
                    )}

                    {!["noun", "verb", "adjective"].includes(
                      draft.partOfSpeech,
                    ) && (
                      <div className="sm:col-span-2 rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
                        <h3 className="font-semibold text-violet-300">
                          Other word type
                        </h3>

                        <p className="mt-2 text-sm text-slate-300">
                          Review the meaning, word class and usage notes.
                          Grammatical gender and noun plural are not applicable
                          to this entry.
                        </p>
                      </div>
                    )}
                  </div>

                  <Field label="Review notes / AI explanation">
                    <textarea
                      className={inputClass}
                      rows={4}
                      value={draft.notes || ""}
                      onChange={(e) =>
                        updateDraft(draft.id, {
                          notes: e.target.value,
                        })
                      }
                    />
                  </Field>
                </div>

                <div className="flex flex-wrap gap-3 border-t border-white/10 pt-5">
                  <button
                    type="button"
                    onClick={() => void review(draft, "publish")}
                    disabled={busyId !== null}
                    className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
                  >
                    {busyId === draft.id ? "Saving..." : "✓ Approve & Publish"}
                  </button>

                  <button
                    type="button"
                    onClick={() => void review(draft, "reject")}
                    disabled={busyId !== null}
                    className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-300 hover:bg-red-500/20 disabled:opacity-50"
                  >
                    ✕ Reject
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-xs font-medium text-slate-400">{label}</span>
      {children}
    </label>
  );
}
