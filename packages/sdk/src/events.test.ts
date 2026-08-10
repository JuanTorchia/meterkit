import { describe, expect, it } from "vitest";
import { paymentLifecycleEventSchema } from "./events.js";

describe("payment lifecycle events", () => {
  it("rejects full signatures and unknown sensitive fields", () => {
    expect(
      paymentLifecycleEventSchema.parse({
        schemaVersion: 1,
        type: "policy_evaluated",
        occurredAt: new Date().toISOString(),
        productId: "weather",
        reasonCode: "POLICY_ALLOWED",
      }),
    ).toMatchObject({ type: "policy_evaluated" });
    expect(() =>
      paymentLifecycleEventSchema.parse({
        schemaVersion: 1,
        type: "settled",
        occurredAt: new Date().toISOString(),
        productId: "weather",
        reasonCode: "PAYMENT_ACCEPTED",
        signature: "full-signature",
      }),
    ).toThrow();
  });
});
