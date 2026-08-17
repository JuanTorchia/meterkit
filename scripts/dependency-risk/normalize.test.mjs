import assert from "node:assert/strict";
import test from "node:test";

import {
  normalizeDependencyRecords,
  requiredSourceGaps,
} from "./normalize.mjs";

const base = {
  sourceType: "github_alerts",
  ecosystem: "npm",
  packageName: "example-package",
  advisoryId: "GHSA-example",
  title: "Synthetic advisory",
  affectedRange: "<2.0.0",
};

test("deduplicates one advisory while preserving provider assessments", () => {
  const result = normalizeDependencyRecords([
    { ...base, sourceId: "audit", severity: "high" },
    {
      ...base,
      sourceId: "github",
      severity: "moderate",
      patchedVersion: "2.0.0",
    },
  ]);
  assert.equal(result.findings.length, 1);
  assert.equal(result.findings[0].severity, "high");
  assert.deepEqual(result.findings[0].sourceIds, ["audit", "github"]);
  assert.equal(result.assessments.length, 2);
});

test("normalization is stable regardless of provider record order", () => {
  const left = { ...base, sourceId: "z-source", severity: "low" };
  const right = { ...base, sourceId: "a-source", severity: "high" };
  assert.deepEqual(
    normalizeDependencyRecords([left, right]),
    normalizeDependencyRecords([right, left]),
  );
});

test("zero available records and unavailable sources remain distinct", () => {
  assert.deepEqual(
    requiredSourceGaps(
      [
        {
          sourceType: "github_alerts",
          availability: "available",
          recordCount: 0,
        },
        { sourceType: "package_audit_production", availability: "unavailable" },
      ],
      ["github_alerts", "package_audit_production", "maintainer_report"],
    ),
    [
      {
        sourceType: "package_audit_production",
        availability: "unavailable",
        code: "REQUIRED_SOURCE_UNAVAILABLE",
      },
      {
        sourceType: "maintainer_report",
        availability: "unknown",
        code: "REQUIRED_SOURCE_UNAVAILABLE",
      },
    ],
  );
});
