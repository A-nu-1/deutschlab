"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import VerbFormsGenerator, {
  type GeneratedVerb,
} from "@/app/admin/review/verb-forms-generator";

type Example = {
  id: string | null;
  sentenceDe: string;
  translationEn: string;
  explanation: string;
};
type Word = {
  id: string;
  lemma: string;
  meaningEn: string;
  partOfSpeech: string;
  cefrLevel: string;
};
type Suggestion = Omit<Example, "id">;
const field =
  "w-full rounded-lg border border-white/10 bg-[#11131f] px-3 py-2 text-white outline-none focus:border-violet-400";
export default function PublishedVocabularyEditor({
  word,
  initialExamples,
  existingForms,
}: {
  word: Word;
  initialExamples: Example[];
  existingForms: number;
}) {
  const router = useRouter();
  const [examples, setExamples] = useState<(Example & { key: string })[]>(
    initialExamples.map((x) => ({ ...x, key: x.id ?? crypto.randomUUID() })),
  );
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [verb, setVerb] = useState<GeneratedVerb | null>(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const returnUrl =
    word.partOfSpeech === "verb"
      ? `/library/verbs/${encodeURIComponent(word.lemma)}`
      : "/library?tab=vocabulary";
  const add = (x: Suggestion) =>
    setExamples((p) => [...p, { ...x, id: null, key: crypto.randomUUID() }]);
  async function generateExamples() {
    setGenerating(true);
    setError("");
    setSuggestions([]);
    try {
      const r = await fetch("/api/ai/vocabulary-examples", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lemma: word.lemma,
          meaningEn: word.meaningEn,
          partOfSpeech: word.partOfSpeech,
          cefrLevel: word.cefrLevel,
          existing: examples.map((x) => x.sentenceDe).slice(0, 30),
        }),
      });
      const data = await r.json();
      if (!r.ok || !data.success)
        throw new Error(data.error || "Generation failed");
      setSuggestions(data.examples);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  }
  async function save() {
    setError("");
    setMessage("");
    if (examples.some((e) => !e.sentenceDe.trim() || !e.translationEn.trim())) {
      setError("Complete German and English sentences first.");
      return;
    }
    if (
      verb &&
      (verb.forms.some((f) => !f.form.trim()) ||
        verb.infinitive.toLocaleLowerCase("de") !==
          word.lemma.toLocaleLowerCase("de"))
    ) {
      setError("Check the verb forms and infinitive.");
      return;
    }
    setSaving(true);
    try {
      const r = await fetch(
        `/api/admin/published-vocabulary/${encodeURIComponent(word.id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            examples: examples.map(
              ({ id, sentenceDe, translationEn, explanation }) => ({
                id,
                sentenceDe,
                translationEn,
                explanation,
              }),
            ),
            verbData: verb
              ? {
                  infinitive: verb.infinitive,
                  auxiliary: verb.auxiliary,
                  forms: verb.forms,
                }
              : null,
          }),
        },
      );
      const data = await r.json();
      if (!r.ok || !data.success) throw new Error(data.error || "Save failed");
      setMessage(data.message);
      router.push(returnUrl);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }
  return (
    <main className="min-h-screen bg-[#11131f] px-5 py-8 text-white">
      <div className="mx-auto max-w-5xl space-y-6">
        <Link href={returnUrl} className="text-sm text-violet-300">
          ← Back to library
        </Link>
        <header className="rounded-2xl border border-violet-500/20 bg-[#1c2030] p-6">
          <h1 className="text-3xl font-bold text-violet-300">
            Edit: {word.lemma}
          </h1>
          <p className="mt-2 text-slate-300">
            {word.meaningEn} · {word.partOfSpeech} · {word.cefrLevel}
          </p>
          <p className="mt-2 text-xs text-amber-300">
            Development admin only · Review all AI content before saving
          </p>
        </header>
        <section className="space-y-4 rounded-2xl border border-white/10 bg-[#1c2030] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">
              Vocabulary Examples ({examples.length})
            </h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() =>
                  add({ sentenceDe: "", translationEn: "", explanation: "" })
                }
                className="rounded-lg bg-white/10 px-3 py-2 text-sm"
              >
                + Manual
              </button>
              <button
                type="button"
                disabled={generating}
                onClick={() => void generateExamples()}
                className="rounded-lg bg-violet-500/20 px-3 py-2 text-sm text-violet-300 disabled:opacity-50"
              >
                {generating ? "Generating..." : "✨ Generate 3"}
              </button>
            </div>
          </div>
          {suggestions.map((s, i) => (
            <div
              key={`${s.sentenceDe}-${i}`}
              className="space-y-2 rounded-lg border border-violet-500/20 p-4"
            >
              <p>{s.sentenceDe}</p>
              <p className="text-sm text-slate-300">{s.translationEn}</p>
              <p className="text-xs text-slate-400">{s.explanation}</p>
              <button
                type="button"
                onClick={() => {
                  add(s);
                  setSuggestions((p) => p.filter((_, j) => j !== i));
                }}
                className="text-sm text-emerald-300"
              >
                + Add to editor
              </button>
            </div>
          ))}
          {examples.map((e, i) => (
            <div key={e.key} className="space-y-3 rounded-lg bg-[#11131f] p-4">
              <div className="flex justify-between">
                <strong className="text-violet-300">Example {i + 1}</strong>
                {e.id === null && (
                  <button
                    type="button"
                    className="text-sm text-red-300"
                    onClick={() =>
                      setExamples((p) => p.filter((x) => x.key !== e.key))
                    }
                  >
                    Remove unsaved
                  </button>
                )}
              </div>
              {(["sentenceDe", "translationEn", "explanation"] as const).map(
                (k) => (
                  <label key={k} className="block space-y-1">
                    <span className="text-xs text-slate-400">
                      {k === "sentenceDe"
                        ? "German sentence"
                        : k === "translationEn"
                          ? "English translation"
                          : "Usage explanation"}
                    </span>
                    <textarea
                      rows={2}
                      className={field}
                      value={e[k]}
                      onChange={(ev) =>
                        setExamples((p) =>
                          p.map((x) =>
                            x.key === e.key
                              ? { ...x, [k]: ev.target.value }
                              : x,
                          ),
                        )
                      }
                    />
                  </label>
                ),
              )}
            </div>
          ))}
        </section>
        {word.partOfSpeech === "verb" && (
          <section className="space-y-3 rounded-2xl border border-emerald-500/20 bg-[#1c2030] p-5">
            <h2 className="text-xl font-semibold text-emerald-300">
              Verb Conjugations · {existingForms}/36 saved
            </h2>
            <p className="text-sm text-slate-400">
              Existing forms will never be overwritten. Generate a full table
              and save only missing tense/person combinations. Review carefully
              before saving.
            </p>
            <VerbFormsGenerator
              lemma={word.lemma}
              meaningEn={word.meaningEn}
              cefrLevel={word.cefrLevel}
              onChange={setVerb}
            />
          </section>
        )}
        {error && (
          <p role="alert" className="text-red-300">
            {error}
          </p>
        )}
        {message && <p className="text-emerald-300">{message}</p>}
        <div className="flex gap-3">
          <button
            type="button"
            disabled={saving || generating}
            onClick={() => void save()}
            className="rounded-xl bg-violet-600 px-6 py-3 font-semibold disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save reviewed changes"}
          </button>
          <Link
            href={returnUrl}
            className="rounded-xl border border-white/10 px-6 py-3"
          >
            Cancel
          </Link>
        </div>
      </div>
    </main>
  );
}
