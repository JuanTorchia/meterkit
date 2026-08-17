import assert from "node:assert/strict";
import test from "node:test";

import { buildDependencyInventory } from "./inventory.mjs";

const observedAt = "2026-08-17T00:00:00.000Z";
const availableSnapshot = (sourceType, id = sourceType) => ({
  schemaVersion: 1,
  id,
  sourceType,
  observedAt,
  collectorVersion: "1.0.0",
  availability: "available",
  contentHash: `sha256:${"a".repeat(64)}`,
  recordCount: 0,
});

test("reports every inaccessible required source instead of returning clean", () => {
  const inventory = buildDependencyInventory({
    snapshots: [availableSnapshot("github_alerts")],
    requiredSourceTypes: ["github_alerts", "package_audit_production"],
    records: [],
    graphRoots: [],
    artifacts: [],
    cohorts: [],
  });
  assert.equal(inventory.status, "incomplete");
  assert.deepEqual(inventory.errors, [
    {
      sourceType: "package_audit_production",
      availability: "unknown",
      code: "REQUIRED_SOURCE_UNAVAILABLE",
    },
  ]);
});

test("accounts for a finding with all affected graph paths", () => {
  const records = [
    {
      sourceId: "audit-1",
      sourceType: "package_audit_production",
      ecosystem: "npm",
      packageName: "vulnerable",
      advisoryId: "GHSA-example",
      title: "Synthetic advisory",
      severity: "high",
    },
  ];
  const inventory = buildDependencyInventory({
    snapshots: [
      availableSnapshot("package_audit_production", "audit-1"),
      availableSnapshot("maintainer_report", "maintainer-1"),
    ],
    requiredSourceTypes: ["package_audit_production", "maintainer_report"],
    records,
    graphRoots: [
      {
        name: "@usemeterkit/sdk",
        version: "0.2.0",
        path: "/repo/packages/sdk",
        dependencies: {
          vulnerable: { name: "vulnerable", version: "1.0.0" },
        },
      },
    ],
    artifacts: [
      {
        id: "@usemeterkit/sdk",
        name: "@usemeterkit/sdk",
        kind: "public_package",
        manifestPath: "packages/sdk/package.json",
        releaseImpact: "unknown",
      },
    ],
    cohorts: [{ id: "x402-solana-kit-5", consumers: ["@usemeterkit/sdk"] }],
  });
  assert.equal(inventory.status, "blocked");
  assert.equal(inventory.findings.length, 1);
  assert.equal(inventory.paths.length, 1);
  assert.equal(inventory.paths[0].cohortId, "x402-solana-kit-5");
});
