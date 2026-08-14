import { z } from "zod";
import {
  activationEventSchema,
  commercialPaymentSchema,
  consentGrantSchema,
  pilotEngagementSchema,
  retentionObservationSchema,
  supportInterventionSchema,
  willingnessToPaySchema,
  type ActivationEvent,
  type ActivationStage,
  type ConsentScope,
  type ParticipantClass,
  type PilotEngagement,
  type RetentionObservation,
  type SupportIntervention,
  type WillingnessToPay,
} from "@usemeterkit/core";

export const pilotEngagementFileSchema = z
  .object({
    schemaVersion: z.literal(2),
    engagement: pilotEngagementSchema,
    events: z.array(activationEventSchema).max(64),
    interventions: z.array(supportInterventionSchema).max(64),
    consents: z.array(consentGrantSchema).max(16),
    retentionObservations: z.array(retentionObservationSchema).max(16),
    willingnessToPay: z.array(willingnessToPaySchema).max(16),
    commercialPayments: z.array(commercialPaymentSchema).max(64),
  })
  .strict();
export type PilotEngagementFile = z.infer<typeof pilotEngagementFileSchema>;

export type PilotConversionSummary = {
  starts: number;
  completedIntegrations: number;
  supportMinutes: number;
  daySeven: Record<"retained" | "removed" | "unknown" | "ineligible", number>;
  willingnessToPay: Record<
    "yes" | "maybe" | "no" | "declined" | "unknown",
    number
  >;
  paidIntegrations: number;
  commercialRevenueByCurrency: Record<string, string>;
};

