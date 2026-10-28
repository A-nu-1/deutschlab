
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq, and } from "drizzle-orm";

import { db } from "@/db";
import {
  vocabulary,
  nounPatterns,
  grammarRules,
  examples as sharedExamples,
  exampleVocabulary,
} from "@/db/schema";

import DeclensionTable from "@/components/declension-table";
import SpeakButton from "../../rules/[slug]/speak-button";

import { getWordEtymology, getDwdsUrl } from "@/lib/word-etymology";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

const genderInfo = {
  masculine: {
    article: "der",
    color: "text-blue-400",
    border: "border-blue-500/30",
  },
  feminine: {
    article: "die",
    color: "text-pink-400",
    border: "border-pink-500/30",
  },
  neuter: {
    article: "das",
    color: "text-yellow-400",
    border: "border-yellow-500/30",
  },
};

export default async function WordDetailPage({ params }: Props) {
  const { id } = await params;

  const [word] = await db
    .select()
    .from(vocabulary)
    .where(
      and(
        eq(vocabulary.lemma, id),
        eq(vocabulary.partOfSpeech, "noun"),
        eq(vocabulary.status, "published"),
      ),
    )
    .limit(1);

  if (!word) notFound();

  const gender = word.gender;
  const style = gender ? genderInfo[gender] : null;

  const [pattern] = word.patternId
    ? await db
        .select()
        .from(nounPatterns)
        .where(eq(nounPatterns.id, word.patternId))
        .limit(1)
    : [];

  const [relatedRule] = pattern?.ruleId
    ? await db
        .select()
        .from(grammarRules)
        .where(
          and(
            eq(grammarRules.id, pattern.ruleId),
            eq(grammarRules.status, "published"),
          ),
        )
        .limit(1)
    : [];

  const examples = await db
    .select({
      id: sharedExamples.id,
      sentenceDe: sharedExamples.sentenceDe,
      translationEn: sharedExamples.translationEn,
      explanation: sharedExamples.explanation,
    })
    .from(exampleVocabulary)
    .innerJoin(
      sharedExamples,
      eq(exampleVocabulary.exampleId, sharedExamples.id),
    )
    .where(eq(exampleVocabulary.vocabularyId, word.id));

  const etymology = getWordEtymology(word.lemma);
  const pronunciation = style ? `${style.article} ${word.lemma}` : word.lemma;

  return (
    <main className="min-h-screen bg-[#11131f] px-5 py-8 text-white md:px-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <Link
          href="/library?tab=vocabulary"
          className="text-sm text-violet-300 hover:text-violet-200"
        >
          ← Vocabulary
        </Link>

        <header
          className={`rounded-2xl border bg-[#1c2030] p-6 ${
            style?.border ?? "border-violet-500/20"
          }`}
        >
          <div className="mb-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-violet-500/15 px-3 py-1 text-xs text-violet-300">
              {word.cefrLevel}
            </span>

            <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-slate-300">
              {word.partOfSpeech}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <h1
              className={`text-3xl font-bold md:text-4xl ${
                style?.color ?? "text-violet-300"
              }`}
            >
              {pronunciation}
            </h1>

            <SpeakButton text={pronunciation} />

            {process.env.NODE_ENV === "development" && (
              <Link
                href={`/admin/words/${encodeURIComponent(word.id)}`}
                className="rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-sm font-medium text-violet-300 transition hover:bg-violet-500/20"
              >
                ✏️ Edit Word
              </Link>
            )}

            {process.env.NODE_ENV === "development" && (
              <Link
                href={`/admin/published-vocabulary/${encodeURIComponent(word.id)}`}
                className="rounded-xl border border-pink-500/30 bg-pink-500/10 px-4 py-2 text-sm font-medium text-pink-300 transition hover:bg-pink-500/20"
              >
                ✨ Generate Examples
              </Link>
            )}
          </div>

          <p className="mt-4 text-lg text-slate-200">{word.meaningEn}</p>

          {word.meaningDe && (
            <p className="mt-2 text-sm text-slate-400">{word.meaningDe}</p>
          )}
        </header>

        {word.partOfSpeech === "noun" &&
          gender &&
          (word.plural || word.genitive) && (
            <DeclensionTable
              noun={word.lemma}
              gender={gender}
              plural={word.plural}
              genitive={word.genitive}
              nDeclension={pattern?.patternType === "declension"}
            />
          )}

        {word.partOfSpeech === "noun" && !word.plural && !word.genitive && (
          <section className="rounded-2xl border border-white/10 bg-[#1c2030] p-5">
            <h2 className="font-semibold text-violet-300">Declension</h2>
            <p className="mt-2 text-sm text-slate-400">
              Verified noun forms have not been added yet.
            </p>
          </section>
        )}

        {examples.length > 0 && (
          <section className="rounded-2xl border border-violet-500/20 bg-[#1c2030] p-6">
            <h2 className="mb-5 text-xl font-semibold text-violet-300">
              📖 Vocabulary Examples
            </h2>

            <div className="space-y-4">
              {examples.map((example) => (
                <div
                  key={example.id}
                  className="rounded-xl border border-white/10 bg-[#11131f] p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-lg font-medium leading-8 text-slate-100">
                      {example.sentenceDe}
                    </p>

                    <SpeakButton text={example.sentenceDe} />
                  </div>

                  <p className="mt-2 text-sm text-slate-300">
                    {example.translationEn}
                  </p>

                  {example.explanation && (
                    <p className="mt-3 border-l-2 border-violet-500/40 pl-3 text-sm leading-6 text-slate-400">
                      {example.explanation}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {pattern && (
          <section className="rounded-2xl border border-violet-500/20 bg-[#1c2030] p-6">
            <h2 className="text-xl font-semibold text-violet-300">
              🧩 Word Pattern
            </h2>

            <h3 className="mt-4 font-semibold">{pattern.name}</h3>

            <p className="mt-2 leading-7 text-slate-300">
              {pattern.explanation}
            </p>

            {relatedRule && (
              <Link
                href={`/library/rules/${relatedRule.slug}`}
                className="mt-4 inline-block text-sm text-violet-300 underline hover:text-violet-200"
              >
                📖 Open {relatedRule.titleDe || relatedRule.title} →
              </Link>
            )}
          </section>
        )}

        <section className="rounded-2xl border border-white/10 bg-[#1c2030] p-6">
          <h2 className="text-xl font-semibold text-violet-300">
            🌱 Wortherkunft · Etymology
          </h2>

          {etymology ? (
            <div className="mt-4 space-y-3">
              <p className="leading-7 text-slate-300">
                {etymology.explanation}
              </p>

              {etymology.relatedWords && etymology.relatedWords.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {etymology.relatedWords.map((related) => (
                    <span
                      key={related}
                      className="rounded-lg bg-violet-500/10 px-3 py-2 text-xs text-violet-300"
                    >
                      {related}
                    </span>
                  ))}
                </div>
              )}

              <a
                href={etymology.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-sm text-violet-300 underline"
              >
                View etymology source ↗
              </a>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-400">
              Etymology has not been verified and saved for this word yet.
            </p>
          )}

          <div className="mt-4">
            <a
              href={getDwdsUrl(word.lemma)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-violet-300 underline hover:text-violet-200"
            >
              Research this word in DWDS ↗
            </a>
          </div>
        </section>

        {word.notes && (
          <section className="rounded-2xl border border-white/10 bg-[#1c2030] p-6">
            <h2 className="mb-3 text-xl font-semibold">📝 Additional Notes</h2>

            <p className="whitespace-pre-wrap leading-7 text-slate-300">
              {word.notes}
            </p>
          </section>
        )}

        <footer className="pb-8 text-center text-xs text-slate-500">
          DeutschLab · Mission C1 💜
        </footer>
      </div>
    </main>
  );
}
