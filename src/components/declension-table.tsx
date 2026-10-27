"use client";

type Gender = "masculine" | "feminine" | "neuter";

type Props = {
  noun: string;
  gender: Gender;
  genitive?: string | null;
  plural?: string | null;
  nDeclension?: boolean;
};

const genderColors: Record<Gender, string> = {
  masculine: "text-blue-400",
  feminine: "text-pink-400",
  neuter: "text-yellow-400",
};

const articles: Record<
  Gender,
  { nominative: string; accusative: string; dative: string; genitive: string }
> = {
  masculine: {
    nominative: "der",
    accusative: "den",
    dative: "dem",
    genitive: "des",
  },
  feminine: {
    nominative: "die",
    accusative: "die",
    dative: "der",
    genitive: "der",
  },
  neuter: {
    nominative: "das",
    accusative: "das",
    dative: "dem",
    genitive: "des",
  },
};

export default function DeclensionTable({
  noun,
  gender,
  genitive,
  plural,
  nDeclension = false,
}: Props) {
  const color = genderColors[gender];
  const article = articles[gender];

  const declinedForm = nDeclension
    ? noun === "Name"
      ? "Namen"
      : plural || noun
    : noun;

  const rows = [
    {
      caseName: "Nominativ",
      question: "Wer oder was?",
      singular: `${article.nominative} ${noun}`,
      plural: plural ? `die ${plural}` : "—",
    },
    {
      caseName: "Akkusativ",
      question: "Wen oder was?",
      singular: `${article.accusative} ${declinedForm}`,
      plural: plural ? `die ${plural}` : "—",
    },
    {
      caseName: "Dativ",
      question: "Wem?",
      singular: `${article.dative} ${declinedForm}`,
      plural: plural
        ? `den ${plural.endsWith("n") || plural.endsWith("s") ? plural : plural + "n"}`
        : "—",
    },
    {
      caseName: "Genitiv",
      question: "Wessen?",
      singular: `${article.genitive} ${
        genitive || (gender === "feminine" ? noun : declinedForm)
      }`,
      plural: plural ? `der ${plural}` : "—",
    },
  ];

  return (
    <section className="rounded-2xl border border-white/10 bg-[#1c2030] p-6">
      <h2 className="mb-2 text-xl font-semibold">📘 Deklination</h2>

      <p className={`mb-5 text-lg font-bold ${color}`}>
        {article.nominative} {noun}
      </p>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[500px] text-left">
          <thead>
            <tr className="border-b border-white/10 text-sm text-slate-400">
              <th className="p-3">Kasus</th>
              <th className="p-3">Singular</th>
              <th className="p-3">Plural</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row) => (
              <tr key={row.caseName} className="border-b border-white/5">
                <td className="p-3">
                  <p className="font-medium">{row.caseName}</p>
                  <p className="text-xs text-slate-500">{row.question}</p>
                </td>

                <td className={`p-3 font-semibold ${color}`}>
                  {row.singular}
                </td>

                <td className={`p-3 font-semibold ${color}`}>
                  {row.plural}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {nDeclension && (
        <p className="mt-4 rounded-lg bg-violet-500/10 p-3 text-sm text-violet-300">
          💡 This noun belongs to the masculine N-declension group.
          It changes in the accusative, dative and genitive singular.
        </p>
      )}
    </section>
  );
}