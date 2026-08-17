export function validateCohortChange({ candidate, cohorts, overrides = {} }) {
  const errors = [];
  const cohort = cohorts.find(({ id }) => id === candidate.cohortId);
  if (!cohort) return { passed: false, errors: [{ code: "COHORT_UNKNOWN" }] };
  const manifests = new Set(cohort.manifests ?? cohort.consumers ?? []);
  for (const path of candidate.manifestPaths ?? []) {
    if (!manifests.has(path))
      errors.push({ code: "CROSS_COHORT_MIGRATION", path });
  }
  for (const [packageName, version] of Object.entries(overrides)) {
    const constraint = cohort.constraints?.[packageName];
    if (!constraint) errors.push({ code: "UNSUPPORTED_OVERRIDE", packageName });
    else if (constraint !== version)
      errors.push({
        code: "COHORT_CONSTRAINT_VIOLATION",
        packageName,
        expected: constraint,
        actual: version,
      });
  }
  return { passed: errors.length === 0, errors };
}
