import assert from "node:assert/strict";
import test from "node:test";
import { decideRegistryPromotion } from "./registry-promotion.mjs";

test("registry promotion remains blocked and retains the prior recommendation on failure", () => {
  expectState("failed", "blocked");
});

test("registry promotion becomes eligible only when every cell passes", () => {
  expectState("passed", "eligible");
});

function expectState(status, expected) {
  const decision = decideRegistryPromotion({
    candidateVersion: "0.3.0",
    previousRecommendedVersion: "0.2.0",
    cells: [{ status }],
  });
  assert.equal(decision.state, expected);
  assert.equal(decision.previousRecommendedVersion, "0.2.0");
  assert.equal(decision.rollbackAction, "retain_previous_recommendation");
  assert.equal(decision.decisionTested, true);
}
