import type { ReactNode } from "react";

type Gender = "masculine" | "feminine" | "neuter";

export type GenderNoun = {
  lemma: string;
  gender: Gender | null;
  partOfSpeech: string;
  plural?: string | null;
  genitive?: string | null;
};

type Props = {
  text: string;
  nouns: GenderNoun[];
  className?: string;
};

const colors: Record<Gender, string> = {
  masculine: "text-blue-400",
  feminine: "text-pink-400",
  neuter: "text-yellow-400",
};

const articleForms = new Set([
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

type Token = {
  text: string;
  start: number;
  end: number;
};

export default function GenderHighlighter({
  text,
  nouns,
  className = "",
}: Props) {
  // Build a lookup from our database vocabulary.
  const knownForms = new Map<string, Set<Gender>>();

  function register(form: string | null | undefined, gender: Gender) {
    if (!form) return;

    const key = form.toLocaleLowerCase("de");

    if (!knownForms.has(key)) {
      knownForms.set(key, new Set());
    }

    knownForms.get(key)!.add(gender);
  }

  for (const noun of nouns) {
    if (noun.partOfSpeech !== "noun" || !noun.gender) {
      continue;
    }

    register(noun.lemma, noun.gender);
    register(noun.plural, noun.gender);
    register(noun.genitive, noun.gender);

    // Register common genitive -s / -es forms when not
    // already explicitly provided by our vocabulary.
    if (noun.gender === "masculine" || noun.gender === "neuter") {
      if (!noun.genitive) {
        register(`${noun.lemma}s`, noun.gender);
        register(`${noun.lemma}es`, noun.gender);
      }
    }

    // Starter support for our seeded masculine
    // N-declension nouns.
    if (
      noun.gender === "masculine" &&
      ["Name", "Junge", "Kollege"].includes(noun.lemma)
    ) {
      register(noun.lemma === "Name" ? "Namen" : noun.plural, noun.gender);
    }
  }

  const tokens: Token[] = Array.from(text.matchAll(/\p{L}+/gu), (match) => ({
    text: match[0],
    start: match.index,
    end: match.index + match[0].length,
  }));

  const highlighted = new Map<number, Gender>();

  tokens.forEach((token, index) => {
    // German nouns are ordinarily capitalized.
    if (!/^\p{Lu}/u.test(token.text)) return;

    const candidates = knownForms.get(token.text.toLocaleLowerCase("de"));

    // Skip unknown and gender-ambiguous forms.
    if (!candidates || candidates.size !== 1) return;

    const gender = Array.from(candidates)[0];

    highlighted.set(index, gender);

    // Color an immediately preceding article as well.
    if (index > 0) {
      const previous = tokens[index - 1];

      const between = text.slice(previous.end, token.start);

      const isAdjacent = /^\s+$/.test(between);

      if (
        isAdjacent &&
        articleForms.has(previous.text.toLocaleLowerCase("de"))
      ) {
        highlighted.set(index - 1, gender);
      }
    }
  });

  const output: ReactNode[] = [];
  let cursor = 0;

  tokens.forEach((token, index) => {
    // Preserve all original spaces and punctuation.
    if (token.start > cursor) {
      output.push(text.slice(cursor, token.start));
    }

    const gender = highlighted.get(index);

    if (gender) {
      output.push(
        <span key={index} className={`font-semibold ${colors[gender]}`}>
          {token.text}
        </span>,
      );
    } else {
      output.push(token.text);
    }

    cursor = token.end;
  });

  if (cursor < text.length) {
    output.push(text.slice(cursor));
  }

  return <span className={className}>{output}</span>;
}
