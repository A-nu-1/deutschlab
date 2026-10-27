
"use client";

import { useState } from "react";

type GeneratedExample = {
  sentenceDe: string;
  translationEn: string;
  explanation: string;
};

type Props = {
  title: string;
  explanationEn: string;
  existingExamples: string[];
  onAdd: (example: GeneratedExample) => void;
};

const levels = ["A1", "A2", "B1", "B2", "C1"] as const;
type Level = (typeof levels)[number];

export default function AIExampleGenerator({
  title,
  explanationEn,
  existingExamples,
  onAdd,
}: Props) {
  const [level, setLevel] = useState<Level>("B2");
  const [suggestions, setSuggestions] =
    useState<GeneratedExample[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function generate() {
    if (loading) return;

    setLoading(true);
    setError("");
    setSuggestions([]);

    try {
      const response = await fetch(
        "/api/ai/grammar-examples",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title,
            explanationEn,
            level,
            existingExamples: existingExamples.slice(0, 20),
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.error || "Example generation failed."
        );
      }

      setSuggestions(result.examples);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not generate examples."
      );
    } finally {
      setLoading(false);
    }
  }

  function addSuggestion(index: number) {
    const example = suggestions[index];

    if (!example) return;

    onAdd(example);

    setSuggestions((previous) =>
      previous.filter((_, i) => i !== index)
    );
  }

  return (
    <div className="space-y-4 rounded-xl border border-violet-500/30 bg-[#151724] p-5">
      <div>
        <h3 className="text-lg font-semibold text-violet-300">
          ✨ Generate Examples with Gemini
        </h3>
        <p className="mt-2 text-sm text-slate-400">
          Generate suggestions, review them, then add only
          the ones you want.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label
          htmlFor="generation-level"
          className="text-sm text-slate-300"
        >
          CEFR level
        </label>

        <select
          id="generation-level"
          value={level}
          onChange={(event) =>
            setLevel(event.target.value as Level)
          }
          className="rounded-lg border border-white/10 bg-[#11131f] px-3 py-2 text-white"
        >
          {levels.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={generate}
          disabled={loading}
          className="rounded-lg bg-violet-500 px-4 py-2 text-sm font-medium text-white hover:bg-violet-400 disabled:opacity-50"
        >
          {loading ? "Generating..." : "✨ Generate 3 Examples"}
        </button>
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-300">
          {error}
        </p>
      )}

      {suggestions.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-amber-300">
            AI-generated · Review before saving
          </p>

          {suggestions.map((example, index) => (
            <div
              key={`${example.sentenceDe}-${index}`}
              className="space-y-2 rounded-lg border border-white/10 bg-[#1c2030] p-4"
            >
              <p className="font-medium text-white">
                {example.sentenceDe}
              </p>

              <p className="text-sm text-slate-300">
                {example.translationEn}
              </p>

              <p className="text-xs leading-6 text-slate-400">
                {example.explanation}
              </p>

              <button
                type="button"
                onClick={() => addSuggestion(index)}
                className="rounded-lg bg-emerald-500/15 px-3 py-2 text-sm text-emerald-300 hover:bg-emerald-500/25"
              >
                + Add to Lesson
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
