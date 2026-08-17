import { dependencySourceSnapshotSchema } from "../../packages/core/dist/index.js";

import { canonicalJson, redact, sha256, stableId } from "./model.mjs";

export const SOURCE_TYPES = Object.freeze([
  "github_alerts",
  "github_updates",
  "package_audit_production",
  "package_audit_development",
  "manifests_lockfile",
  "sbom",
  "maintainer_report",
]);

function snapshotId(sourceType, observedAt) {
  return `${sourceType}-${stableId([sourceType, observedAt])}`;
}

export function availableSourceSnapshot({
  sourceType,
  observedAt,
  collectorVersion,
  records,
  evidenceRef,
}) {
  const sanitizedRecords = redact(records);
  const snapshot = {
    schemaVersion: 1,
    id: snapshotId(sourceType, observedAt),
    sourceType,
    observedAt,
    collectorVersion,
    availability: "available",
    contentHash: sha256(canonicalJson(sanitizedRecords)),
    recordCount: records.length,
    ...(evidenceRef ? { evidenceRef } : {}),
  };
  return {
    snapshot: dependencySourceSnapshotSchema.parse(snapshot),
    records: sanitizedRecords,
  };
}

export function unavailableSourceSnapshot({
  sourceType,
  observedAt,
  collectorVersion,
  availability = "unavailable",
  failureCode,
  evidenceRef,
}) {
  return dependencySourceSnapshotSchema.parse({
    schemaVersion: 1,
    id: snapshotId(sourceType, observedAt),
    sourceType,
    observedAt,
    collectorVersion,
    availability,
    failureCode,
    ...(evidenceRef ? { evidenceRef } : {}),
  });
}

export function maintainerReportSnapshot(input) {
  return availableSourceSnapshot({
    ...input,
    sourceType: "maintainer_report",
  });
}
