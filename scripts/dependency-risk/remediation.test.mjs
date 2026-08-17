import assert from "node:assert/strict";
import test from "node:test";
import { verifyCandidateDelta } from "./remediation.mjs";

const candidate = {
  packageName: "safe-update",
  toVersion: "2.0.0",
  allowedPackages: ["safe-update"],
  expectedChangedPaths: ["package.json", "pnpm-lock.yaml"],
};

test("accepts only the declared manifest, lockfile and package movement", () => {
  const result = verifyCandidateDelta({
    candidate,
    before: { packages: { "safe-update": "1.0.0" } },
    after: { packages: { "safe-update": "2.0.0" } },
    changedPaths: ["pnpm-lock.yaml", "package.json"],
  });
  assert.equal(result.passed, true);
});

test("rejects an undeclared file or transitive graph movement", () => {
  const result = verifyCandidateDelta({
    candidate,
    before: { packages: { "safe-update": "1.0.0", surprise: "1" } },
    after: { packages: { "safe-update": "2.0.0", surprise: "2" } },
    changedPaths: ["package.json", "pnpm-lock.yaml", "README.md"],
  });
  assert.deepEqual(
    result.errors.map(({ code }) => code),
    ["UNEXPECTED_CHANGED_PATHS", "UNEXPECTED_GRAPH_MOVEMENT"],
  );
});
