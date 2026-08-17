import assert from "node:assert/strict";
import test from "node:test";
import { validateCohortChange } from "./cohorts.mjs";

const cohorts = [
  {
    id: "kit5",
    manifests: ["packages/sdk/package.json"],
    constraints: { "@solana/kit": "5.5.1" },
  },
];

test("rejects unsupported overrides", () => {
  const result = validateCohortChange({
    candidate: {
      cohortId: "kit5",
      manifestPaths: ["packages/sdk/package.json"],
    },
    cohorts,
    overrides: { mystery: "1.0.0" },
  });
  assert.equal(result.errors[0].code, "UNSUPPORTED_OVERRIDE");
});

test("rejects cross-cohort migration and incompatible pins", () => {
  const result = validateCohortChange({
    candidate: {
      cohortId: "kit5",
      manifestPaths: ["packages/subscriptions/package.json"],
    },
    cohorts,
    overrides: { "@solana/kit": "6.10.0" },
  });
  assert.deepEqual(
    result.errors.map(({ code }) => code),
    ["CROSS_COHORT_MIGRATION", "COHORT_CONSTRAINT_VIOLATION"],
  );
});
