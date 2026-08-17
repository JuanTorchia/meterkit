import { z } from "zod";

import {
  initializerPackageManagerSchema,
  initializerSurfaceSchema,
} from "./initializer.js";

export const supportedInitializerPackageManagerSchema = z.enum(["npm", "pnpm"]);
export const durabilityModeSchema = z.enum(["memory", "postgres"]);
export const diagnosticStateSchema = z.enum([
  "passed",
  "failed",
  "unavailable",
  "unknown",
]);

export const initializerRequestSchema = z
  .object({
    schemaVersion: z.literal(1),
    directory: z.string().min(1).max(4_096),
    surface: initializerSurfaceSchema,
    packageManager: initializerPackageManagerSchema,
    recipient: z.string().min(32).max(44),
    install: z.boolean(),
    interactive: z.boolean(),
    outputMode: z.enum(["human", "json"]),
  })
  .strict();

export const initializerResultSchema = z
  .object({
    schemaVersion: z.literal(1),
    state: z.enum(["ready", "written_install_failed"]),
    directory: z.string().min(1).max(4_096),
    surface: initializerSurfaceSchema,
    packageManager: initializerPackageManagerSchema,
    commands: z.array(z.string().min(1).max(1_024)).max(16),
  })
  .strict();

export const diagnosticFindingSchema = z
  .object({
    code: z.string().regex(/^[A-Z][A-Z0-9_]{0,63}$/),
    category: z.string().min(1).max(64),
    state: diagnosticStateSchema,
    summary: z.string().min(1).max(500),
    remediation: z.string().min(1).max(1_000).optional(),
    evidenceRef: z.string().min(1).max(512).optional(),
  })
  .strict();

export const diagnosticReportSchema = z
  .object({
    schemaVersion: z.literal(1),
    generatedAt: z.string().datetime(),
    toolVersion: z.string().min(1).max(64),
    findings: z.array(diagnosticFindingSchema).max(128),
  })
  .strict();

const atomicAmountSchema = z.string().regex(/^(0|[1-9]\d*)$/);

export const paymentSessionSchema = z
  .object({
    schemaVersion: z.literal(1),
    state: z.enum([
      "discovered",
      "policy_validated",
      "confirmed",
      "submitted",
      "settled",
      "protected_response",
      "replay_rejected",
      "closed",
      "refused",
      "timed_out",
      "failed",
      "unknown",
    ]),
    network: z.literal("solana-devnet"),
    mint: z.string().min(32).max(44),
    maximumAmountAtomic: atomicAmountSchema,
    recipient: z.string().min(32).max(44),
    resource: z.string().url(),
    challengeFingerprint: z
      .string()
      .regex(/^sha256:[0-9a-f]{64}$/)
      .optional(),
    payer: z.string().min(32).max(44).optional(),
    signatureFingerprint: z.string().min(8).max(64).optional(),
  })
  .strict();

export const verificationClassificationSchema = z.enum([
  "local_packed",
  "release_candidate",
  "registry_synthetic",
  "external_independent",
]);

export const registryVerificationSchema = z
  .object({
    schemaVersion: z.literal(1),
    classification: z.literal("registry_synthetic"),
    generatedAt: z.string().datetime(),
    packageName: z.string().min(1).max(214),
    packageVersion: z.string().min(1).max(64),
    integrity: z.string().min(1).max(512),
    resolved: z.string().url(),
    os: z.string().min(1).max(64),
    nodeVersion: z.string().min(1).max(64),
    packageManager: supportedInitializerPackageManagerSchema,
    surface: initializerSurfaceSchema,
    status: z.enum(["passed", "failed"]),
  })
  .strict();

export const registrySmokeReportSchema = z
  .object({
    schemaVersion: z.literal(1),
    classification: z.literal("registry_synthetic"),
    generatedAt: z.string().datetime(),
    packageName: z.literal("create-meterkit"),
    packageVersion: z.string().min(1).max(64),
    integrity: z.string().min(1).max(512),
    resolved: z.string().url(),
    os: z.string().min(1).max(64),
    nodeVersion: z.string().min(1).max(64),
    cells: z
      .array(
        z
          .object({
            manager: supportedInitializerPackageManagerSchema,
            surface: initializerSurfaceSchema,
            status: z.enum(["passed", "failed"]),
            protocol: z.enum(["http-402", "mcp-stdio-experimental"]),
          })
          .strict(),
      )
      .min(1)
      .max(8),
    promotion: z
      .object({
        state: z.enum(["eligible", "blocked"]),
        candidateVersion: z.string().min(1).max(64),
        previousRecommendedVersion: z.string().min(1).max(64).nullable(),
        rollbackAction: z.literal("retain_previous_recommendation"),
        decisionTested: z.literal(true),
      })
      .strict(),
  })
  .strict();

export const supportMatrixSchema = z
  .object({
    schemaVersion: z.literal(1),
    status: z.literal("devnet-beta"),
    node: z.array(z.string().min(1).max(32)).min(1),
    surfaces: z.array(initializerSurfaceSchema).min(1),
    experimentalSurfaces: z.array(initializerSurfaceSchema),
    packageManagers: z.array(supportedInitializerPackageManagerSchema).min(1),
    operatingSystems: z.array(z.enum(["linux", "macos", "windows"])).min(1),
    experimentalPackageManagers: z.array(z.enum(["yarn", "bun"])),
  })
  .strict();

export type InitializerRequest = z.infer<typeof initializerRequestSchema>;
export type InitializerResult = z.infer<typeof initializerResultSchema>;
export type DiagnosticFinding = z.infer<typeof diagnosticFindingSchema>;
export type DiagnosticReport = z.infer<typeof diagnosticReportSchema>;
export type PaymentSession = z.infer<typeof paymentSessionSchema>;
export type RegistryVerification = z.infer<typeof registryVerificationSchema>;
export type RegistrySmokeReport = z.infer<typeof registrySmokeReportSchema>;
export type SupportMatrix = z.infer<typeof supportMatrixSchema>;
