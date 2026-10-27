import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  grammarRules,
  grammarExamples,
  grammarExceptions,
  nounPatterns,
  vocabulary,
  conceptRelations,
} from "@/db/schema";
import SpeakButton from "./speak-button";
import DeclensionTable from "@/components/declension-table";
import GenderHighlighter from "@/components/gender-highlighter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
};

const genderColors = {
  masculine: "text-blue-400 border-blue-500/30",
  feminine: "text-pink-400 border-pink-500/30",
  neuter: "text-yellow-400 border-yellow-500/30",
};

const articles = {
  masculine: "der",
  feminine: "die",
  neuter: "das",
};

export default async function RuleDetailPage({ params }: Props) {
  const { slug } = await params;

  const [rule] = await db
    .select()
    .from(grammarRules)
    .where(
      and(eq(grammarRules.slug, slug), eq(grammarRules.status, "published")),
    )
    .limit(1);

  if (!rule) notFound();

  const [examples, exceptions, patterns, relations] = await Promise.all([
    db
      .select()
      .from(grammarExamples)
      .where(eq(grammarExamples.ruleId, rule.id)),

    db
      .select()
      .from(grammarExceptions)
      .where(eq(grammarExceptions.ruleId, rule.id)),

    db.select().from(nounPatterns).where(eq(nounPatterns.ruleId, rule.id)),

    db
      .select()
      .from(conceptRelations)
      .where(eq(conceptRelations.sourceRuleId, rule.id)),
  ]);

  const patternIds = new Set(patterns.map((p) => p.id));

  const allPublishedWords = await db
    .select()
    .from(vocabulary)
    .where(eq(vocabulary.status, "published"));

  const words = allPublishedWords.filter(
    (word) => word.patternId && patternIds.has(word.patternId),
  );

  const relatedRuleIds = relations.map((r) => r.targetRuleId);

  const relatedRules =
    relatedRuleIds.length > 0
      ? (
          await db
            .select()
            .from(grammarRules)
            .where(eq(grammarRules.status, "published"))
        ).filter((r) => relatedRuleIds.includes(r.id))
      : [];

  return (
    <main className="min-h-screen bg-[#11131f] px-5 py-8 text-white md:px-12">
      <div className="mx-auto max-w-4xl space-y-8">
        <Link
          href="/library"
          className="text-sm text-violet-300 hover:text-violet-200"
        >
          ← Back to Library
        </Link>

        <header>
          <div className="mb-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-violet-500/15 px-3 py-1 text-sm text-violet-300">
              {rule.cefrLevel}
            </span>

            <span className="rounded-full bg-white/5 px-3 py-1 text-sm text-slate-300">
              {rule.category}
            </span>
          </div>

          <h1 className="text-3xl font-bold md:text-4xl">
            {rule.titleDe || rule.title}
          </h1>

          <p className="mt-3 text-slate-400">{rule.title}</p>
          {process.env.NODE_ENV === "development" && (
  <Link
    href={`/admin/grammar/${encodeURIComponent(rule.id)}`}
    className="mt-5 inline-flex items-center gap-2 rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-sm font-medium text-violet-300 transition hover:bg-violet-500/20"
  >
    ✏️ Edit Grammar & Examples
  </Link>
)}
        </header>

        <section className="rounded-2xl border border-violet-500/20 bg-[#1c2030] p-6">
          <h2 className="mb-4 text-xl font-semibold text-violet-300">
            📖 Grammar Explanation
          </h2>

          <p className="leading-8 text-slate-200">{rule.explanationEn}</p>

          {rule.explanationDe && (
            <div className="mt-5 rounded-xl bg-[#11131f] p-4">
              <p className="leading-8 text-slate-300">{rule.explanationDe}</p>
              <div className="mt-3">
                <SpeakButton text={rule.explanationDe} />
              </div>
            </div>
          )}
        </section>

        {patterns.length > 0 && (
          <section className="rounded-2xl border border-white/10 bg-[#1c2030] p-6">
            <h2 className="mb-4 text-xl font-semibold">🧩 Noun Patterns</h2>

            <div className="space-y-3">
              {patterns.map((pattern) => (
                <div key={pattern.id} className="rounded-xl bg-[#11131f] p-4">
                  <p className="font-semibold text-violet-300">
                    {pattern.name}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-slate-300">
                    {pattern.explanation}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
        {words
          .filter(
            (word) => word.partOfSpeech === "noun" && word.gender !== null,
          )
          .slice(0, 3)
          .map((word) => (
            <DeclensionTable
              key={word.id}
              noun={word.lemma}
              gender={word.gender!}
              genitive={word.genitive}
              plural={word.plural}
              nDeclension={patterns.some(
                (p) =>
                  p.id === word.patternId && p.patternType === "declension",
              )}
            />
          ))}

        {words.length > 0 && (
          <section className="rounded-2xl border border-white/10 bg-[#1c2030] p-6">
            <h2 className="mb-4 text-xl font-semibold">
              🧠 Related Vocabulary
            </h2>

            <div className="grid gap-3 sm:grid-cols-2">
              {words.map((word) => {
                const gender = word.gender;
                const style = gender
                  ? genderColors[gender]
                  : "text-violet-300 border-white/10";

                return (
                  <div
                    key={word.id}
                    className={`rounded-xl border bg-[#11131f] p-4 ${style}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-lg font-semibold">
                          {gender ? `${articles[gender]} ` : ""}
                          {word.lemma}
                        </p>

                        <p className="mt-1 text-sm text-slate-400">
                          {word.meaningEn}
                        </p>

                        {word.plural && (
                          <p className="mt-2 text-xs text-slate-500">
                            Plural: {word.plural}
                          </p>
                        )}
                      </div>

                      <SpeakButton
                        text={`${gender ? `${articles[gender]} ` : ""}${word.lemma}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {examples.length > 0 && (
          <section className="rounded-2xl border border-emerald-500/20 bg-[#1c2030] p-6">
            <h2 className="mb-5 text-xl font-semibold text-emerald-400">
              ✨ Examples
            </h2>

            <div className="space-y-4">
              {examples.map((example) => (
                <div key={example.id} className="rounded-xl bg-[#11131f] p-5">
                  <p className="text-lg leading-8">
                    <GenderHighlighter
                      text={example.sentenceDe}
                      nouns={allPublishedWords}
                    />
                  </p>

                  {example.translationEn && (
                    <p className="mt-2 text-sm text-slate-400">
                      {example.translationEn}
                    </p>
                  )}

                  {example.explanation && (
                    <p className="mt-3 text-sm text-emerald-300">
                      {example.explanation}
                    </p>
                  )}

                  <div className="mt-4">
                    <SpeakButton text={example.sentenceDe} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {exceptions.length > 0 && (
          <section className="rounded-2xl border border-orange-500/20 bg-[#1c2030] p-6">
            <h2 className="mb-5 text-xl font-semibold text-orange-400">
              ⚠️ Exceptions & Important Notes
            </h2>

            <div className="space-y-4">
              {exceptions.map((item) => (
                <div key={item.id} className="rounded-xl bg-[#11131f] p-5">
                  <h3 className="font-semibold text-orange-300">
                    {item.title}
                  </h3>

                  <p className="mt-2 text-sm leading-7 text-slate-300">
                    {item.explanation}
                  </p>

                  {item.exampleDe && (
                    <div className="mt-4">
                      <p className="text-slate-100">
                        <GenderHighlighter
                          text={item.exampleDe}
                          nouns={allPublishedWords}
                        />
                      </p>
                      <p className="mt-1 text-sm text-slate-400">
                        {item.exampleEn}
                      </p>

                      <div className="mt-3">
                        <SpeakButton text={item.exampleDe} />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {relatedRules.length > 0 && (
          <section className="rounded-2xl border border-white/10 bg-[#1c2030] p-6">
            <h2 className="mb-4 text-xl font-semibold">🔗 Related Grammar</h2>

            <div className="flex flex-wrap gap-3">
              {relatedRules.map((related) => (
                <Link
                  key={related.id}
                  href={`/library/rules/${related.slug}`}
                  className="rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-3 text-sm text-violet-300 hover:bg-violet-500/20"
                >
                  {related.titleDe || related.title} →
                </Link>
              ))}
            </div>
          </section>
        )}

        <footer className="pb-8 text-center text-xs text-slate-500">
          DeutschLab · Mission C1 💜
        </footer>
      </div>
    </main>
  );
}
