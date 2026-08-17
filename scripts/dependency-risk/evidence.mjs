import { canonicalJson, sha256 } from "./model.mjs";

export function generateDependencyEvidence({
  commit,
  lockfile,
  inventory,
  sourceSnapshotIds,
  environmentId,
  artifacts,
  outcomes,
}) {
  const normalizedOutcomes = Object.fromEntries(
    Object.entries(outcomes).sort(([a], [b]) => a.localeCompare(b)),
  );
  const gate = Object.values(normalizedOutcomes).some(
    (value) => value === "failed",
  )
    ? "failed"
    : Object.values(normalizedOutcomes).some((value) => value === "unavailable")
      ? "incomplete"
      : "passed";
  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    commit,
    lockfileDigest: sha256(lockfile),
    inventoryDigest: sha256(inventory),
    sourceSnapshotIds: [...sourceSnapshotIds].sort(),
    environmentId,
    artifactDigests: Object.fromEntries(
      Object.entries(artifacts)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([name, content]) => [name, sha256(content)]),
    ),
    outcomes: normalizedOutcomes,
    gate,
  };
}

export function verifyDependencyEvidence(record, actual) {
  const errors = [];
  if (record.lockfileDigest !== sha256(actual.lockfile))
    errors.push({ code: "LOCKFILE_DIGEST_MISMATCH" });
  if (record.inventoryDigest !== sha256(actual.inventory))
    errors.push({ code: "INVENTORY_DIGEST_MISMATCH" });
  for (const [name, digest] of Object.entries(record.artifactDigests))
    if (digest !== sha256(actual.artifacts[name]))
      errors.push({ code: "ARTIFACT_DIGEST_MISMATCH", artifact: name });
  if (
    record.gate === "passed" &&
    Object.values(record.outcomes).some(
      (value) => !["passed", "not_required"].includes(value),
    )
  )
    errors.push({ code: "FALSE_PASS" });
  return {
    passed: errors.length === 0,
    errors,
    digest: sha256(canonicalJson(record)),
  };
}
