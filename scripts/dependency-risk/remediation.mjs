import { canonicalJson, sha256 } from "./model.mjs";

export function verifyCandidateDelta({
  candidate,
  before,
  after,
  changedPaths,
}) {
  const expected = [...candidate.expectedChangedPaths].sort();
  const actual = [...new Set(changedPaths)].sort();
  const errors = [];
  if (canonicalJson(expected) !== canonicalJson(actual)) {
    errors.push({ code: "UNEXPECTED_CHANGED_PATHS", expected, actual });
  }
  const beforePackages = before?.packages ?? {};
  const afterPackages = after?.packages ?? {};
  const allowed = new Set(candidate.allowedPackages ?? []);
  const moved = [
    ...new Set([...Object.keys(beforePackages), ...Object.keys(afterPackages)]),
  ].filter((name) => beforePackages[name] !== afterPackages[name]);
  const unexpectedMovement = moved.filter((name) => !allowed.has(name)).sort();
  if (unexpectedMovement.length > 0) {
    errors.push({
      code: "UNEXPECTED_GRAPH_MOVEMENT",
      packages: unexpectedMovement,
    });
  }
  if (
    candidate.toVersion &&
    candidate.packageName &&
    afterPackages[candidate.packageName] !== candidate.toVersion
  ) {
    errors.push({
      code: "TARGET_VERSION_NOT_RESOLVED",
      packageName: candidate.packageName,
    });
  }
  return {
    passed: errors.length === 0,
    errors,
    beforeDigest: sha256(before ?? {}),
    afterDigest: sha256(after ?? {}),
  };
}
