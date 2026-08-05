import { describe, expect, it } from "vitest";
import { verifyEndpoint } from "./index.js";

const requirement = {
  x402Version: 2,
  accepts: [{
    scheme: "exact",
    network: "solana:devnet",
    amount: "10000",
    asset: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
    payTo: "9a4xvgAdtPxJf7eifkCTpUwwqd8Q8u8L6QJzwCCeaiR5",
    maxTimeoutSeconds: 300,
  }],
};
const acceptedRequirement = requirement.accepts[0]!;

describe("pilot endpoint verifier", () => {
  it("accepts a policy-matching x402 endpoint", async () => {
    const report = await verifyEndpoint("https://api.example.test/premium", {
      network: "solana:devnet",
      mint: acceptedRequirement.asset,
      recipient: acceptedRequirement.payTo,
      maxAmountAtomic: "10000",
    }, async () => new Response(null, {
      status: 402,
      headers: { "PAYMENT-REQUIRED": Buffer.from(JSON.stringify(requirement)).toString("base64") },
    }));
    expect(report.passed).toBe(true);
    expect(report.requirement?.amountAtomic).toBe("10000");
  });

  it("fails closed when amount or recipient violates policy", async () => {
    const report = await verifyEndpoint("https://api.example.test/premium", {
      recipient: "7NXuBzJ3EQV4CuxpSVELD3t1bs5xZ6ocfGvwjFDbCZUE",
      maxAmountAtomic: "9999",
    }, async () => new Response(null, {
      status: 402,
      headers: { "PAYMENT-REQUIRED": Buffer.from(JSON.stringify(requirement)).toString("base64") },
    }));
    expect(report.passed).toBe(false);
    expect(report.checks.filter((check) => !check.ok)).toHaveLength(2);
  });

  it("rejects a non-402 endpoint without throwing", async () => {
    const report = await verifyEndpoint("https://api.example.test/open", {}, async () =>
      new Response("ok", { status: 200 }));
    expect(report.passed).toBe(false);
    expect(report.checks[0]?.error).toContain("expected 402");
  });
});
