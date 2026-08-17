import assert from "node:assert/strict";
import test from "node:test";
import {
  generateDependencyEvidence,
  verifyDependencyEvidence,
} from "./evidence.mjs";

const input = {
  commit: "a".repeat(40),
  lockfile: "lock",
  inventory: { status: "ready" },
  sourceSnapshotIds: ["audit"],
  environmentId: "server",
  artifacts: { sdk: "tarball" },
  outcomes: { audit: "passed" },
};

test("binds lockfile, inventory, environment, commit and artifacts", () => {
  const record = generateDependencyEvidence(input);
  assert.equal(record.gate, "passed");
  assert.equal(verifyDependencyEvidence(record, input).passed, true);
  assert.equal(
    verifyDependencyEvidence(record, { ...input, lockfile: "changed" })
      .errors[0].code,
    "LOCKFILE_DIGEST_MISMATCH",
  );
});

test("unavailable outcomes cannot become a passing gate", () => {
  const record = generateDependencyEvidence({
    ...input,
    outcomes: { audit: "unavailable" },
  });
  assert.equal(record.gate, "incomplete");
  const forged = { ...record, gate: "passed" };
  assert.equal(
    verifyDependencyEvidence(forged, input).errors[0].code,
    "FALSE_PASS",
  );
});
