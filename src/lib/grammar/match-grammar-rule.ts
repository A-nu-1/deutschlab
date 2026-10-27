
export type GrammarSuggestion = {
  title: string;
  explanationEn: string;
  exampleFromText: string;
  suggestedLevel: "A1" | "A2" | "B1" | "B2" | "C1";
};

export function matchExistingGrammar(
  suggestion: GrammarSuggestion
): string | null {
  const title =
    suggestion.title.toLocaleLowerCase("de");

  const example =
    suggestion.exampleFromText.toLocaleLowerCase("de");

  if (
    title.includes("obwohl") ||
    (title.includes("concessive") &&
      /\bobwohl\b/u.test(example))
  ) {
    return "subordinate-obwohl";
  }

  if (
    title.includes("weil") ||
    (title.includes("causal") &&
      /\bweil\b/u.test(example))
  ) {
    return "subordinate-weil";
  }

  if (
    title.includes("konjunktiv ii") ||
    title.includes("subjunctive ii")
  ) {
    return "konjunktiv-two";
  }

  if (
    title.includes("n-deklination") ||
    title.includes("n-declension")
  ) {
    return "masculine-n-declension";
  }

  return null;
}
