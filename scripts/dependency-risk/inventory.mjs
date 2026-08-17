import { classifyDependencyPath, cohortForConsumer } from "./classify.mjs";
import {
  normalizeDependencyRecords,
  requiredSourceGaps,
} from "./normalize.mjs";
import { artifactForGraphRoot, extractDependencyPaths } from "./paths.mjs";
import { stableId } from "./model.mjs";

const PAYMENT_BOUNDARY_PACKAGES = [
  "@x402/core",
  "@x402/express",
  "@x402/hono",
  "@x402/next",
  "@x402/mcp",
  "@x402/svm",
  "@solana/kit",
  "@solana/sysvars",
  "@usemeterkit/sdk",
];

function declaredScope(root, targetName) {
  if (root.devDependencies?.[targetName]) return "development";
  return "runtime";
}

export function buildDependencyInventory({
  snapshots,
  requiredSourceTypes,
  records,
  graphRoots,
  artifacts,
  cohorts,
}) {
  const normalized = normalizeDependencyRecords(records);
  const errors = [
    ...requiredSourceGaps(snapshots, requiredSourceTypes),
    ...normalized.errors,
  ];
  const paths = [];

  for (const finding of normalized.findings) {
    for (const graphPath of extractDependencyPaths(
      graphRoots,
      finding.packageName,
    )) {
      const root = graphRoots.find(
        (candidate) => candidate.name === graphPath.rootName,
      );
      const artifact = artifactForGraphRoot(root ?? {}, artifacts);
      if (!root || !artifact) {
        errors.push({
          code: "UNCLASSIFIED_ROOT_ARTIFACT",
          findingId: finding.id,
          rootName: graphPath.rootName,
        });
        continue;
      }
      const classification = classifyDependencyPath({
        artifact,
        declaredScope: declaredScope(root, finding.packageName),
        packages: graphPath.packages,
        paymentBoundaryPackages: PAYMENT_BOUNDARY_PACKAGES,
      });
      paths.push({
        id: `path-${stableId([finding.id, graphPath])}`,
        findingId: finding.id,
        rootArtifactId: artifact.id,
        packages: graphPath.packages,
        scope: classification.scope,
        reachability: classification.reachability,
        releaseImpact: classification.releaseImpact,
        requiresPaymentRegression: classification.requiresPaymentRegression,
        cohortId: cohortForConsumer(root.name, cohorts),
      });
    }
  }

  const hasBlockingFinding = normalized.findings.some((finding) =>
    ["critical", "high"].includes(finding.severity),
  );
  return {
    schemaVersion: 1,
    status:
      errors.length > 0
        ? "incomplete"
        : hasBlockingFinding
          ? "blocked"
          : "ready",
    snapshots: [...snapshots].sort((left, right) =>
      left.id.localeCompare(right.id),
    ),
    findings: normalized.findings,
    assessments: normalized.assessments,
    paths: paths.sort((left, right) => left.id.localeCompare(right.id)),
    artifacts: [...artifacts].sort((left, right) =>
      left.id.localeCompare(right.id),
    ),
    errors,
  };
}

export function sanitizedInventorySummary(inventory) {
  return {
    schemaVersion: inventory.schemaVersion,
    status: inventory.status,
    sourceCounts: Object.fromEntries(
      inventory.snapshots.map((snapshot) => [
        snapshot.sourceType,
        snapshot.availability === "available"
          ? snapshot.recordCount
          : snapshot.availability,
      ]),
    ),
    findingCounts: inventory.findings.reduce((counts, finding) => {
      counts[finding.severity] = (counts[finding.severity] ?? 0) + 1;
      return counts;
    }, {}),
    affectedArtifactCount: new Set(
      inventory.paths.map((path) => path.rootArtifactId),
    ).size,
    errorCodes: inventory.errors.map((error) => error.code).sort(),
  };
}
