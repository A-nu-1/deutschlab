
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Word = {
  id: string;
  lemma: string;
  meaningEn: string;
  meaningDe: string | null;
  cefrLevel: string;
  plural: string | null;
  genitive: string | null;
  notes: string | null;
};

const inputClass =
  "w-full rounded-xl border border-white/10 " +
  "bg-[#11131f] px-4 py-3 text-white " +
  "outline-none focus:border-violet-400";

export default function WordEditor({ word }: { word: Word }) {
  const router = useRouter();

  const [form, setForm] = useState({
    meaningEn: word.meaningEn,
    meaningDe: word.meaningDe ?? "",
    cefrLevel: word.cefrLevel,
    plural: word.plural ?? "",
    genitive: word.genitive ?? "",
    notes: word.notes ?? "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function update(field: keyof typeof form, value: string) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  async function save() {
    if (saving) return;

    setSaving(true);
    setError("");

    try {
      const response = await fetch(
        `/api/admin/words/${encodeURIComponent(word.id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Save failed.");
      }

      router.push(
        `/library/words/${encodeURIComponent(word.lemma)}`
      );
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Save failed."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <Link
        href={`/library/words/${encodeURIComponent(word.lemma)}`}
        className="text-sm text-violet-300"
      >
        ← Cancel editing
      </Link>

      <div>
        <h1 className="text-3xl font-bold text-white">
          ✏️ Edit {word.lemma}
        </h1>
        <p className="mt-2 text-slate-400">
          Update the verified vocabulary entry.
        </p>
      </div>

      <div className="space-y-5 rounded-2xl border border-violet-500/20 bg-[#1c2030] p-6">
        <Field label="English meaning">
          <textarea
            rows={3}
            value={form.meaningEn}
            onChange={(e) => update("meaningEn", e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="German explanation">
          <textarea
            rows={3}
            value={form.meaningDe}
            onChange={(e) => update("meaningDe", e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="CEFR level">
          <select
            value={form.cefrLevel}
            onChange={(e) => update("cefrLevel", e.target.value)}
            className={inputClass}
          >
            {["A1", "A2", "B1", "B2", "C1"].map((level) => (
              <option key={level}>{level}</option>
            ))}
          </select>
        </Field>

        <Field label="Plural">
          <input
            value={form.plural}
            onChange={(e) => update("plural", e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="Genitive singular">
          <input
            value={form.genitive}
            onChange={(e) => update("genitive", e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="Additional notes">
          <textarea
            rows={5}
            value={form.notes}
            onChange={(e) => update("notes", e.target.value)}
            className={inputClass}
          />
        </Field>

        {error && (
          <p role="alert" className="text-sm text-red-300">
            {error}
          </p>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="rounded-xl bg-violet-500 px-5 py-3 font-medium text-white disabled:opacity-50"
          >
            {saving ? "Saving..." : "✓ Save Changes"}
          </button>

          <Link
            href={`/library/words/${encodeURIComponent(word.lemma)}`}
            className="rounded-xl bg-white/10 px-5 py-3 text-slate-200"
          >
            Cancel
          </Link>
        </div>
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
      <span className="text-sm font-medium text-slate-300">
        {label}
      </span>
      {children}
    </label>
  );
}
