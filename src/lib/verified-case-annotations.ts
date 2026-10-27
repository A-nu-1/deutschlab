
export type GrammarCase =
  | "nominative"
  | "accusative"
  | "dative"
  | "genitive";

export type CaseAnnotation = {
  start: number;
  end: number;
  grammarCase: GrammarCase;
  reason: string;
};

type PhraseRule = {
  phrase: string;
  grammarCase: GrammarCase;
  reason: string;
};

type VerifiedSentence = {
  sentence: string;
  phrases: PhraseRule[];
};

// These examples have explicitly checked grammatical cases.
// We do not infer cases from article spelling.
const verifiedSentences: VerifiedSentence[] = [
  {
    sentence: "Ich kenne den Namen des Mannes.",
    phrases: [
      {
        phrase: "den Namen",
        grammarCase: "accusative",
        reason: "Direct object of kennen.",
      },
      {
        phrase: "des Mannes",
        grammarCase: "genitive",
        reason: "Genitive attribute specifying whose name.",
      },
    ],
  },
  {
    sentence: "Die Bedeutung des Namens ist interessant.",
    phrases: [
      {
        phrase: "Die Bedeutung",
        grammarCase: "nominative",
        reason: "Subject of the sentence.",
      },
      {
        phrase: "des Namens",
        grammarCase: "genitive",
        reason: "Genitive attribute of Bedeutung.",
      },
    ],
  },
  {
    sentence: "Die Dame liest die Zeitung.",
    phrases: [
      {
        phrase: "Die Dame",
        grammarCase: "nominative",
        reason: "Subject performing the action.",
      },
      {
        phrase: "die Zeitung",
        grammarCase: "accusative",
        reason: "Direct object of lesen.",
      },
    ],
  },
  {
    sentence: "Das Mädchen spielt im Garten.",
    phrases: [
      {
        phrase: "Das Mädchen",
        grammarCase: "nominative",
        reason: "Subject of spielen.",
      },
      {
        phrase: "im Garten",
        grammarCase: "dative",
        reason:
          "In describes a location here. Im = in dem.",
      },
    ],
  },
  {
    sentence:
      "Der alte Mann gibt der freundlichen Frau das interessante Buch.",
    phrases: [
      {
        phrase: "Der alte Mann",
        grammarCase: "nominative",
        reason: "Subject of geben.",
      },
      {
        phrase: "der freundlichen Frau",
        grammarCase: "dative",
        reason: "Recipient of geben.",
      },
      {
        phrase: "das interessante Buch",
        grammarCase: "accusative",
        reason: "Direct object of geben.",
      },
    ],
  },
];

export const caseStyles: Record<
  GrammarCase,
  {
    label: string;
    color: string;
    style: "solid" | "dashed" | "dotted" | "wavy";
  }
> = {
  nominative: {
    label: "Nominativ",
    color: "#4ADE80",
    style: "solid",
  },
  accusative: {
    label: "Akkusativ",
    color: "#F87171",
    style: "dashed",
  },
  dative: {
    label: "Dativ",
    color: "#FB923C",
    style: "dotted",
  },
  genitive: {
    label: "Genitiv",
    color: "#C084FC",
    style: "wavy",
  },
};

export function getVerifiedCaseAnnotations(
  text: string
): CaseAnnotation[] {
  const annotations: CaseAnnotation[] = [];

  for (const entry of verifiedSentences) {
    let searchFrom = 0;

    while (searchFrom < text.length) {
      const sentenceStart = text.indexOf(
        entry.sentence,
        searchFrom
      );

      if (sentenceStart === -1) break;

      // Only annotate complete sentences, not substrings
      // embedded inside other words.
      const before = text[sentenceStart - 1];
      const after =
        text[sentenceStart + entry.sentence.length];

      const validStart =
        !before || !/[\p{L}\p{N}]/u.test(before);

      const validEnd =
        !after || !/[\p{L}\p{N}]/u.test(after);

      if (validStart && validEnd) {
        for (const phrase of entry.phrases) {
          const relativeStart = entry.sentence.indexOf(
            phrase.phrase
          );

          if (relativeStart === -1) continue;

          const start = sentenceStart + relativeStart;

          annotations.push({
            start,
            end: start + phrase.phrase.length,
            grammarCase: phrase.grammarCase,
            reason: phrase.reason,
          });
        }
      }

      searchFrom = sentenceStart + entry.sentence.length;
    }
  }

  return annotations.sort((a, b) => a.start - b.start);
}
