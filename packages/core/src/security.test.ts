import { describe, expect, it } from "vitest";
import {
  paymentPolicyConfigurationSchema,
  policyDecisionSchema,
} from "./policy.js";

describe("public contract security boundaries", () => {
  it.each([
    "secret",
    "token",
    "privateKey",
    "signature",
    "authorization",
    "cookie",
  ])("rejects secret-like metadata key %s", (key) =>
    expect(() =>
      policyDecisionSchema.parse({
        policyId: "risk",
        provider: "fixture",
        outcome: "allow",
        reasonCodes: ["CLEAR"],
        evaluatedAt: new Date().toISOString(),
        metadata: { [key]: "sensitive" },
      }),
    ).toThrow(),
  );
  it("rejects unbounded response configuration", () => {
    expect(() =>
      paymentPolicyConfigurationSchema.parse({
        id: "risk",
        maxResponseBytes: 65_537,
      }),
    ).toThrow();
  });
});
