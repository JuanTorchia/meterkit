import { z } from "zod";

const stageNameSchema = z.enum([
  "install_complete",
  "server_started",
  "challenge_received",
  "payment_submitted",
  "settlement_finalized",
  "protected_response",
  "replay_rejected",
]);
export const activationReportSchema = z
  .object({
    schemaVersion: z.literal(1),
    reportId: z.string().uuid(),
    participantAlias: z
      .string()
      .regex(/^[a-z0-9][a-z0-9-]{0,31}$/)
      .optional(),
    consentedAt: z.string().datetime(),
    assistance: z.enum(["none", "docs_only", "maintainer_guided"]),
    environment: z.literal("solana-devnet"),
    usefulnessRating: z.number().int().min(1).max(5).optional(),
    repeatedUse: z
      .object({
        validPayments: z.number().int().min(0).max(100_000),
        windowDays: z.number().int().min(1).max(365),
      })
      .strict()
      .optional(),
    stages: z
      .array(
        z
          .object({
            name: stageNameSchema,
            durationMs: z.number().int().min(0).max(86_400_000),
            passed: z.boolean(),
            recordedAt: z.string().datetime(),
          })
          .strict(),
      )
      .max(32),
  })
  .strict();
export type ActivationReport = z.infer<typeof activationReportSchema>;
export type ActivationStageName = z.infer<typeof stageNameSchema>;

export function createActivationReport(input: {
  consent: boolean;
  assistance: ActivationReport["assistance"];
  participantAlias?: string;
}): ActivationReport {
  if (!input.consent) throw new Error("ACTIVATION_CONSENT_REQUIRED");
  return activationReportSchema.parse({
    schemaVersion: 1,
    reportId: crypto.randomUUID(),
    ...(input.participantAlias
      ? { participantAlias: input.participantAlias }
      : {}),
    consentedAt: new Date().toISOString(),
    assistance: input.assistance,
    environment: "solana-devnet",
    stages: [],
  });
}

export function recordActivationStage(
  raw: ActivationReport,
  name: ActivationStageName,
  durationMs: number,
  passed: boolean,
): ActivationReport {
  const report = activationReportSchema.parse(raw);
  return activationReportSchema.parse({
    ...report,
    stages: [
      ...report.stages,
      { name, durationMs, passed, recordedAt: new Date().toISOString() },
    ],
  });
}

export function rateActivation(
  raw: ActivationReport,
  usefulnessRating: number,
): ActivationReport {
  return activationReportSchema.parse({ ...raw, usefulnessRating });
}

export function recordRepeatedUse(
  raw: ActivationReport,
  repeatedUse: { validPayments: number; windowDays: number },
): ActivationReport {
  return activationReportSchema.parse({ ...raw, repeatedUse });
}

export function createActivationExport(raw: ActivationReport) {
  const minimized: Partial<ActivationReport> = {
    ...activationReportSchema.parse(raw),
  };
  delete minimized.participantAlias;
  return minimized;
}

export function createDeletionReceipt(
  raw: ActivationReport,
  deletedAt = new Date(),
) {
  const report = activationReportSchema.parse(raw);
  return {
    schemaVersion: 1 as const,
    reportId: report.reportId,
    deletedAt: deletedAt.toISOString(),
    deletionScope: "local-activation-report" as const,
  };
}

export function toLegacyActivationEvidence(raw: ActivationReport) {
  return {
    schemaVersion: 1 as const,
    classification: "legacy_unverified" as const,
    report: activationReportSchema.parse(raw),
  };
}
