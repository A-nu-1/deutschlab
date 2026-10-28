"use client";

import { useEffect, useState } from "react";
import type { TextAnalysis } from "@/lib/ai/analysis-schema";
import { matchExistingGrammar } from "@/lib/grammar/match-grammar-rule";

type Props = {
  text: string;
};

const genderColors: Record<string, string> = {
  masculine: "text-blue-400",
  feminine: "text-pink-400",
  neuter: "text-yellow-400",
  none: "text-slate-100",
};

const genderArticles: Record<string, string> = {
  masculine: "der",
  feminine: "die",
  neuter: "das",
  none: "",
};

export default function AIAnalysisPanel({ text }: Props) {
  const [analysis, setAnalysis] = useState<TextAnalysis | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [analyzedText, setAnalyzedText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [savingWord, setSavingWord] = useState<string | null>(null);

  const [saveResults, setSaveResults] = useState<Record<string, string>>({});

  const isStale = analysis !== null && analyzedText !== text;

  const [grammarResults, setGrammarResults] = useState<Record<number, string>>(
    {},
  );

  const [savingGrammar, setSavingGrammar] = useState<number | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  useEffect(() => {
    let cancelled = false;

    async function checkOwnerSession() {
      try {
        const response = await fetch("/api/admin/auth/session", {
          cache: "no-store",
        });

        if (!response.ok) {
          if (!cancelled) setIsOwner(false);
          return;
        }

        const result = await response.json();

        if (!cancelled) {
          setIsOwner(result.authenticated === true);
        }
      } catch {
        if (!cancelled) {
          setIsOwner(false);
        }
      }
    }

    void checkOwnerSession();

    return () => {
      cancelled = true;
    };
  }, []);

  async function saveGrammarDraft(
    rule: TextAnalysis["grammar"][number],
    index: number,
  ) {
    if (savingGrammar !== null) return;

    setSavingGrammar(index);

    try {
      const response = await fetch("/api/admin/grammar-drafts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(rule),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Could not save grammar.");
      }

      setGrammarResults((previous) => ({
        ...previous,
        [index]: result.message,
      }));
    } catch (error) {
      setGrammarResults((previous) => ({
        ...previous,
        [index]: error instanceof Error ? error.message : "Save failed.",
      }));
    } finally {
      setSavingGrammar(null);
    }
  }

  async function saveVocabularyDraft(word: TextAnalysis["vocabulary"][number]) {
    const key = `${word.lemma}:${word.partOfSpeech}`;

    if (savingWord) return;

    setSavingWord(key);

    try {
      const response = await fetch("/api/vocabulary/drafts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ word }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to save vocabulary.");
      }

      setSaveResults((previous) => ({
        ...previous,
        [key]: result.message,
      }));
    } catch (err) {
      setSaveResults((previous) => ({
        ...previous,
        [key]: err instanceof Error ? err.message : "Could not save this word.",
      }));
    } finally {
      setSavingWord(null);
    }
  }

  async function analyze() {
    if (loading) return;

    const input = text.trim();

    if (!input || Array.from(input).length > 3000) {
      setError("Enter between 1 and 3000 characters.");
      return;
    }

    setLoading(true);
    setError("");
    setAnalysis(null);
    setSaveResults({});
    setGrammarResults({});
    try {
      const response = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: input,
          apiKey,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Analysis failed.");
      }

      setAnalysis(result.analysis);
      setAnalyzedText(text);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unexpected analysis error.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-violet-500/20 bg-[#1c2030] p-5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-violet-300">
            ✨ AI German Analysis
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Discover vocabulary and grammar without changing your verified
            library.
          </p>
        </div>
        {!isOwner && (
          <input
            type="password"
            autoComplete="off"
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
            placeholder="Your Gemini API key"
            aria-label="Your Gemini API key"
            className="w-full max-w-sm rounded-xl border border-white/10 bg-[#11131f] px-4 py-3 text-sm text-white outline-none focus:border-violet-400"
          />
        )}
        <button
          type="button"
          onClick={analyze}
          disabled={loading || !text.trim() || (!isOwner && !apiKey.trim())}
          className="rounded-xl bg-violet-500 px-5 py-3 font-medium text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Analyzing..." : "✨ Analyze Text"}
        </button>
      </div>

      {error && (
        <p
          role="alert"
          className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300"
        >
          {error}
        </p>
      )}

      {isStale && (
        <p className="mt-5 text-sm text-amber-300">
          The text has changed. Analyze again to see results for the new
          version.
        </p>
      )}

      {analysis && !isStale && (
        <div className="mt-6 space-y-6">
          <p className="text-xs text-amber-300">
            AI suggestions · Not yet verified
          </p>

          <div className="rounded-xl bg-[#11131f] p-5">
            <div className="mb-3 flex items-center gap-3">
              <h3 className="font-semibold">Reading Summary</h3>

              <span className="rounded-full bg-violet-500/15 px-3 py-1 text-xs text-violet-300">
                Estimated {analysis.overallLevel}
              </span>
            </div>

            <p className="leading-7 text-slate-300">{analysis.summaryEn}</p>
          </div>

          <div className="rounded-xl border border-violet-500/20 bg-[#11131f] p-5">
            <h3 className="mb-3 font-semibold text-violet-300">
              🌐 Full English Translation
            </h3>

            <p className="whitespace-pre-wrap leading-7 text-slate-200">
              {analysis.translationEn}
            </p>
          </div>

          <div>
            <h3 className="mb-4 text-lg font-semibold">
              📚 Vocabulary Discoveries
            </h3>

            <div className="grid gap-3 md:grid-cols-2">
              {analysis.vocabulary.map((word, index) => (
                <div
                  key={`${word.lemma}-${index}`}
                  className="rounded-xl border border-white/10 bg-[#11131f] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h4
                      className={`font-semibold ${genderColors[word.gender]}`}
                    >
                      {genderArticles[word.gender]}{" "}
                      {word.partOfSpeech.toLowerCase() === "noun"
                        ? word.lemma.replace(/^(der|die|das)\s+/iu, "")
                        : word.lemma}
                    </h4>

                    <span className="text-xs text-violet-300">
                      {word.level}
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-slate-200">
                    {word.meaningEn}
                  </p>

                  <p className="mt-2 text-xs text-slate-400">
                    {word.partOfSpeech} · {word.word}
                  </p>

                  <p className="mt-3 text-sm leading-6 text-slate-400">
                    {word.explanation}
                  </p>
                  {isOwner && (
                    <div className="mt-4 border-t border-white/10 pt-4">
                      {(() => {
                        const key = `${word.lemma}:${word.partOfSpeech}`;
                        const message = saveResults[key];

                        return (
                          <>
                            <button
                              type="button"
                              onClick={() => saveVocabularyDraft(word)}
                              disabled={
                                savingWord !== null ||
                                Boolean(
                                  message && !message.startsWith("Could not"),
                                )
                              }
                              className="rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-2 text-xs font-medium text-violet-300 transition hover:bg-violet-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {savingWord === key
                                ? "Saving..."
                                : message && !message.startsWith("Could not")
                                  ? "✓ Checked"
                                  : "＋ Save Draft"}
                            </button>

                            {message && (
                              <p
                                role="status"
                                className="mt-2 text-xs leading-5 text-slate-400"
                              >
                                {message}
                              </p>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-lg font-semibold">
              📖 Grammar Discoveries
            </h3>

            <div className="space-y-3">
              {analysis.grammar.map((rule, index) => (
                <details
                  key={`${rule.title}-${index}`}
                  className="rounded-xl border border-white/10 bg-[#11131f] p-4"
                >
                  <summary className="cursor-pointer font-medium text-violet-300">
                    {rule.title} · {rule.suggestedLevel}
                  </summary>

                  <div className="mt-4 space-y-3">
                    <p className="text-sm leading-7 text-slate-300">
                      {rule.explanationEn}
                    </p>

                    <p className="rounded-lg bg-[#1c2030] p-3 text-sm text-white">
                      {rule.exampleFromText}
                    </p>
                    {(() => {
                      const existingSlug = matchExistingGrammar(rule);

                      if (existingSlug) {
                        return (
                          <a
                            href={`/library/rules/${existingSlug}`}
                            className="inline-block text-sm font-medium text-violet-300 underline"
                          >
                            📖 Open existing grammar lesson →
                          </a>
                        );
                      }

                      return (
                        <div className="space-y-2">
                          {isOwner && (
                            <>
                              {" "}
                              <button
                                type="button"
                                onClick={() =>
                                  void saveGrammarDraft(rule, index)
                                }
                                disabled={
                                  savingGrammar !== null ||
                                  Boolean(grammarResults[index])
                                }
                                className="rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-2 text-sm text-violet-300 disabled:opacity-50"
                              >
                                {savingGrammar === index
                                  ? "Saving..."
                                  : grammarResults[index]
                                    ? "✓ Checked"
                                    : "＋ Save Grammar Draft"}
                              </button>
                              {grammarResults[index] && (
                                <p
                                  role="status"
                                  className="text-xs text-slate-400"
                                >
                                  {grammarResults[index]}
                                </p>
                              )}
                            </>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
