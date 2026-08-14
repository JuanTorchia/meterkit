import { describe, expect, it } from "vitest";
import {
  addActivationEvent,
  addConsent,
  addIntervention,
  createPilotEngagementFile,
  deriveActivationStatus,
  derivePilotConversionSummary,
  observeDaySevenRetention,
  recordWillingnessToPay,
  withdrawConsent,
} from "./activation-v2.js";
import {
  createActivationReport,
  toLegacyActivationEvidence,
} from "./activation.js";

const startedAt = new Date("2026-08-01T12:00:00.000Z");

function externalPilot() {
  return createPilotEngagementFile(
    {
      participantClass: "external_independent",
      offerVersion: "assisted-pilot-v1",
      disclosedPrice: { amount: "100", currency: "USD", unit: "integration" },
      surface: "mcp",
      source: "public_pilot_page",
      assistanceMode: "docs_only",
    },
    startedAt,
  );
}

describe("pilot activation v2", () => {
  it("derives completion only from independent passing evidence and consent", () => {
    let file = externalPilot();
    file = addConsent(
      file,
      "technical_participation",
      true,
      "terms-v1",
      startedAt,
    );
    file = addConsent(
      file,
      "private_evidence_retention",
      true,
      "terms-v1",
      startedAt,
    );
    for (const stage of [
      "challenge_received",
      "policy_verified",
      "payment_submitted",
      "settlement_finalized",
      "protected_response",
      "replay_rejected",
      "completion_reviewed",
    ] as const) {
      file = addActivationEvent(file, stage, "passed", startedAt);
    }
    expect(deriveActivationStatus(file)).toBe("completed");
    expect(
      deriveActivationStatus({
        ...file,
        engagement: { ...file.engagement, participantClass: "synthetic" },
      }),
    ).not.toBe("completed");
  });

  it("keeps attribution separate and records withdrawal without deleting evidence", () => {
    let file = externalPilot();
    file = addConsent(
      file,
      "technical_participation",
      true,
      "terms-v1",
      startedAt,
    );
    file = addConsent(file, "public_attribution", true, "terms-v1", startedAt);
    file = withdrawConsent(
      file,
      "public_attribution",
      new Date("2026-08-02T12:00:00.000Z"),
    );
    expect(
      file.consents.find((item) => item.scope === "public_attribution")?.status,
    ).toBe("withdrawn");
    expect(
      file.consents.find((item) => item.scope === "technical_participation")
        ?.status,
    ).toBe("granted");
  });

  it("requires elapsed day-seven evidence and captures support separately", () => {
    let file = externalPilot();
    file = addIntervention(file, {
      stage: "challenge_received",
      kind: "pairing",
      reasonCode: "configuration_help",
      actorClass: "maintainer",
      beganAt: startedAt.toISOString(),
      endedAt: new Date(startedAt.getTime() + 10 * 60_000).toISOString(),
    });
    expect(() =>
      observeDaySevenRetention(file, {
        observedAt: new Date("2026-08-07T11:59:59.000Z"),
        outcome: "retained",
        evidenceType: "participant_response",
      }),
    ).toThrow(/day seven/);
    file = observeDaySevenRetention(file, {
      observedAt: new Date("2026-08-08T12:00:00.000Z"),
      outcome: "retained",
      evidenceType: "participant_response",
    });
    expect(file.retentionObservations[0]?.outcome).toBe("retained");
    expect(derivePilotConversionSummary([file]).supportMinutes).toBe(10);
  });

  it("separates willingness to pay from paid integration", () => {
    let file = recordWillingnessToPay(externalPilot(), {
      askedAt: startedAt,
      respondedAt: startedAt,
      response: "yes_at_stated_price",
    });
    let summary = derivePilotConversionSummary([file]);
    expect(summary.willingnessToPay.yes).toBe(1);
    expect(summary.paidIntegrations).toBe(0);
    file = {
      ...file,
      commercialPayments: [
        {
          paymentId: crypto.randomUUID(),
          engagementId: file.engagement.engagementId,
          currency: "USD",
          grossAmount: "100",
          refundedAmount: "0",
          netAmount: "100",
          status: "received_verified",
          receivedAt: startedAt.toISOString(),
          privateEvidenceReference: "private:invoice",
        },
      ],
    };
    summary = derivePilotConversionSummary([file]);
    expect(summary.paidIntegrations).toBe(1);
    expect(summary.commercialRevenueByCurrency).toEqual({ USD: "100" });
  });

  it("keeps v1 evidence explicitly legacy instead of upgrading it", () => {
    const v1 = createActivationReport({ consent: true, assistance: "none" });
    expect(toLegacyActivationEvidence(v1)).toEqual({
      schemaVersion: 1,
      classification: "legacy_unverified",
      report: v1,
    });
  });
});
