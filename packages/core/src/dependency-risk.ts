import { z } from "zod";

export const dependencySourceAvailabilitySchema = z.enum([
  "available",
  "unavailable",
  "unauthorized",
  "partial",
  "unknown",
]);

export const dependencySourceSnapshotSchema = z
  .object({
    schemaVersion: z.literal(1),
    id: z.string().min(1).max(200),
    sourceType: z.enum([
      "github_alerts",
      "github_updates",
      "package_audit_production",
      "package_audit_development",
      "manifests_lockfile",
      "sbom",
      "maintainer_report",
    ]),
    observedAt: z.string().datetime(),
    collectorVersion: z.string().min(1).max(64),
    availability: dependencySourceAvailabilitySchema,
    contentHash: z
      .string()
      .regex(/^sha256:[0-9a-f]{64}$/)
      .optional(),
    evidenceRef: z.string().min(1).max(512).optional(),
    failureCode: z
      .string()
      .regex(/^[A-Z][A-Z0-9_]{0,63}$/)
      .optional(),
    recordCount: z.number().int().nonnegative().optional(),
  })
  .strict()
  .superRefine((snapshot, context) => {
    if (snapshot.availability === "available" && !snapshot.contentHash) {
      context.addIssue({
        code: "custom",
        path: ["contentHash"],
        message: "available source snapshots require a content hash",
      });
    }
    if (snapshot.availability !== "available" && !snapshot.failureCode) {
      context.addIssue({
        code: "custom",
        path: ["failureCode"],
        message: "unavailable source snapshots require a failure code",
      });
    }
  });

export const dependencyFindingLifecycleSchema = z.enum([
  "detected",
  "classified",
  "affected",
  "reachable",
  "remediated",
  "accepted",
  "disputed",
  "verified",
  "withdrawn",
]);

export const dependencyFindingSchema = z
  .object({
    schemaVersion: z.literal(1),
    id: z.string().min(1).max(256),
    ecosystem: z.string().min(1).max(64),
    packageName: z.string().min(1).max(214),
    advisoryId: z.string().min(1).max(128).optional(),
    title: z.string().min(1).max(500),
    severity: z.enum(["critical", "high", "moderate", "low", "unknown"]),
    affectedRange: z.string().min(1).max(512).optional(),
    patchedVersion: z.string().min(1).max(128).optional(),
    lifecycle: dependencyFindingLifecycleSchema,
    sourceIds: z.array(z.string().min(1).max(200)).min(1),
    firstObservedAt: z.string().datetime(),
    lastObservedAt: z.string().datetime(),
    owner: z.string().min(1).max(200).optional(),
    nextAction: z.string().min(1).max(1_000).optional(),
  })
  .strict();

export const dependencyPathSchema = z
  .object({
    schemaVersion: z.literal(1),
    findingId: z.string().min(1).max(256),
    rootArtifactId: z.string().min(1).max(256),
    packages: z
      .array(
        z
          .object({
            name: z.string().min(1).max(214),
            version: z.string().min(1).max(128),
          })
          .strict(),
      )
      .min(1),
    scope: z.enum([
      "runtime",
      "development",
      "build",
      "generated_project",
      "deployment",
    ]),
    reachability: z.enum(["confirmed", "likely", "unreachable", "unknown"]),
    cohortId: z.string().min(1).max(128),
    evidenceRef: z.string().min(1).max(512).optional(),
    observedAt: z.string().datetime(),
  })
  .strict();

export const affectedArtifactSchema = z
  .object({
    schemaVersion: z.literal(1),
    id: z.string().min(1).max(256),
    kind: z.enum([
      "public_package",
      "deployed_app",
      "example",
      "generated_template",
      "container",
      "development_tool",
    ]),
    name: z.string().min(1).max(214),
    version: z.string().min(1).max(128).optional(),
    manifestPath: z.string().min(1).max(1_024),
    digest: z
      .string()
      .regex(/^sha256:[0-9a-f]{64}$/)
      .optional(),
    releaseImpact: z.enum(["blocking", "scheduled", "none", "unknown"]),
  })
  .strict();

