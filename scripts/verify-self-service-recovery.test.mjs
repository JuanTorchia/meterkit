import assert from "node:assert/strict";
import test from "node:test";
import { runRecoveryMatrix } from "./verify-self-service-recovery.mjs";

test("every recovery fixture is non-success and sanitized", async () => {
  const results = await runRecoveryMatrix();
  assert.equal(results.length, 11);
  assert.equal(results.filter(({ state }) => state === "passed").length, 0);
  assert.equal(results.filter(({ state }) => state === "unknown").length, 2);
  assert.ok(results.some(({ code }) => code === "DATABASE_UNAVAILABLE"));
  assert.ok(results.some(({ code }) => code === "RPC_UNAVAILABLE"));
});
