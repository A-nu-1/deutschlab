"use client";

import { useState } from "react";

export type VerbForm = {
  tense: string;
  person: string;
  form: string;
};

export type GeneratedVerb = {
  infinitive: string;
  auxiliary: "haben" | "sein" | "both";
  pastParticiple: string;
  separable: boolean;
  prefix: string;
  notes: string;
  forms: VerbForm[];
};

type Props = {
  lemma: string;
  meaningEn: string;
  cefrLevel: string;
  onChange: (data: GeneratedVerb | null) => void;
};

const tenseLabels: Record<string, string> = {
  present: "Präsens",
  preterite: "Präteritum",
  perfect: "Perfekt",
  pluperfect: "Plusquamperfekt",
  future_i: "Futur I",
  konjunktiv_ii: "Konjunktiv II",
};

const tenseOrder = [
  "present",
  "preterite",
  "perfect",
  "pluperfect",
  "future_i",
  "konjunktiv_ii",
];

const inputClass =
  "w-full rounded-lg border border-white/10 " +
  "bg-[#11131f] px-3 py-2 text-white " +
  "outline-none focus:border-violet-400";

export default function VerbFormsGenerator({
  lemma,
  meaningEn,
  cefrLevel,
  onChange,
}: Props) {
  const [generated, setGenerated] = useState<GeneratedVerb | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function generate() {
    if (loading) return;

    setLoading(true);
    setError("");
    setGenerated(null);
    onChange(null);

    try {
      const response = await fetch("/api/ai/verb-forms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lemma,
          meaningEn,
          cefrLevel,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Generation failed.");
      }

      setGenerated(result.data);
      onChange(result.data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not generate verb forms.",
      );
    } finally {
      setLoading(false);
    }
  }

  function applyGenerated(updater: (previous: GeneratedVerb) => GeneratedVerb) {
    setGenerated((previous) => {
      if (!previous) return null;

      const next = updater(previous);
      onChange(next);
      return next;
    });
  }

  function updateForm(index: number, value: string) {
    applyGenerated((previous) => {
      if (!previous) return previous;

      return {
        ...previous,
        forms: previous.forms.map((item, i) =>
          i === index ? { ...item, form: value } : item,
        ),
      };
    });
  }

  function updateMetadata(
    field: "pastParticiple" | "prefix" | "notes",
    value: string,
  ) {
    applyGenerated((previous) =>
      previous ? { ...previous, [field]: value } : previous,
    );
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => void generate()}
        disabled={loading || !lemma.trim()}
        className="rounded-xl bg-violet-500/15 px-4 py-3 text-sm font-semibold text-violet-300 hover:bg-violet-500/25 disabled:opacity-50"
      >
        {loading
          ? "✨ Generating conjugations..."
          : generated
            ? "↻ Regenerate Verb Forms"
            : "✨ Generate Verb Forms"}
      </button>

      {error && (
        <p role="alert" className="text-sm text-red-300">
          {error}
        </p>
      )}

      {generated && (
        <div className="space-y-5">
          <p className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-300">
            AI-generated draft · Check irregular verbs, auxiliary verbs and
            conjugations carefully. These forms are not saved yet.
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-xs text-slate-400">Past participle</span>
              <input
                className={inputClass}
                value={generated.pastParticiple}
                onChange={(e) =>
                  updateMetadata("pastParticiple", e.target.value)
                }
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs text-slate-400">Separable prefix</span>
              <input
                className={inputClass}
                value={generated.prefix}
                onChange={(e) => updateMetadata("prefix", e.target.value)}
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs text-slate-400">Auxiliary</span>
              <select
                className={inputClass}
                value={generated.auxiliary}
                onChange={(e) =>
                  applyGenerated((previous) => ({
                    ...previous,
                    auxiliary: e.target.value as "haben" | "sein" | "both",
                  }))
                }
              >
                <option value="haben">haben</option>
                <option value="sein">sein</option>
                <option value="both">Both</option>
              </select>
            </label>

            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={generated.separable}
                onChange={(e) =>
                  applyGenerated((previous) => ({
                    ...previous,
                    separable: e.target.checked,
                  }))
                }
              />
              Separable verb
            </label>
          </div>

          <label className="block space-y-2">
            <span className="text-xs text-slate-400">Verb notes</span>
            <textarea
              className={inputClass}
              rows={3}
              value={generated.notes}
              onChange={(e) => updateMetadata("notes", e.target.value)}
            />
          </label>

          {tenseOrder.map((tense) => (
            <section
              key={tense}
              className="overflow-hidden rounded-xl border border-white/10 bg-[#11131f]"
            >
              <h4 className="border-b border-white/10 bg-violet-500/10 px-4 py-3 font-semibold text-violet-300">
                {tenseLabels[tense]}
              </h4>

              <div className="divide-y divide-white/5">
                {generated.forms.map((item, index) => {
                  if (item.tense !== tense) return null;

                  return (
                    <div
                      key={`${item.tense}:${item.person}`}
                      className="grid grid-cols-[85px_1fr] items-center gap-3 p-3"
                    >
                      <span className="text-xs text-slate-400">
                        {item.person}
                      </span>

                      <input
                        aria-label={`${tenseLabels[tense]} ${item.person}`}
                        className={inputClass}
                        value={item.form}
                        onChange={(e) => updateForm(index, e.target.value)}
                      />
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
