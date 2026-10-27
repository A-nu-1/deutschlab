"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import GenderHighlighter from "@/components/gender-highlighter";

type Rule = {
  id: string;
  slug: string;
  title: string;
  titleDe: string | null;
  category: string;
  cefrLevel: string;
  explanationEn: string;
  explanationDe: string | null;
};

type Example = {
  id: string;
  ruleId: string;
  sentenceDe: string;
  translationEn: string | null;
};

type Exception = {
  id: string;
  ruleId: string;
  title: string;
  explanation: string;
};

type Word = {
  id: string;
  lemma: string;
  meaningEn: string;
  gender: "masculine" | "feminine" | "neuter" | null;
  partOfSpeech: string;
  cefrLevel: string;
  plural: string | null;
};

type Props = {
  rules: Rule[];
  examples: Example[];
  exceptions: Exception[];
  words: Word[];
};

const genderStyle = {
  masculine: {
    article: "der",
    text: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
  },
  feminine: {
    article: "die",
    text: "text-pink-400",
    bg: "bg-pink-500/10",
    border: "border-pink-500/30",
  },
  neuter: {
    article: "das",
    text: "text-yellow-400",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/30",
  },
};

const levels = ["All", "A1", "A2", "B1", "B2", "C1"];

export default function LibraryClient({
  rules,
  examples,
  exceptions,
  words,
}: Props) {
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState("All");

  const filteredRules = useMemo(() => {
    const q = search.toLocaleLowerCase("de");

    return rules.filter((rule) => {
      const matchesLevel = level === "All" || rule.cefrLevel === level;

      const searchable = [
        rule.title,
        rule.titleDe,
        rule.explanationEn,
        rule.explanationDe,
      ]
        .join(" ")
        .toLocaleLowerCase("de");

      return matchesLevel && searchable.includes(q);
    });
  }, [rules, search, level]);

  const filteredWords = useMemo(() => {
    const q = search.toLocaleLowerCase("de");

    return words.filter((word) => {
      const matchesLevel = level === "All" || word.cefrLevel === level;

      const searchable = [word.lemma, word.meaningEn, word.gender ?? ""]
        .join(" ")
        .toLocaleLowerCase("de");

      return matchesLevel && searchable.includes(q);
    });
  }, [words, search, level]);

  const searchParams = useSearchParams();

  const tab =
    searchParams.get("tab") === "vocabulary" ? "vocabulary" : "grammar";

  return (
    <main className="min-h-screen bg-[#11131f] px-5 py-8 text-white md:px-12">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8">
          <Link
            href="/"
            className="text-sm text-violet-300 hover:text-violet-200"
          >
            ← Back to DeutschLab
          </Link>

          <h1 className="mt-6 text-3xl font-bold md:text-4xl">
            📖 Meine Deutschbibliothek
          </h1>

          <p className="mt-3 text-slate-400">
            Your growing German knowledge library · A1–C1
          </p>
        </header>

        <section className="mb-8 grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Grammar Rules"
            value={rules.length}
            color="text-violet-400"
          />
          <StatCard
            label="Vocabulary"
            value={words.length}
            color="text-pink-400"
          />
          <StatCard
            label="Examples"
            value={examples.length}
            color="text-blue-400"
          />
        </section>

        <section className="mb-8 rounded-2xl border border-white/10 bg-[#1c2030] p-5">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search grammar, words, explanations..."
            className="w-full rounded-xl border border-white/10 bg-[#11131f] px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-violet-400"
          />

          <div className="mt-5 flex flex-wrap gap-2">
            {levels.map((item) => (
              <button
                key={item}
                onClick={() => setLevel(item)}
                className={`rounded-lg px-4 py-2 text-sm transition ${
                  level === item
                    ? "bg-violet-500 text-white"
                    : "bg-white/5 text-slate-300 hover:bg-white/10"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </section>

        <div className="mb-6 flex gap-3">
          <Link
            href="/library"
            className={`rounded-xl px-5 py-3 font-medium ${
              tab === "grammar"
                ? "bg-violet-500 text-white"
                : "bg-[#1c2030] text-slate-400"
            }`}
          >
            📖 Grammar ({rules.length})
          </Link>

          <Link
            href="/library?tab=vocabulary"
            className={`rounded-xl px-5 py-3 font-medium ${
              tab === "vocabulary"
                ? "bg-violet-500 text-white"
                : "bg-[#1c2030] text-slate-400"
            }`}
          >
            🧠 Vocabulary ({words.length})
          </Link>
        </div>

        {tab === "grammar" ? (
          <div className="space-y-4">
            {filteredRules.map((rule) => {
              const ruleExamples = examples.filter(
                (example) => example.ruleId === rule.id,
              );

              const ruleExceptions = exceptions.filter(
                (exception) => exception.ruleId === rule.id,
              );

              return (
                <details
                  key={rule.id}
                  className="group rounded-2xl border border-violet-500/20 bg-[#1c2030] p-5 open:border-violet-400/50"
                >
                  <summary className="cursor-pointer list-none">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h2 className="text-lg font-semibold text-white">
                          {rule.titleDe || rule.title}
                        </h2>

                        <p className="mt-1 text-sm text-slate-400">
                          {rule.title}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="rounded-full bg-violet-500/15 px-3 py-1 text-xs text-violet-300">
                          {rule.cefrLevel}
                        </span>

                        <span className="text-violet-300 transition group-open:rotate-180">
                          ▼
                        </span>
                      </div>
                    </div>
                  </summary>

                  <div className="mt-5 space-y-5 border-t border-white/10 pt-5">
                    <Link
                      href={`/library/rules/${rule.slug}`}
                      className="inline-flex rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-sm font-medium text-violet-300 transition hover:bg-violet-500/20"
                    >
                      📖 Open full lesson →
                    </Link>
                    <div>
                      <h3 className="mb-2 font-semibold text-violet-300">
                        Explanation
                      </h3>

                      <p className="leading-7 text-slate-300">
                        {rule.explanationEn}
                      </p>

                      {rule.explanationDe && (
                        <p className="mt-3 leading-7 text-slate-400">
                          {rule.explanationDe}
                        </p>
                      )}
                    </div>

                    {ruleExamples.length > 0 && (
                      <div>
                        <h3 className="mb-3 font-semibold text-emerald-400">
                          Examples
                        </h3>

                        <div className="space-y-3">
                          {ruleExamples.map((example) => (
                            <div
                              key={example.id}
                              className="rounded-xl bg-[#11131f] p-4"
                            >
                              <p className="font-medium">
                                <GenderHighlighter
                                  text={example.sentenceDe}
                                  nouns={words}
                                />
                              </p>

                              <p className="mt-2 text-sm text-slate-400">
                                {example.translationEn}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {ruleExceptions.length > 0 && (
                      <div>
                        <h3 className="mb-3 font-semibold text-orange-400">
                          Exceptions & Important Notes
                        </h3>

                        {ruleExceptions.map((item) => (
                          <div
                            key={item.id}
                            className="mb-3 rounded-xl border border-orange-500/20 bg-orange-500/5 p-4"
                          >
                            <p className="font-semibold text-orange-300">
                              {item.title}
                            </p>

                            <p className="mt-2 text-sm leading-6 text-slate-300">
                              {item.explanation}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </details>
              );
            })}

            {filteredRules.length === 0 && <EmptyState />}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredWords.map((word) => {
              const style = word.gender ? genderStyle[word.gender] : null;

              return (
                <article
                  key={word.id}
                  className={`rounded-2xl border bg-[#1c2030] p-5 ${
                    style?.border ?? "border-white/10"
                  }`}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wide text-slate-500">
                      {word.partOfSpeech}
                    </span>

                    <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-slate-300">
                      {word.cefrLevel}
                    </span>
                  </div>

                  <h2
                    className={`text-xl font-bold ${
                      style?.text ?? "text-violet-300"
                    }`}
                  >
                    {style?.article && `${style.article} `}
                    {word.lemma}
                  </h2>

                  <p className="mt-2 text-sm text-slate-300">
                    {word.meaningEn}
                  </p>
                  {word.partOfSpeech === "noun" && (
                    <Link
                      href={`/library/words/${encodeURIComponent(word.lemma)}`}
                      className="mt-4 inline-flex rounded-lg border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-sm font-medium text-violet-300 transition hover:bg-violet-500/20"
                    >
                      📖 View Details →
                    </Link>
                  )}
                  {word.partOfSpeech === "verb" && (
                    <Link
                      href={`/library/verbs/${encodeURIComponent(word.lemma)}`}
                      className="mt-4 inline-flex rounded-lg border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-sm font-medium text-violet-300 transition hover:bg-violet-500/20"
                    >
                      📖 View Conjugations →
                    </Link>
                  )}
                  {word.plural && (
                    <p className="mt-3 text-xs text-slate-500">
                      Plural: {word.plural}
                    </p>
                  )}
                </article>
              );
            })}

            {filteredWords.length === 0 && <EmptyState />}
          </div>
        )}

        <footer className="mt-12 text-center text-xs text-slate-500">
          DeutschLab · Your living German library 💜
        </footer>
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#1c2030] p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#1c2030] p-8 text-center text-slate-400">
      No matching entries found.
    </div>
  );
}
