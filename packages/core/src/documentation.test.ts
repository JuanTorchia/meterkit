import { describe, expect, it } from "vitest";
import {
  compareDocumentationClaims,
  documentationPageSchema,
} from "./documentation.js";

const page = {
  locale: "en",
  slug: "start/express",
  title: "Protect an Express API",
  description: "Reach a complete devnet payment.",
  section: "Start",
  order: 1,
  contentFingerprint: `sha256:${"c".repeat(64)}`,
  lastReviewedAt: "2026-08-10",
  productVersionRange: ">=0.1.0 <1",
  surface: "express",
  maturity: "recommended",
  claimKeys: ["payments.direct-settlement", "security.no-private-keys"],
} as const;

describe("documentation contracts", () => {
  it("accepts bounded versioned pages and compares bilingual claims", () => {
    const english = documentationPageSchema.parse(page);
    const spanish = documentationPageSchema.parse({
      ...page,
      locale: "es",
      title: "Protege una API Express",
    });
    expect(compareDocumentationClaims(english, spanish)).toEqual({
      equivalent: true,
      missingInEnglish: [],
      missingInSpanish: [],
    });
  });

  it("reports missing translated claims and rejects duplicates", () => {
    const english = documentationPageSchema.parse(page);
    const spanish = documentationPageSchema.parse({
      ...page,
      locale: "es",
      claimKeys: ["payments.direct-settlement"],
    });
    expect(compareDocumentationClaims(english, spanish)).toEqual({
      equivalent: false,
      missingInEnglish: [],
      missingInSpanish: ["security.no-private-keys"],
    });
    expect(() =>
      documentationPageSchema.parse({
        ...page,
        claimKeys: [page.claimKeys[0], page.claimKeys[0]],
      }),
    ).toThrow(/unique/);
  });
});
