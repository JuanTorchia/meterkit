import { z } from "zod";
import {
  participantClassSchema,
  registryVerificationSchema,
} from "@usemeterkit/core";

const milestoneSchema = z.enum([
  "initializer_started",
  "first_402",
  "settlement_finalized",
  "protected_response",
  "replay_rejected",
  "day_7_retained",
]);
const consentStatusSchema = z.enum(["granted", "denied", "withdrawn"]);
const scopedConsentsSchema = z
  .object({
    technicalParticipation: consentStatusSchema,
    privateEvidenceRetention: consentStatusSchema,
    daySevenFollowup: consentStatusSchema,
    aggregateReporting: consentStatusSchema,
    publicAttribution: consentStatusSchema,
  })
  .strict();

export const externalActivationEvidenceSchema = z
  .object({
    schemaVersion: z.literal(1),
    evidenceId: z.string().uuid(),
    engagementId: z.string().uuid(),
    classification: participantClassSchema,
    recordedAt: z.string().datetime(),
    packageVersion: z.string().min(1).max(64),
    surface: z.enum(["express", "next-route", "hono", "mcp"]),
    packageManager: z.enum(["npm", "pnpm"]),
    milestone: milestoneSchema,
    outcome: z.enum(["passed", "failed", "unknown", "abandoned"]),
    interventionCount: z.number().int().min(0).max(100),
    durationMs: z.number().int().min(0).max(86_400_000).optional(),
    endpointHash: z
      .string()
      .regex(/^sha256:[0-9a-f]{64}$/)
      .optional(),
    evidenceReference: z.string().min(1).max(512).optional(),
    consents: scopedConsentsSchema,
  })
  .strict();

export const selfServiceEvidenceSchema = z.union([
  registryVerificationSchema.transform((value) => ({
    ...value,
    kind: "registry_verification" as const,
  })),
  externalActivationEvidenceSchema.transform((value) => ({
    ...value,
    kind: "external_activation" as const,
  })),
]);

export type ExternalActivationEvidence = z.infer<
  typeof externalActivationEvidenceSchema
>;

export function assertClassificationImmutable(
  prior: ExternalActivationEvidence | undefined,
  next: ExternalActivationEvidence,
) {
  if (
    prior &&
    prior.engagementId === next.engagementId &&
    prior.classification !== next.classification
  ) {
    throw new Error("PARTICIPANT_CLASSIFICATION_IMMUTABLE");
  }
}

export function qualifiesForCommercialGate(
  records: readonly ExternalActivationEvidence[],
) {
  const external = records.filter(
    (record) =>
      record.classification === "external_independent" &&
      record.consents.technicalParticipation === "granted" &&
      record.consents.privateEvidenceRetention === "granted" &&
      record.consents.aggregateReporting === "granted",
  );
  const engagements = new Map<string, ExternalActivationEvidence[]>();
  for (const record of external)
    engagements.set(record.engagementId, [
      ...(engagements.get(record.engagementId) ?? []),
      record,
    ]);
  const starts = [...engagements.values()].filter((items) =>
    items.some(
      ({ milestone, outcome }) =>
        milestone === "initializer_started" && outcome === "passed",
    ),
  );
  const completed = starts.filter((items) =>
    ["settlement_finalized", "protected_response", "replay_rejected"].every(
      (milestone) =>
        items.some(
          (item) =>
            item.milestone === milestone &&
            item.outcome === "passed" &&
            item.interventionCount === 0,
        ),
    ),
  );
  const first402 = starts
    .flatMap((items) =>
      items
        .filter(
          ({ milestone, outcome, durationMs }) =>
            milestone === "first_402" &&
            outcome === "passed" &&
            durationMs !== undefined,
        )
        .map(({ durationMs }) => durationMs!),
    )
    .sort((a, b) => a - b);
  const medianMs = first402.length
    ? first402[Math.floor(first402.length / 2)]!
    : undefined;
  return {
    starts: starts.length,
    completedWithoutCriticalIntervention: completed.length,
    medianFirst402Ms: medianMs,
    externalSettlementAndReplay: completed.length > 0,
    eligible:
      starts.length >= 3 &&
      completed.length >= 2 &&
      medianMs !== undefined &&
      medianMs < 600_000 &&
      completed.length > 0,
  };
}
