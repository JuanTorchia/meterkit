import { describe, expect, it } from "vitest";
import { fingerprintSignature, publicPaymentReceiptSchema } from "./receipt.js";

describe("public payment receipts", () => {
  it("creates irreversible stable signature fingerprints", () => {
    expect(fingerprintSignature("3yAbWL8VpRZ3FfPfQ2GduDcm8x9eewm1")).toMatch(/^sha256:[0-9a-f]{16}$/);
    expect(fingerprintSignature("one")).not.toBe(fingerprintSignature("two"));
  });

  it("rejects non-devnet, full signatures, and invalid state ordering", () => {
    const base = {
      schemaVersion: 1,
      receiptId: crypto.randomUUID(),
      productId: "weather",
      network: "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1",
      assetMint: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
      amountAtomic: "10000",
      recipient: "11111111111111111111111111111111",
      resource: "https://api.example.com:443/premium",
      decision: "accepted",
      settlement: "finalized",
      policyDecisions: [],
      createdAt: "2026-08-10T00:00:00.000Z",
      updatedAt: "2026-08-10T00:00:01.000Z",
      reasonCode: "PAYMENT_ACCEPTED",
    } as const;
    expect(publicPaymentReceiptSchema.parse(base)).toEqual(base);
    expect(() => publicPaymentReceiptSchema.parse({ ...base, signature: "full" })).toThrow();
    expect(() => publicPaymentReceiptSchema.parse({
      ...base,
      updatedAt: "2026-08-09T00:00:00.000Z",
    })).toThrow();
  });
});
