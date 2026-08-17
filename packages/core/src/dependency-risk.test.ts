import { describe, expect, it } from "vitest";

import {
  dependencyEvidenceRecordSchema,
  dependencyRiskExceptionSchema,
  dependencySourceSnapshotSchema,
} from "./dependency-risk.js";

const digest = `sha256:${"a".repeat(64)}`;

describe("dependency risk contracts", () => {
  it("distinguishes an available empty source from an unavailable source", () => {
    expect(
      dependencySourceSnapshotSchema.parse({
        schemaVersion: 1,
        id: "github-alerts-2026-08-17",
        sourceType: "github_alerts",
        observedAt: "2026-08-17T00:00:00.000Z",
        collectorVersion: "1.0.0",
        availability: "available",
        contentHash: digest,
        recordCount: 0,
      }).recordCount,
    ).toBe(0);

    expect(() =>
      dependencySourceSnapshotSchema.parse({
        schemaVersion: 1,
        id: "github-alerts-unavailable",
        sourceType: "github_alerts",
        observedAt: "2026-08-17T00:00:00.000Z",
        collectorVersion: "1.0.0",
        availability: "unavailable",
      }),
    ).toThrow("failure code");
  });

  it("rejects an exception that expires before it was created", () => {
    expect(() =>
      dependencyRiskExceptionSchema.parse({
        schemaVersion: 1,
        id: "exception-1",
        findingIds: ["finding-1"],
        artifactIds: ["artifact-1"],
        rationale: "No compatible patch is currently available.",
        exploitability: "Runtime reachability remains unknown.",
        compensatingControls: ["Disable the affected optional surface."],
        owner: "maintainer",
        approver: "maintainer",
        createdAt: "2026-08-18T00:00:00.000Z",
        expiresAt: "2026-08-17T00:00:00.000Z",
        reviewTrigger: "A compatible patch is released.",
        status: "active",
      }),
    ).toThrow("expiry must be after creation");
  });

  it("cannot call incomplete evidence passed", () => {
    expect(() =>
      dependencyEvidenceRecordSchema.parse({
        schemaVersion: 1,
        generatedAt: "2026-08-17T00:00:00.000Z",
        commit: "a".repeat(40),
        lockfileDigest: digest,
        inventoryDigest: digest,
        sourceSnapshotIds: ["source-1"],
        environmentId: "server-linux-node22",
        artifactDigests: { sdk: digest },
        outcomes: { audit: "unavailable" },
        gate: "passed",
      }),
    ).toThrow("passed evidence cannot contain");
  });
});
