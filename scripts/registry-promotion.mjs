export function decideRegistryPromotion({
  candidateVersion,
  previousRecommendedVersion = null,
  cells,
}) {
  const eligible =
    cells.length > 0 && cells.every(({ status }) => status === "passed");
  return {
    state: eligible ? "eligible" : "blocked",
    candidateVersion,
    previousRecommendedVersion,
    rollbackAction: "retain_previous_recommendation",
    decisionTested: true,
  };
}