export const compatibilityCohortSchema = z
  .object({
    schemaVersion: z.literal(1),
    id: z.string().regex(/^[a-z0-9][a-z0-9_-]{0,127}$/),
    purpose: z.string().min(1).max(500),
    consumers: z.array(z.string().min(1).max(214)).min(1),
    constraints: z.record(z.string().min(1), z.string().min(1)),
    requiredChecks: z.array(z.string().min(1).max(200)).min(1),
  })
  .strict();

export const remediationCandidateSchema = z
  .object({
    schemaVersion: z.literal(1),
    id: z.string().min(1).max(256),
    findingIds: z.array(z.string().min(1).max(256)).min(1),
    cohortId: z.string().min(1).max(128),
    action: z.enum(["upgrade", "replace", "remove", "constrain"]),
    fromVersion: z.string().min(1).max(128).optional(),
    toVersion: z.string().min(1).max(128).optional(),
    expectedChangedPaths: z.array(z.string().min(1).max(1_024)).min(1),
    requiredChecks: z.array(z.string().min(1).max(200)).min(1),
    rollback: z.string().min(1).max(2_000),
    state: z.enum([
      "proposed",
      "testing",
      "failed",
      "verified",
      "released",
      "rolled_back",
    ]),
  })
  .strict();

export const dependencyRiskExceptionSchema = z
  .object({
    schemaVersion: z.literal(1),
    id: z.string().min(1).max(256),
    findingIds: z.array(z.string().min(1).max(256)).min(1),
    artifactIds: z.array(z.string().min(1).max(256)).min(1),
    rationale: z.string().min(1).max(2_000),
    exploitability: z.string().min(1).max(2_000),
    compensatingControls: z.array(z.string().min(1).max(1_000)).min(1),
    owner: z.string().min(1).max(200),
    approver: z.string().min(1).max(200),
    createdAt: z.string().datetime(),
    expiresAt: z.string().datetime(),
    reviewTrigger: z.string().min(1).max(1_000),
    status: z.enum(["active", "expired", "superseded", "revoked", "closed"]),
  })
  .strict()
  .refine(
    (exception) =>
      new Date(exception.expiresAt).getTime() >
      new Date(exception.createdAt).getTime(),
    {
      path: ["expiresAt"],
      message: "risk exception expiry must be after creation",
    },
  );

const digestSchema = z.string().regex(/^sha256:[0-9a-f]{64}$/);
export const dependencyEvidenceRecordSchema = z
  .object({
    schemaVersion: z.literal(1),
    generatedAt: z.string().datetime(),
    commit: z.string().regex(/^[0-9a-f]{40}$/),
    lockfileDigest: digestSchema,
    inventoryDigest: digestSchema,
    sourceSnapshotIds: z.array(z.string().min(1).max(200)).min(1),
    environmentId: z.string().min(1).max(256),
    artifactDigests: z.record(z.string().min(1), digestSchema),
    outcomes: z.record(
      z.string().min(1),
      z.enum(["passed", "failed", "unavailable", "not_required"]),
    ),
    gate: z.enum(["passed", "failed", "incomplete"]),
  })
  .strict()
  .refine(
    (record) =>
      record.gate !== "passed" ||
      Object.values(record.outcomes).every(
        (outcome) => outcome === "passed" || outcome === "not_required",
      ),
    {
      path: ["gate"],
      message: "passed evidence cannot contain failed or unavailable outcomes",
    },
  );

export type DependencySourceSnapshot = z.infer<
  typeof dependencySourceSnapshotSchema
>;
export type DependencyFinding = z.infer<typeof dependencyFindingSchema>;
export type DependencyPath = z.infer<typeof dependencyPathSchema>;
export type AffectedArtifact = z.infer<typeof affectedArtifactSchema>;
export type CompatibilityCohort = z.infer<typeof compatibilityCohortSchema>;
export type RemediationCandidate = z.infer<typeof remediationCandidateSchema>;
export type DependencyRiskException = z.infer<
  typeof dependencyRiskExceptionSchema
>;
export type DependencyEvidenceRecord = z.infer<
  typeof dependencyEvidenceRecordSchema
>;
