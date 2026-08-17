import { stableId } from "./model.mjs";

const SEVERITY_ORDER = Object.freeze({
  unknown: 0,
  low: 1,
  moderate: 2,
  high: 3,
  critical: 4,
});

function findingKey(record) {
  return [
    record.ecosystem.toLowerCase(),
    record.packageName.toLowerCase(),
    record.advisoryId ??
      stableId([
        record.sourceType,
        record.title,
        record.affectedRange ?? "unknown-range",
      ]),
  ].join(":");
}

export function normalizeDependencyRecords(records) {
  const groups = new Map();
  const errors = [];

  for (const record of records) {
    if (
      !record.sourceId ||
      !record.sourceType ||
      !record.ecosystem ||
      !record.packageName ||
      !record.title
    ) {
      errors.push({
        code: "INVALID_SOURCE_RECORD",
        sourceId: record.sourceId ?? "unknown",
      });
      continue;
    }
    const key = findingKey(record);
    const group = groups.get(key) ?? [];
    group.push(record);
    groups.set(key, group);
  }

  const findings = [];
  const assessments = [];
  for (const [key, group] of [...groups].sort(([left], [right]) =>
    left.localeCompare(right),
  )) {
    const ordered = [...group].sort((left, right) =>
      left.sourceId.localeCompare(right.sourceId),
    );
    const strongest = ordered.reduce((current, candidate) =>
      (SEVERITY_ORDER[candidate.severity ?? "unknown"] ?? 0) >
      (SEVERITY_ORDER[current.severity ?? "unknown"] ?? 0)
        ? candidate
        : current,
    );
    const first = ordered[0];
    findings.push({
      id: key,
      ecosystem: first.ecosystem,
      packageName: first.packageName,
      ...(first.advisoryId ? { advisoryId: first.advisoryId } : {}),
      title: first.title,
      severity: strongest.severity ?? "unknown",
      sourceIds: [...new Set(ordered.map((record) => record.sourceId))],
    });
    assessments.push(
      ...ordered.map((record) => ({
        findingId: key,
        sourceId: record.sourceId,
        severity: record.severity ?? "unknown",
        affectedRange: record.affectedRange ?? null,
        patchedVersion: record.patchedVersion ?? null,
      })),
    );
  }

  return { findings, assessments, errors };
}

export function requiredSourceGaps(snapshots, requiredSourceTypes) {
  const byType = new Map(
    snapshots.map((snapshot) => [snapshot.sourceType, snapshot]),
  );
  return requiredSourceTypes
    .filter(
      (sourceType) => byType.get(sourceType)?.availability !== "available",
    )
    .map((sourceType) => ({
      sourceType,
      availability: byType.get(sourceType)?.availability ?? "unknown",
      code: "REQUIRED_SOURCE_UNAVAILABLE",
    }));
}
