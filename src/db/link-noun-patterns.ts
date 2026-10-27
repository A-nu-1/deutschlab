
import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { and, eq, isNull } from "drizzle-orm";

import {
  nounPatterns,
  vocabulary,
} from "./schema";

import {
  matchNounPattern,
} from "../lib/grammar/match-noun-pattern";

async function main() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url || !authToken) {
    throw new Error("Missing Turso credentials");
  }

  const client = createClient({ url, authToken });

  try {
    const db = drizzle(client);

    const patterns = await db
      .select()
      .from(nounPatterns);

    const patternMap = new Map(
      patterns.map((p) => [p.slug, p.id])
    );

    const nouns = await db
      .select()
      .from(vocabulary)
      .where(
        and(
          eq(vocabulary.status, "published"),
          eq(vocabulary.partOfSpeech, "noun"),
          isNull(vocabulary.patternId)
        )
      );

    let linked = 0;

    for (const noun of nouns) {
      const slug = matchNounPattern(
        noun.lemma,
        noun.gender
      );

      if (!slug) continue;

      const patternId = patternMap.get(slug);

      if (!patternId) continue;

      await db
        .update(vocabulary)
        .set({ patternId })
        .where(
          and(
            eq(vocabulary.id, noun.id),
            isNull(vocabulary.patternId)
          )
        );

      console.log(`${noun.lemma} → ${slug}`);
      linked++;
    }

    console.log(
      `✅ Linked ${linked} nouns to grammar patterns.`
    );
  } finally {
    client.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
