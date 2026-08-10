import { z } from "zod";

const stageNameSchema = z.enum(["install_complete", "server_started", "challenge_received", "payment_submitted", "settlement_finalized", "protected_response", "replay_rejected"]);
export const activationReportSchema = z.object({
  schemaVersion: z.literal(1),
  reportId: z.string().uuid(),
  participantAlias: z.string().regex(/^[a-z0-9][a-z0-9-]{0,31}$/).optional(),
  consentedAt: z.string().datetime(),
  assistance: z.enum(["none", "docs_only", "maintainer_guided"]),
  environment: z.literal("solana-devnet"),
  stages: z.array(z.object({
    name: stageNameSchema,
    durationMs: z.number().int().min(0).max(86_400_000),
    passed: z.boolean(),
    recordedAt: z.string().datetime(),
  }).strict()).max(32),
}).strict();
export type ActivationReport = z.infer<typeof activationReportSchema>;
export type ActivationStageName = z.infer<typeof stageNameSchema>;

export function createActivationReport(input: { consent: boolean; assistance: ActivationReport["assistance"]; participantAlias?: string }): ActivationReport {
  if (!input.consent) throw new Error("ACTIVATION_CONSENT_REQUIRED");
  return activationReportSchema.parse({
    schemaVersion: 1, reportId: crypto.randomUUID(),
    ...(input.participantAlias ? { participantAlias: input.participantAlias } : {}),
    consentedAt: new Date().toISOString(), assistance: input.assistance,
    environment: "solana-devnet", stages: [],
  });
}

export function recordActivationStage(raw: ActivationReport, name: ActivationStageName, durationMs: number, passed: boolean): ActivationReport {
  const report = activationReportSchema.parse(raw);
  return activationReportSchema.parse({ ...report, stages: [...report.stages, { name, durationMs, passed, recordedAt: new Date().toISOString() }] });
}
