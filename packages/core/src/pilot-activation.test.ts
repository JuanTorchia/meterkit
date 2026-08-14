import { describe, expect, it } from "vitest";
import {
  commercialPaymentSchema,
  consentGrantSchema,
  fundingTrancheSchema,
  pilotEngagementSchema,
  providerSettlementSchema,
  settlementExportSchema,
} from "./pilot-activation.js";

const owner = "9a4xvgAdtPxJf7eifkCTpUwwqd8Q8u8L6QJzwCCeaiR5";
const productUid = "13818de5-0067-4db4-9f45-1b732b2ddca1";

describe("paid pilot activation contracts", () => {
  it("parses tenant-linked settlements without full proofs", () => {
    const settlement = providerSettlementSchema.parse({
      schemaVersion: 1,
      receiptId: "76a3bd4c-43cf-45de-99fe-e34248ef4146",
      productUid,
      productSlug: "weather",
      decision: "accepted",
      settlement: "unknown",
      network: "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1",
      assetMint: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
      amountAtomic: "10000",
      recipient: owner,
      signatureFingerprint: "sha256:0123456789abcdef",
      reasonCode: "rpc_unavailable",
      policyDecisions: [],
      occurredAt: "2026-08-14T12:00:00.000Z",
      updatedAt: "2026-08-14T12:01:00.000Z",
    });
    expect(settlement.settlement).toBe("unknown");
    expect(settlement).not.toHaveProperty("paymentProof");
  });

  it("keeps pilot classification and every consent scope explicit", () => {
    const engagement = pilotEngagementSchema.parse({
      schemaVersion: 2,
      engagementId: "657ebaa4-4830-425a-8174-bc06fb6d1a43",
      participantClass: "external_independent",
      offerVersion: "assisted-pilot-v1",
      disclosedPrice: { amount: "100", currency: "USD", unit: "integration" },
      surface: "mcp",
      startedAt: "2026-08-14T12:00:00.000Z",
      source: "public_pilot_page",
      assistanceMode: "docs_only",
      operationalOutcome: "active",
      createdAt: "2026-08-14T12:00:00.000Z",
      updatedAt: "2026-08-14T12:00:00.000Z",
    });
    expect(engagement.participantClass).toBe("external_independent");
    expect(() =>
      consentGrantSchema.parse({
        consentId: crypto.randomUUID(),
        engagementId: engagement.engagementId,
        scope: "everything",
        status: "granted",
        termsVersion: "v1",
        capturedAt: "2026-08-14T12:00:00.000Z",
      }),
    ).toThrow();
  });

  it("separates verified commercial cash from grant funding", () => {
    expect(
      commercialPaymentSchema.parse({
        paymentId: crypto.randomUUID(),
        engagementId: crypto.randomUUID(),
        currency: "USD",
        grossAmount: "100",
        refundedAmount: "0",
        netAmount: "100",
        status: "received_verified",
        receivedAt: "2026-08-14T12:00:00.000Z",
        privateEvidenceReference: "private:invoice-1",
      }).status,
    ).toBe("received_verified");
    expect(
      fundingTrancheSchema.parse({
        trancheId: crypto.randomUUID(),
        awardId: crypto.randomUUID(),
        amount: "100",
        currency: "USDG",
        state: "received_verified",
        publicSafeStatus: "received",
      }),
    ).not.toHaveProperty("engagementId");
  });

  it("requires export records and totals to share a frozen snapshot", () => {
    const value = settlementExportSchema.parse({
      schemaVersion: 1,
      exportId: crypto.randomUUID(),
      generatedAt: "2026-08-14T12:02:00.000Z",
      asOf: "2026-08-14T12:01:00.000Z",
      filters: {
        from: "2026-08-01T00:00:00.000Z",
        toExclusive: "2026-09-01T00:00:00.000Z",
        statuses: ["unknown"],
      },
      units: { amountAtomic: "integer string in asset base units" },
      summary: { recordCount: 0, amountAtomicByAssetAndStatus: {} },
      records: [],
    });
    expect(value.summary.recordCount).toBe(0);
  });
});
