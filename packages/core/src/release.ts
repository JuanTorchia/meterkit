import { z } from "zod";

const sha256IntegritySchema = z.string().regex(/^sha256-[A-Za-z0-9+/]+={0,2}$/);
const sha512IntegritySchema = z.string().regex(/^sha512-[A-Za-z0-9+/]+={0,2}$/);
const integritySchema = z.union([sha256IntegritySchema, sha512IntegritySchema]);
const sourceCommitSchema = z.string().regex(/^[0-9a-f]{40}$/);
const semanticVersionSchema = z
  .string()
  .regex(/^[0-9]+\.[0-9]+\.[0-9]+(?:-[0-9A-Za-z.-]+)?$/);

export const packageArtifactSchema = z
  .object({
    name: z.string().min(1).max(214),
    version: semanticVersionSchema,
    registry: z.string().url(),
    integrity: integritySchema,
    tarballSize: z.number().int().nonnegative(),
    runtimeFiles: z.array(z.string().min(1).max(512)).max(1_000),
    dependencies: z.record(z.string(), z.string()),
    peerDependencies: z.record(z.string(), z.string()),
    engineRange: z.string().min(1).max(128),
    license: z.string().min(1).max(64),
    repository: z.string().url(),
    sourceDirectory: z.string().min(1).max(512),
    provenanceReference: z.string().url().optional(),
    supportStatus: z.enum([
      "primary",
      "supported",
      "experimental",
      "internal",
      "deprecated",
    ]),
  })
  .strict();
export type PackageArtifact = z.infer<typeof packageArtifactSchema>;

export const publicReleaseSchema = z
  .object({
    schemaVersion: z.literal(1),
    version: semanticVersionSchema,
    sourceCommit: sourceCommitSchema,
    tag: z.string().min(1).max(128),
    packages: z.array(packageArtifactSchema).min(1).max(32),
    compatibilityReport: z.string().min(1).max(512),
    sbomReferences: z.array(z.string().min(1).max(512)).min(1).max(32),
    provenanceStatus: z.enum(["staged", "verified", "unavailable", "failed"]),
    migrationImpact: z.enum(["none", "compatible", "breaking"]),
    publishedAt: z.string().datetime().optional(),
    rollback: z.string().min(1).max(2_048),
  })
  .strict()
  .superRefine((release, context) => {
    const identities = new Set<string>();
    for (const artifact of release.packages) {
      const identity = `${artifact.registry}\0${artifact.name}\0${artifact.version}`;
      if (identities.has(identity)) {
        context.addIssue({
          code: "custom",
          message: "release package identities must be unique",
          path: ["packages"],
        });
      }
      identities.add(identity);
    }
    if (
      release.provenanceStatus === "verified" &&
      release.packages.some((artifact) => !artifact.provenanceReference)
    ) {
      context.addIssue({
        code: "custom",
        message: "verified provenance requires a reference for every package",
        path: ["packages"],
      });
    }
  });
export type PublicRelease = z.infer<typeof publicReleaseSchema>;

const percentilesSchema = z
  .object({
    p50Ms: z.number().nonnegative(),
    p95Ms: z.number().nonnegative(),
    p99Ms: z.number().nonnegative(),
  })
  .strict()
  .refine((value) => value.p50Ms <= value.p95Ms && value.p95Ms <= value.p99Ms, {
    message: "latency percentiles must be monotonically increasing",
  });

export const benchmarkRunSchema = z
  .object({
    schemaVersion: z.literal(1),
    runId: z.string().uuid(),
    sourceCommit: sourceCommitSchema,
    startedAt: z.string().datetime(),
    durationMs: z.number().int().positive(),
    environment: z.record(
      z.string(),
      z.union([z.string(), z.number(), z.boolean()]),
    ),
    workload: z
      .object({
        scenario: z.enum([
          "unpaid",
          "policy",
          "paid-retry",
          "replay",
          "dependency-outage",
        ]),
        concurrency: z.number().int().positive(),
        requests: z.number().int().positive(),
        timeoutMs: z.number().int().positive(),
      })
      .strict(),
    latency: z
      .object({ local: percentilesSchema, external: percentilesSchema })
      .strict(),
    outcomes: z.record(z.string(), z.number().int().nonnegative()),
    protectedExecutions: z.number().int().nonnegative(),
    duplicateExecutions: z.literal(0),
    limitations: z.array(z.string().min(1).max(512)).max(64),
    artifacts: z.array(z.string().min(1).max(512)).max(64),
  })
  .strict();
export type BenchmarkRun = z.infer<typeof benchmarkRunSchema>;
