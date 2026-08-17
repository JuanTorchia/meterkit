import { describe, expect, it } from "vitest";
import {
  externalActivationEvidenceSchema,
  assertClassificationImmutable,
  qualifiesForCommercialGate,
} from "./self-service-evidence.js";

function evidence(
  classification: "synthetic" | "external_independent",
  milestone:
    | "initializer_started"
    | "first_402"
    | "settlement_finalized"
    | "protected_response"
    | "replay_rejected",
  engagementId = crypto.randomUUID(),
) {
  return externalActivationEvidenceSchema.parse({
    schemaVersion: 1,
    evidenceId: crypto.randomUUID(),
    engagementId,
    classification,
    recordedAt: new Date().toISOString(),
    packageVersion: "0.3.0",
    surface: "express",
    packageManager: "npm",
    milestone,
    outcome: "passed",
    interventionCount: 0,
    ...(milestone === "first_402" ? { durationMs: 300_000 } : {}),
    consents: {
      technicalParticipation: "granted",
      privateEvidenceRetention: "granted",
      daySevenFollowup: "denied",
      aggregateReporting: "granted",
      publicAttribution: "denied",
    },
  });
}

describe("self-service evidence", () => {
  it("never counts synthetic verification as external adoption", () => {
    const synthetic = evidence("synthetic", "initializer_started");
    expect(qualifiesForCommercialGate([synthetic])).toMatchObject({
      starts: 0,
      eligible: false,
    });
  });

  it("keeps classification immutable", () => {
    const first = evidence("synthetic", "initializer_started");
    expect(() =>
      assertClassificationImmutable(first, {
        ...first,
        evidenceId: crypto.randomUUID(),
        classification: "external_independent",
      }),
    ).toThrow("PARTICIPANT_CLASSIFICATION_IMMUTABLE");
  });

  it("requires three starts, two unassisted completions and measured time", () => {
    const records = Array.from({ length: 3 }, () => {
      const id = crypto.randomUUID();
      return (
        [
          "initializer_started",
          "first_402",
          "settlement_finalized",
          "protected_response",
          "replay_rejected",
        ] as const
      ).map((milestone) => evidence("external_independent", milestone, id));
    }).flat();
    expect(qualifiesForCommercialGate(records)).toMatchObject({
      starts: 3,
      completedWithoutCriticalIntervention: 3,
      eligible: true,
    });
  });
});
