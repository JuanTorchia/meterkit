import { describe, expect, it } from "vitest";
import {
  createActivationExport,
  createActivationReport,
  createDeletionReceipt,
  rateActivation,
  recordActivationStage,
  recordRepeatedUse,
} from "./activation.js";

describe("activation evidence", () => {
  it("requires explicit consent and records bounded stages", () => {
    expect(() =>
      createActivationReport({ consent: false, assistance: "none" }),
    ).toThrow("ACTIVATION_CONSENT_REQUIRED");
    const report = createActivationReport({
      consent: true,
      assistance: "docs_only",
      participantAlias: "pilot-1",
    });
    const next = recordActivationStage(
      report,
      "challenge_received",
      1_200,
      true,
    );
    expect(next.stages).toHaveLength(1);
    expect(next.assistance).toBe("docs_only");
    expect(JSON.stringify(next)).not.toMatch(/wallet|email|signature|token/i);
  });
  it("rejects personal identifiers and impossible duration", () => {
    expect(() =>
      createActivationReport({
        consent: true,
        assistance: "none",
        participantAlias: "john@example.com",
      }),
    ).toThrow();
    const report = createActivationReport({
      consent: true,
      assistance: "none",
    });
    expect(() =>
      recordActivationStage(report, "settlement_finalized", -1, true),
    ).toThrow();
  });

  it("records bounded usefulness and repeated-use evidence", () => {
    const report = createActivationReport({
      consent: true,
      assistance: "none",
      participantAlias: "pilot-2",
    });
    const rated = rateActivation(report, 5);
    const repeated = recordRepeatedUse(rated, {
      validPayments: 10,
      windowDays: 7,
    });
    expect(repeated.usefulnessRating).toBe(5);
    expect(repeated.repeatedUse).toEqual({ validPayments: 10, windowDays: 7 });
    expect(() => rateActivation(report, 6)).toThrow();
    expect(() =>
      recordRepeatedUse(report, { validPayments: -1, windowDays: 7 }),
    ).toThrow();
  });

  it("exports minimized evidence and produces an auditable deletion receipt", () => {
    const report = createActivationReport({
      consent: true,
      assistance: "docs_only",
      participantAlias: "pilot-private",
    });
    const exported = createActivationExport(report);
    expect(exported).not.toHaveProperty("participantAlias");
    expect(exported.assistance).toBe("docs_only");
    const deleted = createDeletionReceipt(
      report,
      new Date("2026-08-10T00:00:00.000Z"),
    );
    expect(deleted).toEqual({
      schemaVersion: 1,
      reportId: report.reportId,
      deletedAt: "2026-08-10T00:00:00.000Z",
      deletionScope: "local-activation-report",
    });
  });
});
