"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import SpeakButton from "@/app/library/rules/[slug]/speak-button";
import AIExampleGenerator from "./ai-example-generator";

type Example = {
  id: string | null;
  sentenceDe: string;
  translationEn: string;
  explanation: string;
};
type Exception = {
  id: string | null;
  title: string;
  explanation: string;
  exampleDe: string;
  exampleEn: string;
};

type Rule = {
  id: string;
  slug: string;
  title: string;
  titleDe: string;
  explanationEn: string;
  explanationDe: string;
  cefrLevel: string;
};

type Props = {
  rule: Rule;
  initialExamples: Example[];
  initialExceptions: Exception[];
};

const inputClass =
  "w-full rounded-xl border border-white/10 " +
  "bg-[#11131f] px-4 py-3 text-white " +
  "outline-none focus:border-violet-400";

export default function GrammarEditor({
  rule,
  initialExamples,
  initialExceptions,
}: Props) {
  const router = useRouter();

  const [form, setForm] = useState({
    title: rule.title,
    titleDe: rule.titleDe,
    explanationEn: rule.explanationEn,
    explanationDe: rule.explanationDe,
    cefrLevel: rule.cefrLevel,
  });

  // Local keys let us edit multiple newly added examples
  // before any database IDs have been assigned.
  const [examples, setExamples] = useState<(Example & { localKey: string })[]>(
    initialExamples.map((example) => ({
      ...example,
      localKey: example.id ?? crypto.randomUUID(),
    })),
  );
  const [exceptions, setExceptions] = useState<
    (Exception & { localKey: string })[]
  >(
    initialExceptions.map((item) => ({
      ...item,
      localKey: item.id ?? crypto.randomUUID(),
    })),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const returnUrl = `/library/rules/${rule.slug}`;

  function updateField(field: keyof typeof form, value: string) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }
  function addGeneratedExample(example: {
    sentenceDe: string;
    translationEn: string;
    explanation: string;
  }) {
    setExamples((previous) => [
      ...previous,
      {
        id: null,
        localKey: crypto.randomUUID(),
        ...example,
      },
    ]);
  }
  function addExample() {
    setExamples((previous) => [
      ...previous,
      {
        id: null,
        localKey: crypto.randomUUID(),
        sentenceDe: "",
        translationEn: "",
        explanation: "",
      },
    ]);
  }
  function addException() {
    setExceptions((previous) => [
      ...previous,
      {
        id: null,
        localKey: crypto.randomUUID(),
        title: "",
        explanation: "",
        exampleDe: "",
        exampleEn: "",
      },
    ]);
  }

  function editException(
    key: string,
    field: "title" | "explanation" | "exampleDe" | "exampleEn",
    value: string,
  ) {
    setExceptions((previous) =>
      previous.map((item) =>
        item.localKey === key ? { ...item, [field]: value } : item,
      ),
    );
  }

  function removeNewException(key: string) {
    setExceptions((previous) =>
      previous.filter((item) => item.localKey !== key || item.id !== null),
    );
  }
  function editExample(
    key: string,
    field: "sentenceDe" | "translationEn" | "explanation",
    value: string,
  ) {
    setExamples((previous) =>
      previous.map((example) =>
        example.localKey === key ? { ...example, [field]: value } : example,
      ),
    );
  }

  function removeNewExample(key: string) {
    setExamples((previous) =>
      previous.filter(
        (example) => example.localKey !== key || example.id !== null,
      ),
    );
  }

  async function save() {
    if (saving) return;

    const incomplete = examples.some((example) => !example.sentenceDe.trim());

    if (incomplete) {
      setError(
        "Every example needs a German sentence. " +
          "Remove unused new examples before saving.",
      );
      return;
    }
    if (
      exceptions.some((item) => !item.title.trim() || !item.explanation.trim())
    ) {
      setError("Every exception needs a title and explanation.");
      return;
    }
    setSaving(true);
    setError("");

    try {
      const response = await fetch(
        `/api/admin/grammar/${encodeURIComponent(rule.id)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...form,
            examples: examples.map(
              ({ id, sentenceDe, translationEn, explanation }) => ({
                id,
                sentenceDe,
                translationEn,
                explanation,
              }),
            ),
            exceptions: exceptions.map(
              ({ id, title, explanation, exampleDe, exampleEn }) => ({
                id,
                title,
                explanation,
                exampleDe,
                exampleEn,
              }),
            ),
          }),
        },
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Grammar save failed.");
      }

      router.push(returnUrl);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not save grammar changes.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-7">
      <Link href={returnUrl} className="text-sm text-violet-300">
        ← Cancel editing
      </Link>

      <header>
        <h1 className="text-3xl font-bold">✏️ Edit Grammar Lesson</h1>
        <p className="mt-2 text-slate-400">
          Improve explanations and add examples to your library.
        </p>
      </header>

      <section className="space-y-5 rounded-2xl border border-violet-500/20 bg-[#1c2030] p-6">
        <h2 className="text-xl font-semibold text-violet-300">
          📖 Lesson Information
        </h2>

        <Field label="English title">
          <input
            value={form.title}
            onChange={(e) => updateField("title", e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="German title">
          <input
            value={form.titleDe}
            onChange={(e) => updateField("titleDe", e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="CEFR level">
          <select
            value={form.cefrLevel}
            onChange={(e) => updateField("cefrLevel", e.target.value)}
            className={inputClass}
          >
            {["A1", "A2", "B1", "B2", "C1"].map((level) => (
              <option key={level}>{level}</option>
            ))}
          </select>
        </Field>

        <Field label="English explanation">
          <textarea
            rows={6}
            value={form.explanationEn}
            onChange={(e) => updateField("explanationEn", e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="German explanation">
          <textarea
            rows={6}
            value={form.explanationDe}
            onChange={(e) => updateField("explanationDe", e.target.value)}
            className={inputClass}
          />
        </Field>
      </section>

      <section className="space-y-5 rounded-2xl border border-emerald-500/20 bg-[#1c2030] p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-emerald-300">
              ✨ Grammar Examples ({examples.length})
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Add German sentences, translations and explanations.
            </p>
          </div>

          <button
            type="button"
            onClick={addExample}
            className="rounded-xl bg-emerald-500/15 px-4 py-2 font-medium text-emerald-300 hover:bg-emerald-500/25"
          >
            + Add Example
          </button>
        </div>

        {examples.length === 0 && (
          <p className="rounded-xl bg-[#11131f] p-4 text-sm text-slate-400">
            No examples yet. Add your first example.
          </p>
        )}

        {examples.map((example, index) => (
          <div
            key={example.localKey}
            className="space-y-4 rounded-xl border border-white/10 bg-[#11131f] p-5"
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-semibold text-emerald-300">
                Example {index + 1}
                {example.id === null && (
                  <span className="ml-2 text-xs text-slate-400">New</span>
                )}
              </h3>

              {example.id === null && (
                <button
                  type="button"
                  onClick={() => removeNewExample(example.localKey)}
                  className="text-sm text-red-300 hover:text-red-200"
                >
                  Remove
                </button>
              )}
            </div>

            <Field label="German sentence">
              <textarea
                rows={2}
                value={example.sentenceDe}
                onChange={(e) =>
                  editExample(example.localKey, "sentenceDe", e.target.value)
                }
                className={inputClass}
                placeholder="Obwohl es regnet, gehe ich spazieren."
              />
            </Field>

            {example.sentenceDe.trim() && (
              <SpeakButton text={example.sentenceDe} />
            )}

            <Field label="English translation">
              <textarea
                rows={2}
                value={example.translationEn}
                onChange={(e) =>
                  editExample(example.localKey, "translationEn", e.target.value)
                }
                className={inputClass}
                placeholder="Although it is raining, I am going for a walk."
              />
            </Field>

            <Field label="Grammar explanation">
              <textarea
                rows={3}
                value={example.explanation}
                onChange={(e) =>
                  editExample(example.localKey, "explanation", e.target.value)
                }
                className={inputClass}
                placeholder="The conjugated verb appears at the end of the obwohl clause."
              />
            </Field>
          </div>
        ))}

        <button
          type="button"
          onClick={addExample}
          className="rounded-xl border border-emerald-500/30 px-4 py-3 text-sm text-emerald-300 hover:bg-emerald-500/10"
        >
          + Add Another Example
        </button>
        <AIExampleGenerator
          title={form.titleDe || form.title}
          explanationEn={form.explanationEn}
          existingExamples={examples.map((item) => item.sentenceDe)}
          onAdd={addGeneratedExample}
        />
      </section>

      <section className="space-y-5 rounded-2xl border border-orange-500/20 bg-[#1c2030] p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-orange-300">
              ⚠️ Exceptions & Important Notes ({exceptions.length})
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Explain special cases, exceptions and common mistakes.
            </p>
          </div>

          <button
            type="button"
            onClick={addException}
            className="rounded-xl bg-orange-500/10 px-4 py-2 text-sm font-medium text-orange-300 hover:bg-orange-500/20"
          >
            + Add Exception
          </button>
        </div>

        {exceptions.map((item, index) => (
          <div
            key={item.localKey}
            className="space-y-4 rounded-xl border border-white/10 bg-[#11131f] p-5"
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-semibold text-orange-300">
                Exception {index + 1}
              </h3>

              {item.id === null && (
                <button
                  type="button"
                  onClick={() => removeNewException(item.localKey)}
                  className="text-sm text-red-300 hover:text-red-200"
                >
                  Remove
                </button>
              )}
            </div>

            <Field label="Exception title">
              <input
                className={inputClass}
                value={item.title}
                onChange={(e) =>
                  editException(item.localKey, "title", e.target.value)
                }
                placeholder="Special genitive ending"
              />
            </Field>

            <Field label="Explanation">
              <textarea
                className={inputClass}
                rows={3}
                value={item.explanation}
                onChange={(e) =>
                  editException(item.localKey, "explanation", e.target.value)
                }
              />
            </Field>

            <Field label="German example">
              <textarea
                className={inputClass}
                rows={2}
                value={item.exampleDe}
                onChange={(e) =>
                  editException(item.localKey, "exampleDe", e.target.value)
                }
              />
            </Field>

            {item.exampleDe.trim() && <SpeakButton text={item.exampleDe} />}

            <Field label="English translation">
              <textarea
                className={inputClass}
                rows={2}
                value={item.exampleEn}
                onChange={(e) =>
                  editException(item.localKey, "exampleEn", e.target.value)
                }
              />
            </Field>
          </div>
        ))}

        <button
          type="button"
          onClick={addException}
          className="rounded-xl border border-orange-500/30 px-4 py-2 text-sm text-orange-300 hover:bg-orange-500/10"
        >
          + Add Another Exception
        </button>
      </section>

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300"
        >
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-3 pb-8">
        <button
          type="button"
          disabled={saving}
          onClick={save}
          className="rounded-xl bg-violet-500 px-6 py-3 font-semibold text-white hover:bg-violet-400 disabled:opacity-50"
        >
          {saving ? "Saving..." : "✓ Save Lesson & Examples"}
        </button>

        <Link
          href={returnUrl}
          className="rounded-xl bg-white/10 px-5 py-3 text-slate-200"
        >
          Cancel
        </Link>
      </div>
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
      <span className="text-sm font-medium text-slate-300">{label}</span>
      {children}
    </label>
  );
}
