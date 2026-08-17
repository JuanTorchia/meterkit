import assert from "node:assert/strict";
import test from "node:test";
import { sha256 } from "./model.mjs";
import { evaluateDependencyGate } from "./gate.mjs";

function valid() {
  const inventory = { findings: [], errors: [] };
  return {
    inventory,
    evidence: {
      lockfileDigest: sha256("lock"),
      inventoryDigest: sha256(inventory),
      outcomes: { tests: "passed" },
    },
    actual: { lockfile: "lock" },
  };
}

test("passes only complete digest-bound evidence", () =>
  assert.equal(evaluateDependencyGate(valid()).gate, "passed"));
test("blocks severe findings, stale exceptions and digest mismatch with stable rules", () => {
  const input = valid();
  input.inventory.findings.push({ severity: "high", lifecycle: "reachable" });
  input.exceptions = [
    { status: "active", expiresAt: "2026-08-16T00:00:00.000Z" },
  ];
  const result = evaluateDependencyGate({
    ...input,
    now: new Date("2026-08-17T00:00:00.000Z"),
  });
  assert.deepEqual(
    result.rules.filter(({ passed }) => !passed).map(({ code }) => code),
    ["NO_UNRESOLVED_SEVERE_FINDINGS", "EXCEPTIONS_CURRENT", "INVENTORY_BOUND"],
  );
});
test("unavailable sources and evidence are incomplete, never clean", () => {
  const result = evaluateDependencyGate({
    inventory: {
      findings: [],
      errors: [{ code: "REQUIRED_SOURCE_UNAVAILABLE" }],
    },
    actual: { lockfile: "" },
  });
  assert.equal(result.gate, "incomplete");
});
