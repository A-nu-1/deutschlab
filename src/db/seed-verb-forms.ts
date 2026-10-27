
import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { verbForms } from "./schema";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  throw new Error("Missing Turso credentials");
}

const client = createClient({ url, authToken });
const db = drizzle(client);

const persons = [
  "ich",
  "du",
  "er/sie/es",
  "wir",
  "ihr",
  "sie/Sie",
] as const;

type Forms = readonly [
  string, string, string,
  string, string, string
];

const habenPresent: Forms = [
  "habe", "hast", "hat",
  "haben", "habt", "haben",
];

const habenPast: Forms = [
  "hatte", "hattest", "hatte",
  "hatten", "hattet", "hatten",
];

const seinPresent: Forms = [
  "bin", "bist", "ist",
  "sind", "seid", "sind",
];

const seinPast: Forms = [
  "war", "warst", "war",
  "waren", "wart", "waren",
];

const werdenPresent: Forms = [
  "werde", "wirst", "wird",
  "werden", "werdet", "werden",
];

const wuerdePresent: Forms = [
  "würde", "würdest", "würde",
  "würden", "würdet", "würden",
];

function combine(auxiliary: Forms, ending: string): Forms {
  return auxiliary.map((form) => `${form} ${ending}`) as unknown as Forms;
}

type VerbData = {
  key: string;
  infinitive: string;
  auxiliary: "haben" | "sein";
  participle: string;
  present: Forms;
  past: Forms;
  konjunktiv: Forms;
};

const verbs: VerbData[] = [
  {
    key: "verb-machen",
    infinitive: "machen",
    auxiliary: "haben",
    participle: "gemacht",
    present: [
      "mache", "machst", "macht",
      "machen", "macht", "machen",
    ],
    past: [
      "machte", "machtest", "machte",
      "machten", "machtet", "machten",
    ],
    konjunktiv: combine(wuerdePresent, "machen"),
  },
  {
    key: "verb-gehen",
    infinitive: "gehen",
    auxiliary: "sein",
    participle: "gegangen",
    present: [
      "gehe", "gehst", "geht",
      "gehen", "geht", "gehen",
    ],
    past: [
      "ging", "gingst", "ging",
      "gingen", "gingt", "gingen",
    ],
    konjunktiv: combine(wuerdePresent, "gehen"),
  },
  {
    key: "verb-sein",
    infinitive: "sein",
    auxiliary: "sein",
    participle: "gewesen",
    present: seinPresent,
    past: seinPast,
    konjunktiv: [
      "wäre", "wärst", "wäre",
      "wären", "wärt", "wären",
    ],
  },
];

async function main() {
  console.log("🇩🇪 Seeding DeutschLab verb forms...");

  let count = 0;

  for (const verb of verbs) {
    const presentAux =
      verb.auxiliary === "sein"
        ? seinPresent
        : habenPresent;

    const pastAux =
      verb.auxiliary === "sein"
        ? seinPast
        : habenPast;

    const tenses = [
      {
        tense: "present",
        mood: "indicative",
        forms: verb.present,
      },
      {
        tense: "preterite",
        mood: "indicative",
        forms: verb.past,
      },
      {
        tense: "perfect",
        mood: "indicative",
        forms: combine(presentAux, verb.participle),
      },
      {
        tense: "pluperfect",
        mood: "indicative",
        forms: combine(pastAux, verb.participle),
      },
      {
        tense: "future1",
        mood: "indicative",
        forms: combine(werdenPresent, verb.infinitive),
      },
      {
        tense: "konjunktiv2",
        mood: "subjunctive",
        forms: verb.konjunktiv,
      },
    ];

    for (const tense of tenses) {
      for (let i = 0; i < persons.length; i++) {
        const rowId =
          `seed:form:${verb.key}:${tense.tense}:${i}`;

        await db
          .insert(verbForms)
          .values({
            id: rowId,
            vocabularyId: `seed:word:${verb.key}`,
            tense: tense.tense,
            mood: tense.mood,
            person: persons[i],
            form: tense.forms[i],
            auxiliary: verb.auxiliary,
          })
          .onConflictDoUpdate({
            target: [
              verbForms.vocabularyId,
              verbForms.tense,
              verbForms.mood,
              verbForms.person,
            ],
            set: {
              form: tense.forms[i],
              auxiliary: verb.auxiliary,
            },
          });

        count++;
      }
    }

    console.log(`✅ ${verb.infinitive}`);
  }

  console.log(`🎉 ${count} verb forms processed!`);
}

main()
  .catch((error) => {
    console.error("❌ Verb seed failed:", error);
    process.exitCode = 1;
  })
  .finally(() => client.close());
