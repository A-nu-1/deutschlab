"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import SpeakButton from "../library/rules/[slug]/speak-button";
import {
  caseStyles,
  getVerifiedCaseAnnotations,
  type CaseAnnotation,
} from "@/lib/verified-case-annotations";
import { getWordEtymology, getDwdsUrl } from "@/lib/word-etymology";
import { detectRelatedGrammar } from "@/lib/related-grammar";
import AIAnalysisPanel from "./ai-analysis-panel";

type Gender = "masculine" | "feminine" | "neuter";

type Word = {
  id: string;
  lemma: string;
  partOfSpeech: string;
  meaningEn: string;
  gender: Gender | null;
  plural: string | null;
  genitive: string | null;
  cefrLevel: string;
  patternId: string | null;
};

type Pattern = {
  id: string;
  name: string;
  ruleId: string | null;
};

type Rule = {
  id: string;
  title: string;
  slug: string;
};

type Props = {
  words: Word[];
  patterns: Pattern[];
  rules: Rule[];
};

type Token = {
  text: string;
  start: number;
  end: number;
};

const articles = new Set([
  "der",
  "die",
  "das",
  "den",
  "dem",
  "des",
  "ein",
  "eine",
  "einen",
  "einem",
  "einer",
  "eines",
  "kein",
  "keine",
  "keinen",
  "keinem",
  "keiner",
  "keines",
]);

const genderClasses: Record<Gender, string> = {
  masculine: "text-blue-400",
  feminine: "text-pink-400",
  neuter: "text-yellow-400",
};

const genderArticles: Record<Gender, string> = {
  masculine: "der",
  feminine: "die",
  neuter: "das",
};

const sampleText =
  "Ich kenne den Namen des Mannes. Die Bedeutung des Namens " +
  "ist interessant. Die Dame liest die Zeitung. " +
  "Das Mädchen spielt im Garten. Obwohl es regnet, " +
  "gehe ich spazieren.";

function normalize(text: string) {
  return text.toLocaleLowerCase("de");
}

