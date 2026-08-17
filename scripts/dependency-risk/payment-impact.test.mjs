import assert from "node:assert/strict";
import test from "node:test";
import { PAYMENT_REGRESSIONS, verifyPaymentImpact } from "./payment-impact.mjs";

test("x402 changes require every adversarial payment suite", () => {
  const outcomes = Object.fromEntries(
    PAYMENT_REGRESSIONS.map((name) => [name, "passed"]),
  );
  assert.equal(verifyPaymentImpact(["@x402/core"], outcomes).passed, true);
  delete outcomes["restart-replay"];
  assert.equal(
    verifyPaymentImpact(["@x402/core"], outcomes).errors[0].code,
    "PAYMENT_REGRESSION_REQUIRED",
  );
});

test("development-only changes do not invent a payment requirement", () => {
  assert.deepEqual(verifyPaymentImpact(["typescript-eslint"], {}).required, []);
});
