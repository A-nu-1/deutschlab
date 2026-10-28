
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq, and } from "drizzle-orm";

import { db } from "@/db";
import {
  vocabulary,
  verbForms,
  examples as sharedExamples,
  exampleVocabulary,
} from "@/db/schema";
import SpeakButton from "../../rules/[slug]/speak-button";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

const tenseGroups = [
  {
    key: "present",
    mood: "indicative",
    title: "Präsens",
    explanation: "Present tense",
  },
  {
    key: "preterite",
    mood: "indicative",
    title: "Präteritum",
    explanation: "Simple past",
  },
  {
    key: "perfect",
    mood: "indicative",
    title: "Perfekt",
    explanation: "Conversational past",
  },
  {
    key: "pluperfect",
    mood: "indicative",
    title: "Plusquamperfekt",
    explanation: "Past perfect",
  },
  {
    key: "future1",
    mood: "indicative",
    title: "Futur I",
    explanation: "Future tense",
  },
  {
    key: "konjunktiv2",
    mood: "subjunctive",
    title: "Konjunktiv II",
    explanation: "Hypothetical situations and wishes",
  },
];

const personOrder = ["ich", "du", "er/sie/es", "wir", "ihr", "sie/Sie"];

export default async function VerbDetailPage({ params }: Props) {
  const { id } = await params;

  const [verb] = await db
    .select()
    .from(vocabulary)
    .where(
      and(
        eq(vocabulary.lemma, id),
        eq(vocabulary.partOfSpeech, "verb"),
        eq(vocabulary.status, "published"),
      ),
    )
    .limit(1);

  if (!verb) {
    console.error(`Verb not found in Turso: ${id}`);
    notFound();
  }

  const forms = await db
    .select()
    .from(verbForms)
    .where(eq(verbForms.vocabularyId, verb.id));

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
    .where(eq(exampleVocabulary.vocabularyId, verb.id));

  const auxiliary = forms.find((form) => form.auxiliary)?.auxiliary;

  return (
    <main className="min-h-screen bg-[#11131f] px-5 py-8 text-white md:px-12">
      <div className="mx-auto max-w-5xl space-y-8">
        <Link
          href="/library"
          className="text-sm text-violet-300 hover:text-violet-200"
        >
          ← Back to Library
        </Link>

        <header className="rounded-2xl border border-violet-500/20 bg-[#1c2030] p-6">
          <div className="mb-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-violet-500/15 px-3 py-1 text-xs text-violet-300">
              {verb.cefrLevel}
            </span>
            <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-slate-300">
              Verb
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <h1 className="text-4xl font-bold text-violet-300">
              {verb.lemma}
            </h1>
            <SpeakButton text={verb.lemma} />
          </div>

          <p className="mt-3 text-slate-300">{verb.meaningEn}</p>

          {process.env.NODE_ENV === "development" && (
            <Link
              href={`/admin/published-vocabulary/${encodeURIComponent(verb.id)}`}
              className="mt-5 inline-flex items-center gap-2 rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-sm font-medium text-violet-300 transition hover:bg-violet-500/20"
            >
              ✏️ Edit Vocabulary & Generate Examples
            </Link>
          )}

          {auxiliary && (
            <p className="mt-4 text-sm text-emerald-300">
              Perfekt auxiliary: {auxiliary}
            </p>
          )}
        </header>

        {forms.length === 0 && (
          <p className="rounded-xl bg-[#1c2030] p-5 text-slate-300">
            Conjugations have not been added for this verb yet.
          </p>
        )}

        <div className="grid gap-5 md:grid-cols-2">
          {tenseGroups.map((tense) => {
            const selectedForms = forms
              .filter(
                (form) => form.tense === tense.key && form.mood === tense.mood,
              )
              .sort(
                (a, b) =>
                  personOrder.indexOf(a.person) -
                  personOrder.indexOf(b.person),
              );

            if (selectedForms.length === 0) return null;

            return (
              <section
                key={tense.key}
                className="rounded-2xl border border-white/10 bg-[#1c2030] p-5"
              >
                <div className="mb-5">
                  <h2 className="text-xl font-semibold text-violet-300">
                    {tense.title}
                  </h2>
                  <p className="mt-1 text-xs text-slate-400">
                    {tense.explanation}
                  </p>
                </div>

                <div className="space-y-2">
                  {selectedForms.map((form) => (
                    <div
                      key={form.id}
                      className="flex items-center gap-2 rounded-lg bg-[#11131f] p-3"
                    >
                      <span className="w-20 shrink-0 text-sm text-slate-400">
                        {form.person}
                      </span>

                      <span className="min-w-0 flex-1 font-medium text-white">
                        {form.form}
                      </span>

                      <SpeakButton text={`${form.person} ${form.form}`} />
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

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
                    <p className="text-lg font-medium leading-8 text-white">
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

        <footer className="pb-8 text-center text-xs text-slate-500">
          DeutschLab · Learn, Listen, Speak 💜
        </footer>
      </div>
    </main>
  );
}
