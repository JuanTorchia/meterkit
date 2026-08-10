import { describe, expect, it } from "vitest";
import {
  paymentPolicyConfigurationSchema,
  policyDecisionSchema,
  policyEvaluationInputSchema,
} from "./policy.js";

const input = {
  network: "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1",
  assetMint: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
  amountAtomic: "10000",
  recipient: "11111111111111111111111111111111",
  resource: "https://api.example.com:443/premium",
};

describe("payment policy contracts", () => {
  it("accepts bounded configuration and normalized inputs", () => {
    expect(
      paymentPolicyConfigurationSchema.parse({ id: "wallet-risk" }),
    ).toMatchObject({
      mode: "enforce",
      onError: "deny",
      timeoutMs: 2_000,
      maxResponseBytes: 32_768,
    });
    expect(policyEvaluationInputSchema.parse(input)).toEqual(input);
  });

  it("rejects secret-like, unbounded, or arbitrary policy data", () => {
    expect(() =>
      policyEvaluationInputSchema.parse({ ...input, paymentProof: "secret" }),
    ).toThrow();
    expect(() =>
      paymentPolicyConfigurationSchema.parse({ id: "x", timeoutMs: 60_000 }),
    ).toThrow();
    expect(() =>
      policyDecisionSchema.parse({
        policyId: "wallet-risk",
        provider: "fixture",
        outcome: "allow",
        reasonCodes: ["OK"],
        evaluatedAt: new Date().toISOString(),
        metadata: { authorization: "Bearer value" },
      }),
    ).toThrow();
  });
});
