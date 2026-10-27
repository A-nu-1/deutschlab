
import { z } from "zod";

export const analysisSchema = z.object({
  summaryEn: z.string().max(1500),

  overallLevel: z.enum([
    "A1", "A2", "B1", "B2", "C1",
  ]),

  vocabulary: z.array(
    z.object({
      word: z.string(),
      lemma: z.string(),
      meaningEn: z.string(),
      partOfSpeech: z.string(),
      gender: z.enum([
        "masculine",
        "feminine",
        "neuter",
        "none",
      ]),
      level: z.enum([
        "A1", "A2", "B1", "B2", "C1",
      ]),
      explanation: z.string(),
    })
  ).max(15),

  grammar: z.array(
    z.object({
      title: z.string(),
      explanationEn: z.string(),
      exampleFromText: z.string(),
      suggestedLevel: z.enum([
        "A1", "A2", "B1", "B2", "C1",
      ]),
    })
  ).max(8),
});

export type TextAnalysis = z.infer<typeof analysisSchema>;


