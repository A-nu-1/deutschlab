
export type NounGender =
  | "masculine"
  | "feminine"
  | "neuter";

export function matchNounPattern(
  lemma: string,
  gender: NounGender | null,
): string | null {
  const noun = lemma.trim().toLocaleLowerCase("de");

  if (!noun || !gender) return null;

  // Only match patterns when the noun's gender
  // has already been verified by the reviewer.
  if (gender === "feminine") {
    if (noun.endsWith("ung")) {
      return "feminine-ung";
    }

    if (
      noun.endsWith("heit") ||
      noun.endsWith("keit")
    ) {
      return "feminine-heit-keit";
    }
  }

  if (gender === "neuter") {
    if (noun.endsWith("chen")) {
      return "neuter-chen";
    }

    if (noun.endsWith("lein")) {
      return "neuter-lein";
    }
  }

  return null;
}