export default function ReaderClient({ words, patterns, rules }: Props) {
  const [text, setText] = useState(sampleText);
  const [selected, setSelected] = useState<{
    token: string;
    word: Word | null;
  } | null>(null);
  const [showColors, setShowColors] = useState(true);
  const [showCases, setShowCases] = useState(true);
  // Create a lookup for known word forms.
  // Multiple entries are preserved so ambiguous forms
  // are not silently assigned an arbitrary gender.
  const dictionary = useMemo(() => {
    const map = new Map<string, Word[]>();

    function register(form: string | null, word: Word) {
      if (!form) return;

      const key = normalize(form);
      const matches = map.get(key) || [];

      if (!matches.some((item) => item.id === word.id)) {
        matches.push(word);
      }

      map.set(key, matches);
    }

    for (const word of words) {
      register(word.lemma, word);

      if (word.partOfSpeech === "noun") {
        register(word.plural, word);
        register(word.genitive, word);

        // Starter support for verified seeded
        // masculine N-declension nouns.
        if (
          word.gender === "masculine" &&
          ["Name", "Junge", "Kollege"].includes(word.lemma)
        ) {
          register(word.lemma === "Name" ? "Namen" : word.plural, word);
        }
      }
    }

    return map;
  }, [words]);

  const tokens = useMemo<Token[]>(
    () =>
      Array.from(text.matchAll(/\p{L}+/gu), (match) => ({
        text: match[0],
        start: match.index,
        end: match.index + match[0].length,
      })),
    [text],
  );
  const caseAnnotations = useMemo(
    () => getVerifiedCaseAnnotations(text),
    [text],
  );

  const tokenCases = useMemo(() => {
    const result = new Map<number, CaseAnnotation>();

    tokens.forEach((token, index) => {
      const annotation = caseAnnotations.find(
        (item) => token.start >= item.start && token.end <= item.end,
      );

      if (annotation) {
        result.set(index, annotation);
      }
    });

    return result;
  }, [tokens, caseAnnotations]);

  const highlights = useMemo(() => {
    const result = new Map<number, Gender>();

    tokens.forEach((token, index) => {
      // German nouns normally begin with a capital letter.
      if (!/^\p{Lu}/u.test(token.text)) return;

      const matches = (dictionary.get(normalize(token.text)) || []).filter(
        (word): word is Word & { gender: Gender } =>
          word.partOfSpeech === "noun" && word.gender !== null,
      );

      const genders = new Set(matches.map((word) => word.gender));

      if (genders.size !== 1) return;

      const gender = Array.from(genders)[0];
      result.set(index, gender);

      if (index > 0) {
        const previous = tokens[index - 1];
        const between = text.slice(previous.end, token.start);

        if (/^\s+$/.test(between) && articles.has(normalize(previous.text))) {
          result.set(index - 1, gender);
        }
      }
    });

    return result;
  }, [tokens, text, dictionary]);

  function selectToken(index: number) {
    const token = tokens[index];
    let lookupToken = token.text;

    // If an article is highlighted, select its noun
    // when the noun immediately follows it.
    if (articles.has(normalize(token.text)) && highlights.has(index)) {
      const next = tokens[index + 1];

      if (
        next &&
        highlights.get(index + 1) === highlights.get(index) &&
        /^\s+$/.test(text.slice(token.end, next.start))
      ) {
        lookupToken = next.text;
      }
    }

    const matches = dictionary.get(normalize(lookupToken)) || [];

    setSelected({
      token: lookupToken,
      word: matches.length === 1 ? matches[0] : null,
    });
  }

  const selectedPattern = patterns.find(
    (pattern) => pattern.id === selected?.word?.patternId,
  );

  const selectedRule = rules.find(
    (rule) => rule.id === selectedPattern?.ruleId,
  );
  const etymology = selected?.word
    ? getWordEtymology(selected.word.lemma)
    : null;

  const relatedGrammar = detectRelatedGrammar(text)
    .map((match) => {
      const rule = rules.find((item) => item.slug === match.slug);

      return rule ? { ...rule, reason: match.reason } : null;
    })
    .filter((item): item is Rule & { reason: string } => item !== null);

  const renderedText = [];
  let cursor = 0;

  for (let index = 0; index < tokens.length; index++) {
    const token = tokens[index];

    if (token.start > cursor) {
      renderedText.push(text.slice(cursor, token.start));
    }

    const gender = showColors ? highlights.get(index) : undefined;

    const caseInfo = showCases ? tokenCases.get(index) : undefined;

    const caseStyle = caseInfo ? caseStyles[caseInfo.grammarCase] : null;

    renderedText.push(
      <button
        key={`${token.start}-${token.end}`}
        type="button"
        onClick={() => selectToken(index)}
        title={caseInfo ? `${caseStyle?.label}: ${caseInfo.reason}` : undefined}
        style={
          caseStyle
            ? {
                textDecorationLine: "underline",
                textDecorationStyle: caseStyle.style,
                textDecorationColor: caseStyle.color,
                textDecorationThickness: "2px",
                textUnderlineOffset: "5px",
              }
            : undefined
        }
        className={`inline cursor-pointer rounded-sm font-inherit hover:bg-violet-500/25 hover:underline focus-visible:outline-2 focus-visible:outline-violet-400 ${
          gender ? `font-semibold ${genderClasses[gender]}` : "text-slate-100"
        }`}
      >
        {token.text}
      </button>,
    );

    cursor = token.end;
  }

  if (cursor < text.length) {
    renderedText.push(text.slice(cursor));
  }

  return (
    <main className="min-h-screen bg-[#11131f] px-5 py-8 text-white md:px-12">
      <div className="mx-auto max-w-6xl space-y-7">
        <Link
          href="/"
          className="text-sm text-violet-300 hover:text-violet-200"
        >
          ← Back to DeutschLab
        </Link>

        <header>
          <h1 className="text-3xl font-bold md:text-4xl">📄 Smart Reader</h1>
          <p className="mt-2 text-slate-400">
            Read German, discover vocabulary and explore grammar.
          </p>
        </header>

        <section className="rounded-2xl border border-white/10 bg-[#1c2030] p-5">
          <label
            htmlFor="reader-text"
            className="mb-3 block font-semibold text-violet-300"
          >
            Paste your German text
          </label>

          <textarea
            id="reader-text"
            value={text}
            onChange={(event) => {
              setText(event.target.value);
              setSelected(null);
            }}
            placeholder="Füge hier deinen deutschen Text ein..."
            maxLength={20000}
            rows={7}
            className="w-full resize-y rounded-xl border border-white/10 bg-[#11131f] p-4 leading-7 text-white outline-none focus:border-violet-400"
          />

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={showColors}
                onChange={(event) => setShowColors(event.target.checked)}
                className="accent-violet-500"
              />
              Show noun gender colors
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={showCases}
                onChange={(event) => setShowCases(event.target.checked)}
                className="accent-violet-500"
              />
              Show grammatical case underlines
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setText(sampleText);
                  setSelected(null);
                }}
                className="rounded-lg bg-white/10 px-4 py-2 text-sm hover:bg-white/15"
              >
                Sample text
              </button>

              <button
                type="button"
                onClick={() => {
                  setText("");
                  setSelected(null);
                }}
                className="rounded-lg bg-white/10 px-4 py-2 text-sm hover:bg-white/15"
              >
                Clear
              </button>
            </div>
          </div>
        </section>

        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className="min-w-0 rounded-2xl border border-violet-500/20 bg-[#1c2030] p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-semibold text-violet-300">
                🇩🇪 German Reading
              </h2>

              <SpeakButton text={text} />
            </div>

            <div className="whitespace-pre-wrap break-words text-lg leading-10">
              {renderedText.length > 0
                ? renderedText
                : "Your German text will appear here."}
            </div>

            <div className="mt-6 flex flex-wrap gap-4 border-t border-white/10 pt-4 text-xs">
              <span className="text-blue-400">● Masculine</span>
              <span className="text-pink-400">● Feminine</span>
              <span className="text-yellow-400">● Neuter</span>
            </div>
            <div className="mt-4 flex flex-wrap gap-4 text-xs">
              {Object.entries(caseStyles).map(([key, value]) => (
                <span
                  key={key}
                  className="font-medium"
                  style={{
                    color: value.color,
                    textDecorationLine: "underline",
                    textDecorationStyle: value.style,
                    textDecorationColor: value.color,
                    textDecorationThickness: "2px",
                    textUnderlineOffset: "5px",
                  }}
                >
                  {value.label}
                </span>
              ))}
            </div>

            <p className="mt-3 text-xs text-slate-500">
              Click any word to inspect it. Only known and unambiguous noun
              forms are colored.
            </p>
          </section>

          <aside className="rounded-2xl border border-white/10 bg-[#1c2030] p-5 lg:sticky lg:top-6">
            <h2 className="mb-5 text-lg font-semibold">📖 Word Explorer</h2>

            {!selected ? (
              <p className="text-sm leading-7 text-slate-400">
                Select a word in the German text to see its English meaning and
                related grammar.
              </p>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-slate-500">Selected word</p>

                  <h3
                    className={`mt-1 text-2xl font-bold ${
                      selected.word?.gender
                        ? genderClasses[selected.word.gender]
                        : "text-violet-300"
                    }`}
                  >
                    {selected.word?.gender
                      ? `${genderArticles[selected.word.gender]} `
                      : ""}
                    {selected.word?.lemma || selected.token}
                  </h3>
                </div>

                {selected.word ? (
                  <>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-white/10 px-3 py-1 text-xs">
                        {selected.word.cefrLevel}
                      </span>
                      <span className="rounded-full bg-white/10 px-3 py-1 text-xs">
                        {selected.word.partOfSpeech}
                      </span>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">English</p>
                      <p className="mt-1 text-slate-200">
                        {selected.word.meaningEn}
                      </p>
                    </div>
                    <div className="rounded-xl border border-violet-500/20 bg-[#11131f] p-4">
                      <h4 className="flex items-center gap-2 font-semibold text-violet-300">
                        🌱 Wortherkunft · Etymology
                      </h4>

                      {etymology ? (
                        <div className="mt-3 space-y-3">
                          <p className="text-sm leading-7 text-slate-300">
                            {etymology.explanation}
                          </p>

                          {etymology.relatedWords &&
                            etymology.relatedWords.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {etymology.relatedWords.map((word) => (
                                  <span
                                    key={word}
                                    className="rounded-lg bg-violet-500/10 px-2 py-1 text-xs text-violet-300"
                                  >
                                    {word}
                                  </span>
                                ))}
                              </div>
                            )}

                          <a
                            href={etymology.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block text-xs text-violet-300 underline"
                          >
                            Source: {etymology.sourceName} ↗
                          </a>
                        </div>
                      ) : (
                        <p className="mt-3 text-sm text-slate-400">
                          Etymology has not been added to our verified library
                          yet.
                        </p>
                      )}

                      <a
                        href={getDwdsUrl(selected.word.lemma)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 inline-block text-sm font-medium text-violet-300 hover:text-violet-200"
                      >
                        Explore this word in DWDS ↗
                      </a>
                    </div>

                    {selected.word.plural && (
                      <p className="text-sm text-slate-400">
                        Plural: {selected.word.plural}
                      </p>
                    )}

                    <SpeakButton text={selected.word.lemma} />

                    {selectedPattern && (
                      <div className="rounded-xl bg-[#11131f] p-4">
                        <p className="text-sm font-semibold text-violet-300">
                          Grammar pattern
                        </p>
                        <p className="mt-2 text-sm text-slate-300">
                          {selectedPattern.name}
                        </p>

                        {selectedRule && (
                          <Link
                            href={`/library/rules/${selectedRule.slug}`}
                            className="mt-3 inline-block text-sm text-violet-300 underline hover:text-violet-200"
                          >
                            Open {selectedRule.title} →
                          </Link>
                        )}
                      </div>
                    )}

                    {selected.word.partOfSpeech === "verb" && (
                      <Link
                        href={`/library/verbs/${encodeURIComponent(
                          selected.word.lemma,
                        )}`}
                        className="inline-block text-sm text-violet-300 underline"
                      >
                        View conjugations →
                      </Link>
                    )}
                  </>
                ) : (
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                    <p className="text-sm text-amber-300">
                      This word is not yet uniquely identified in our vocabulary
                      library.
                    </p>
                    <p className="mt-2 text-xs leading-6 text-slate-400">
                      Later, AI analysis will help identify its lemma, meaning
                      and grammar.
                    </p>
                  </div>
                )}
              </div>
            )}
            <div className="mt-6 border-t border-white/10 pt-5">
              <details open className="group">
                <summary className="cursor-pointer font-semibold text-violet-300">
                  📚 Related Grammar ({relatedGrammar.length})
                </summary>

                <div className="mt-4 space-y-3">
                  {relatedGrammar.length === 0 ? (
                    <p className="text-sm leading-6 text-slate-400">
                      No matching lessons found yet. More grammar connections
                      will be added.
                    </p>
                  ) : (
                    relatedGrammar.map((rule) => (
                      <Link
                        key={rule.id}
                        href={`/library/rules/${rule.slug}`}
                        className="block rounded-xl border border-white/10 bg-[#11131f] p-4 transition hover:border-violet-500/40"
                      >
                        <p className="font-medium text-violet-300">
                          {rule.title}
                        </p>

                        <p className="mt-2 text-xs leading-6 text-slate-400">
                          {rule.reason}
                        </p>

                        <p className="mt-3 text-xs text-violet-300">
                          Open lesson →
                        </p>
                      </Link>
                    ))
                  )}
                </div>
              </details>
            </div>
          </aside>
        </div>
        <AIAnalysisPanel text={text} />
        <footer className="pb-6 text-center text-xs text-slate-500">
          DeutschLab · Read · Understand · Speak 💜
        </footer>
      </div>
    </main>
  );
}