export function createPilotEngagementFile(
  input: {
    participantClass: ParticipantClass;
    offerVersion: string;
    disclosedPrice?: PilotEngagement["disclosedPrice"];
    productUid?: string;
    surface: PilotEngagement["surface"];
    source: string;
    assistanceMode: PilotEngagement["assistanceMode"];
  },
  now = new Date(),
): PilotEngagementFile {
  const timestamp = now.toISOString();
  return pilotEngagementFileSchema.parse({
    schemaVersion: 2,
    engagement: {
      schemaVersion: 2,
      engagementId: crypto.randomUUID(),
      ...input,
      startedAt: timestamp,
      operationalOutcome: "active",
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    events: [],
    interventions: [],
    consents: [],
    retentionObservations: [],
    willingnessToPay: [],
    commercialPayments: [],
  });
}

export function addActivationEvent(
  raw: PilotEngagementFile,
  stage: ActivationStage,
  outcome: ActivationEvent["outcome"],
  occurredAt = new Date(),
  evidenceReference?: string,
): PilotEngagementFile {
  const file = pilotEngagementFileSchema.parse(raw);
  const event = activationEventSchema.parse({
    eventId: crypto.randomUUID(),
    engagementId: file.engagement.engagementId,
    stage,
    outcome,
    occurredAt: occurredAt.toISOString(),
    recordedAt: new Date().toISOString(),
    ...(evidenceReference ? { evidenceReference } : {}),
  });
  return update(file, { events: [...file.events, event] }, occurredAt);
}

export function addIntervention(
  raw: PilotEngagementFile,
  input: Omit<SupportIntervention, "interventionId" | "engagementId">,
): PilotEngagementFile {
  const file = pilotEngagementFileSchema.parse(raw);
  const intervention = supportInterventionSchema.parse({
    ...input,
    interventionId: crypto.randomUUID(),
    engagementId: file.engagement.engagementId,
  });
  return update(file, {
    interventions: [...file.interventions, intervention],
  });
}

export function addConsent(
  raw: PilotEngagementFile,
  scope: ConsentScope,
  granted: boolean,
  termsVersion: string,
  capturedAt = new Date(),
): PilotEngagementFile {
  const file = pilotEngagementFileSchema.parse(raw);
  if (file.consents.some((item) => item.scope === scope)) {
    throw new Error("CONSENT_SCOPE_ALREADY_RECORDED");
  }
  const consent = consentGrantSchema.parse({
    consentId: crypto.randomUUID(),
    engagementId: file.engagement.engagementId,
    scope,
    status: granted ? "granted" : "denied",
    termsVersion,
    capturedAt: capturedAt.toISOString(),
  });
  return update(file, { consents: [...file.consents, consent] }, capturedAt);
}

export function withdrawConsent(
  raw: PilotEngagementFile,
  scope: ConsentScope,
  withdrawnAt = new Date(),
): PilotEngagementFile {
  const file = pilotEngagementFileSchema.parse(raw);
  let found = false;
  const consents = file.consents.map((item) => {
    if (item.scope !== scope) return item;
    found = true;
    return consentGrantSchema.parse({
      ...item,
      status: "withdrawn",
      withdrawnAt: withdrawnAt.toISOString(),
    });
  });
  if (!found) throw new Error("CONSENT_SCOPE_NOT_FOUND");
  return update(file, { consents }, withdrawnAt);
}

export function observeDaySevenRetention(
  raw: PilotEngagementFile,
  input: {
    observedAt: Date;
    outcome: RetentionObservation["outcome"];
    evidenceType?: RetentionObservation["evidenceType"];
    validPaymentCount?: number;
  },
): PilotEngagementFile {
  const file = pilotEngagementFileSchema.parse(raw);
  const dueAt = new Date(
    Date.parse(file.engagement.startedAt) + 7 * 86_400_000,
  );
  if (input.outcome === "retained" && input.observedAt < dueAt) {
    throw new Error("retention cannot be observed before day seven");
  }
  const observation = retentionObservationSchema.parse({
    observationId: crypto.randomUUID(),
    engagementId: file.engagement.engagementId,
    dueAt: dueAt.toISOString(),
    observedAt: input.observedAt.toISOString(),
    outcome: input.outcome,
    ...(input.evidenceType ? { evidenceType: input.evidenceType } : {}),
    ...(input.validPaymentCount === undefined
      ? {}
      : { validPaymentCount: input.validPaymentCount }),
  });
  return update(file, {
    retentionObservations: [...file.retentionObservations, observation],
  });
}

export function recordWillingnessToPay(
  raw: PilotEngagementFile,
  input: {
    askedAt: Date;
    respondedAt?: Date;
    response: WillingnessToPay["response"];
    reasonCode?: string;
  },
): PilotEngagementFile {
  const file = pilotEngagementFileSchema.parse(raw);
  const offer = file.engagement.disclosedPrice;
  if (!offer) throw new Error("DISCLOSED_PRICE_REQUIRED");
  const response = willingnessToPaySchema.parse({
    responseId: crypto.randomUUID(),
    engagementId: file.engagement.engagementId,
    askedAt: input.askedAt.toISOString(),
    ...(input.respondedAt
      ? { respondedAt: input.respondedAt.toISOString() }
      : {}),
    response: input.response,
    offerVersion: file.engagement.offerVersion,
    ...offer,
    ...(input.reasonCode ? { reasonCode: input.reasonCode } : {}),
  });
  return update(file, {
    willingnessToPay: [...file.willingnessToPay, response],
  });
}

const completionStages = new Set<ActivationStage>([
  "challenge_received",
  "policy_verified",
  "payment_submitted",
  "settlement_finalized",
  "protected_response",
  "replay_rejected",
  "completion_reviewed",
]);

export function deriveActivationStatus(file: PilotEngagementFile) {
  const value = pilotEngagementFileSchema.parse(file);
  const consented = [
    "technical_participation",
    "private_evidence_retention",
  ].every((scope) =>
    value.consents.some(
      (item) => item.scope === scope && item.status === "granted",
    ),
  );
  const passed = new Set(
    value.events
      .filter((item) => item.outcome === "passed")
      .map((item) => item.stage),
  );
  if (
    value.engagement.participantClass === "external_independent" &&
    consented &&
    [...completionStages].every((stage) => passed.has(stage))
  ) {
    return "completed" as const;
  }
  return value.engagement.operationalOutcome;
}

export function derivePilotConversionSummary(
  files: readonly PilotEngagementFile[],
): PilotConversionSummary {
  const values = files.map((file) => pilotEngagementFileSchema.parse(file));
  const external = values.filter(
    (file) => file.engagement.participantClass === "external_independent",
  );
  const summary: PilotConversionSummary = {
    starts: external.length,
    completedIntegrations: external.filter(
      (file) => deriveActivationStatus(file) === "completed",
    ).length,
    supportMinutes: 0,
    daySeven: { retained: 0, removed: 0, unknown: 0, ineligible: 0 },
    willingnessToPay: { yes: 0, maybe: 0, no: 0, declined: 0, unknown: 0 },
    paidIntegrations: 0,
    commercialRevenueByCurrency: {},
  };
  for (const file of external) {
    summary.supportMinutes += file.interventions.reduce((total, item) => {
      if (!item.endedAt) return total;
      return (
        total + (Date.parse(item.endedAt) - Date.parse(item.beganAt)) / 60_000
      );
    }, 0);
    const observation = file.retentionObservations.at(-1);
    summary.daySeven[observation?.outcome ?? "ineligible"] += 1;
    const willingness = file.willingnessToPay.at(-1)?.response ?? "unknown";
    const bucket: keyof PilotConversionSummary["willingnessToPay"] =
      willingness === "yes_at_stated_price" ||
      willingness === "yes_different_price"
        ? "yes"
        : willingness;
    summary.willingnessToPay[bucket] += 1;
    const verified = file.commercialPayments.filter(
      (item) =>
        item.status === "received_verified" && Number(item.netAmount) > 0,
    );
    if (verified.length) summary.paidIntegrations += 1;
    for (const payment of verified) {
      summary.commercialRevenueByCurrency[payment.currency] = String(
        Number(summary.commercialRevenueByCurrency[payment.currency] ?? "0") +
          Number(payment.netAmount),
      );
    }
  }
  return summary;
}

export function createPilotEngagementExport(raw: PilotEngagementFile) {
  const file = pilotEngagementFileSchema.parse(raw);
  const publicAttribution = file.consents.some(
    (item) => item.scope === "public_attribution" && item.status === "granted",
  );
  return {
    ...file,
    attribution: publicAttribution ? "consented" : "private",
    commercialPayments: file.commercialPayments.map((payment) => {
      const { privateEvidenceReference, ...minimized } = payment;
      void privateEvidenceReference;
      return minimized;
    }),
  };
}

export function createPilotDeletionReceipt(
  raw: PilotEngagementFile,
  now = new Date(),
) {
  const file = pilotEngagementFileSchema.parse(raw);
  return {
    schemaVersion: 2 as const,
    engagementId: file.engagement.engagementId,
    deletedAt: now.toISOString(),
    deletionScope: "local-pilot-engagement-file" as const,
    immutableEvidenceNotice:
      "Public issue and onchain evidence cannot be erased by MeterKit.",
  };
}

function update(
  file: PilotEngagementFile,
  changes: Partial<Omit<PilotEngagementFile, "schemaVersion" | "engagement">>,
  now = new Date(),
): PilotEngagementFile {
  return pilotEngagementFileSchema.parse({
    ...file,
    ...changes,
    engagement: { ...file.engagement, updatedAt: now.toISOString() },
  });
}
