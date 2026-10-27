export type WordEtymology = {
  explanation: string;
  relatedWords?: string[];
  sourceUrl: string;
  sourceName: string;
};

// Small, curated starter collection.
// Expand with verified sources before bulk publication.
const etymologies: Record<string, WordEtymology> = {
  Name: {
    explanation:
      "German Name comes from Middle High German name " +
      "and Old High German namo. It is historically " +
      "related to English name and Latin nomen.",
    relatedWords: ["English: name", "Latin: nomen"],
    sourceName: "Historical etymological dictionary",
    sourceUrl:
      "https://en.wikisource.org/wiki/An_Etymological_Dictionary_of_the_German_Language/Annotated/Name",
  },

  Mädchen: {
    explanation:
      "Mädchen is historically a diminutive related to " +
      "Magd, meaning maiden or maid. Its -chen ending " +
      "also explains why Mädchen is grammatically neuter.",
    relatedWords: ["die Magd", "das Mädel"],
    sourceName: "Wahrig Herkunftswörterbuch",
    sourceUrl: "https://www.wissen.de/wortherkunft/magd",
  },
};

export function getWordEtymology(
  lemma: string
): WordEtymology | null {
  return etymologies[lemma] ?? null;
}

export function getDwdsUrl(lemma: string): string {
  return `https://www.dwds.de/wb/${encodeURIComponent(lemma)}`;
}