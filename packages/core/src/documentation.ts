import { z } from "zod";

export const documentationLocaleSchema = z.enum(["en", "es"]);
export const documentationMaturitySchema = z.enum([
  "recommended",
  "supported",
  "experimental",
  "deprecated",
]);

export const documentationPageSchema = z
  .object({
    locale: documentationLocaleSchema,
    slug: z.string().regex(/^[a-z0-9]+(?:[/-][a-z0-9]+)*$/),
    title: z.string().min(1).max(120),
    description: z.string().min(1).max(240),
    section: z.string().min(1).max(80),
    order: z.number().int().nonnegative(),
    contentFingerprint: z.string().regex(/^sha256:[0-9a-f]{64}$/),
    lastReviewedAt: z.string().date(),
    productVersionRange: z.string().min(1).max(128),
    surface: z.enum([
      "general",
      "express",
      "next-route",
      "hono",
      "mcp",
      "agent-budget",
    ]),
    maturity: documentationMaturitySchema,
    claimKeys: z.array(z.string().regex(/^[a-z][a-z0-9.-]{2,127}$/)).max(128),
  })
  .strict()
  .refine((page) => new Set(page.claimKeys).size === page.claimKeys.length, {
    message: "documentation claim keys must be unique",
    path: ["claimKeys"],
  });
export type DocumentationPage = z.infer<typeof documentationPageSchema>;

export function compareDocumentationClaims(
  english: DocumentationPage,
  spanish: DocumentationPage,
) {
  if (
    english.locale !== "en" ||
    spanish.locale !== "es" ||
    english.slug !== spanish.slug
  ) {
    return {
      equivalent: false,
      missingInEnglish: [],
      missingInSpanish: [],
    } as const;
  }
  const en = new Set(english.claimKeys);
  const es = new Set(spanish.claimKeys);
  return {
    equivalent: en.size === es.size && [...en].every((key) => es.has(key)),
    missingInEnglish: [...es].filter((key) => !en.has(key)),
    missingInSpanish: [...en].filter((key) => !es.has(key)),
  } as const;
}
