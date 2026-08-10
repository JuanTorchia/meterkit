import { describe, expect, it } from "vitest";
import { validateSettlementEvidence } from "./evidence.js";

const receipt = {
  schemaVersion: 1 as const,
  receiptId: "73ad9f61-a603-46b7-b735-69cf6dd2da0e",
  productId: "weather",
  network: "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1" as const,
  assetMint: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
  amountAtomic: "10000",
  recipient: "11111111111111111111111111111111",
  resource: "https://api.example.com/premium",
  decision: "accepted" as const,
  settlement: "finalized" as const,
  signatureFingerprint: "sha256:0123456789abcdef",
  policyDecisions: [],
  createdAt: "2026-08-10T00:00:00.000Z",
  updatedAt: "2026-08-10T00:01:00.000Z",
  reasonCode: "PAYMENT_ACCEPTED",
};

describe("settlement evidence", () => {
  it("distinguishes settlement evidence from readiness", () => {
    const result = validateSettlementEvidence({
      receipt,
      replay: { rejected: true, status: 409, protectedExecutions: 1 },
    });
    expect(result).toMatchObject({ passed: true, proofLevel: "settlement" });
  });

  it("rejects replay acceptance and full signatures", () => {
    expect(() =>
      validateSettlementEvidence({
        receipt,
        replay: { rejected: false, status: 200, protectedExecutions: 2 },
      }),
    ).toThrow();
    expect(() =>
      validateSettlementEvidence({
        receipt: { ...receipt, signature: "full" },
        replay: { rejected: true, status: 409, protectedExecutions: 1 },
      }),
    ).toThrow();
  });
});
