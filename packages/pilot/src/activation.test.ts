import { describe, expect, it } from "vitest";
import { createActivationReport, recordActivationStage } from "./activation.js";

describe("activation evidence", () => {
  it("requires explicit consent and records bounded stages", () => {
    expect(() => createActivationReport({ consent: false, assistance: "none" })).toThrow("ACTIVATION_CONSENT_REQUIRED");
    const report = createActivationReport({ consent: true, assistance: "docs_only", participantAlias: "pilot-1" });
    const next = recordActivationStage(report, "challenge_received", 1_200, true);
    expect(next.stages).toHaveLength(1);
    expect(next.assistance).toBe("docs_only");
    expect(JSON.stringify(next)).not.toMatch(/wallet|email|signature|token/i);
  });
  it("rejects personal identifiers and impossible duration", () => {
    expect(() => createActivationReport({ consent: true, assistance: "none", participantAlias: "john@example.com" })).toThrow();
    const report = createActivationReport({ consent: true, assistance: "none" });
    expect(() => recordActivationStage(report, "settlement_finalized", -1, true)).toThrow();
  });
});
