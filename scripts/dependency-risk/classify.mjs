export function classifyDependencyPath({
  artifact,
  declaredScope,
  packages,
  paymentBoundaryPackages,
}) {
  const scope =
    artifact.kind === "generated_template"
      ? "generated_project"
      : artifact.kind === "container"
        ? "deployment"
        : declaredScope;
  const requiresPaymentRegression = packages.some((entry) =>
    paymentBoundaryPackages.includes(entry.name),
  );
  const releaseImpact =
    scope === "runtime" ||
    scope === "generated_project" ||
    scope === "deployment" ||
    requiresPaymentRegression
      ? "blocking"
      : "scheduled";
  return {
    scope,
    reachability: "unknown",
    releaseImpact,
    requiresPaymentRegression,
  };
}

export function cohortForConsumer(consumerName, cohorts) {
  return (
    cohorts.find((cohort) => cohort.consumers.includes(consumerName))?.id ??
    "unclassified"
  );
}
