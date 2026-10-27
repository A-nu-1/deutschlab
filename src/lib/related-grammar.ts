export type RelatedGrammarMatch = {
  slug: string;
  reason: string;
};

type GrammarDetector = {
  slug: string;
  pattern: RegExp;
  reason: string;
};

const detectors: GrammarDetector[] = [
  {
    slug: "subordinate-obwohl",
    pattern: /\bobwohl\b/iu,
    reason:
      "Obwohl introduces a concessive subordinate clause.",
  },
  {
    slug: "subordinate-weil",
    pattern: /\bweil\b/iu,
    reason:
      "Weil introduces a subordinate clause expressing a reason.",
  },
];

export function detectRelatedGrammar(
  text: string
): RelatedGrammarMatch[] {
  return detectors
    .filter((detector) => detector.pattern.test(text))
    .map(({ slug, reason }) => ({ slug, reason }));
}