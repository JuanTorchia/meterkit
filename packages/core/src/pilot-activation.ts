import { z } from "zod";

const SOLANA_DEVNET_NETWORK =
  "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1" as const;

export const PILOT_ACTIVATION_SCHEMA_VERSION = 2 as const;
export const PROVIDER_SETTLEMENT_SCHEMA_VERSION = 1 as const;
export const COMMERCIAL_EVIDENCE_SCHEMA_VERSION = 1 as const;

const atomicAmountSchema = z.string().regex(/^(0|[1-9]\d*)$/);
const moneyAmountSchema = z.string().regex(/^(0|[1-9]\d*)(?:\.\d{1,6})?$/);
const walletSchema = z.string().regex(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/);
const evidenceReferenceSchema = z.string().min(1).max(512);

export const settlementStateSchema = z.enum([
  "not_started",
  "pending",
  "confirmed",
  "finalized",
  "unknown",
  "failed",
]);

export const providerSettlementSchema = z
  .object({
    schemaVersion: z.literal(PROVIDER_SETTLEMENT_SCHEMA_VERSION),
    receiptId: z.string().uuid(),
    productUid: z.string().uuid(),
    productSlug: z.string().min(1).max(63),
    decision: z.enum(["accepted", "rejected", "unknown", "failed"]),
    settlement: settlementStateSchema,
    network: z.literal(SOLANA_DEVNET_NETWORK),
    assetMint: walletSchema,
    amountAtomic: atomicAmountSchema,
    recipient: walletSchema,
    signatureFingerprint: z.string().min(8).max(128).optional(),
    explorerUrl: z.string().url().optional(),
    reasonCode: z.string().min(1).max(128),
    policyDecisions: z.array(z.unknown()).max(64).default([]),
    occurredAt: z.string().datetime(),
    settledAt: z.string().datetime().optional(),
    updatedAt: z.string().datetime(),
  })
  .strict()
  .superRefine((value, context) => {
    if (Date.parse(value.updatedAt) < Date.parse(value.occurredAt)) {
      context.addIssue({
        code: "custom",
        path: ["updatedAt"],
        message: "updatedAt must not precede occurredAt",
      });
    }
  });
export type ProviderSettlement = z.infer<typeof providerSettlementSchema>;

const settlementFiltersSchema = z
  .object({
    from: z.string().datetime(),
    toExclusive: z.string().datetime(),
    product: z.string().min(1).max(63).optional(),
    statuses: z.array(settlementStateSchema).max(6).default([]),
  })
  .strict();

export const settlementExportSchema = z
  .object({
    schemaVersion: z.literal(PROVIDER_SETTLEMENT_SCHEMA_VERSION),
    exportId: z.string().uuid(),
    generatedAt: z.string().datetime(),
    asOf: z.string().datetime(),
    filters: settlementFiltersSchema,
    units: z
      .object({ amountAtomic: z.literal("integer string in asset base units") })
      .strict(),
    summary: z
      .object({
        recordCount: z.number().int().min(0).max(10_000),
        amountAtomicByAssetAndStatus: z.record(z.string(), atomicAmountSchema),
      })
      .strict(),
    records: z.array(providerSettlementSchema).max(10_000),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.summary.recordCount !== value.records.length) {
      context.addIssue({
        code: "custom",
        path: ["summary", "recordCount"],
        message: "recordCount must match records length",
      });
    }
  });
export type SettlementExport = z.infer<typeof settlementExportSchema>;

export const participantClassSchema = z.enum([
  "internal_maintainer",
  "synthetic",
  "external_independent",
  "external_compensated",
  "external_other",
]);
export type ParticipantClass = z.infer<typeof participantClassSchema>;

export const disclosedPriceSchema = z
  .object({
    amount: moneyAmountSchema,
    currency: z.string().min(3).max(12),
    unit: z.string().min(1).max(64),
  })
  .strict();

export const pilotEngagementSchema = z
  .object({
    schemaVersion: z.literal(PILOT_ACTIVATION_SCHEMA_VERSION),
    engagementId: z.string().uuid(),
    participantClass: participantClassSchema,
    offerVersion: z.string().min(1).max(64),
    disclosedPrice: disclosedPriceSchema.optional(),
    productUid: z.string().uuid().optional(),
    surface: z.enum(["express", "next-route", "hono", "mcp"]),
    startedAt: z.string().datetime(),
    source: z.string().min(1).max(128),
    assistanceMode: z.enum(["none", "docs_only", "maintainer_guided"]),
    operationalOutcome: z.enum([
      "active",
      "blocked",
      "abandoned",
      "withdrawn",
      "invalid",
      "completed",
    ]),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .strict();
export type PilotEngagement = z.infer<typeof pilotEngagementSchema>;

export const activationStageSchema = z.enum([
  "install_complete",
  "server_started",
  "challenge_received",
  "policy_verified",
  "payment_submitted",
  "settlement_finalized",
  "protected_response",
  "replay_rejected",
  "completion_reviewed",
]);
export type ActivationStage = z.infer<typeof activationStageSchema>;

export const activationEventSchema = z
  .object({
    eventId: z.string().uuid(),
    engagementId: z.string().uuid(),
    stage: activationStageSchema,
    outcome: z.enum(["passed", "failed", "unknown"]),
    occurredAt: z.string().datetime(),
    recordedAt: z.string().datetime(),
    evidenceReference: evidenceReferenceSchema.optional(),
    interventionId: z.string().uuid().optional(),
  })
  .strict();
export type ActivationEvent = z.infer<typeof activationEventSchema>;

export const supportInterventionSchema = z
  .object({
    interventionId: z.string().uuid(),
    engagementId: z.string().uuid(),
    stage: activationStageSchema,
    kind: z.string().min(1).max(64),
    reasonCode: z.string().min(1).max(128),
    actorClass: z.enum(["maintainer", "participant", "third_party"]),
    beganAt: z.string().datetime(),
    endedAt: z.string().datetime().optional(),
  })
  .strict();
export type SupportIntervention = z.infer<typeof supportInterventionSchema>;

export const consentScopeSchema = z.enum([
  "technical_participation",
  "private_evidence_retention",
  "day7_followup",
  "aggregate_reporting",
  "public_attribution",
  "testimonial_quote",
  "case_study",
]);
export type ConsentScope = z.infer<typeof consentScopeSchema>;

export const consentGrantSchema = z
  .object({
    consentId: z.string().uuid(),
    engagementId: z.string().uuid(),
    scope: consentScopeSchema,
    status: z.enum(["granted", "denied", "withdrawn"]),
    termsVersion: z.string().min(1).max(64),
    capturedAt: z.string().datetime(),
    withdrawnAt: z.string().datetime().optional(),
    sourceReference: evidenceReferenceSchema.optional(),
  })
  .strict()
  .superRefine((value, context) => {
    if ((value.status === "withdrawn") !== Boolean(value.withdrawnAt)) {
      context.addIssue({
        code: "custom",
        path: ["withdrawnAt"],
        message: "withdrawn consent requires withdrawnAt",
      });
    }
  });
export type ConsentGrant = z.infer<typeof consentGrantSchema>;

export const retentionObservationSchema = z
  .object({
    observationId: z.string().uuid(),
    engagementId: z.string().uuid(),
    dueAt: z.string().datetime(),
    observedAt: z.string().datetime().optional(),
    outcome: z.enum(["retained", "removed", "unknown", "ineligible"]),
    evidenceType: z
      .enum(["participant_response", "verifiable_valid_use"])
      .optional(),
    validPaymentCount: z.number().int().min(0).optional(),
  })
  .strict()
  .superRefine((value, context) => {
    if (
      value.outcome === "retained" &&
      (!value.observedAt ||
        Date.parse(value.observedAt) < Date.parse(value.dueAt))
    ) {
      context.addIssue({
        code: "custom",
        path: ["observedAt"],
        message: "retention must be observed on or after dueAt",
      });
    }
  });
export type RetentionObservation = z.infer<typeof retentionObservationSchema>;

export const willingnessToPaySchema = z
  .object({
    responseId: z.string().uuid(),
    engagementId: z.string().uuid(),
    askedAt: z.string().datetime(),
    respondedAt: z.string().datetime().optional(),
    response: z.enum([
      "yes_at_stated_price",
      "yes_different_price",
      "maybe",
      "no",
      "declined",
      "unknown",
    ]),
    offerVersion: z.string().min(1).max(64),
    amount: moneyAmountSchema,
    currency: z.string().min(3).max(12),
    unit: z.string().min(1).max(64),
    reasonCode: z.string().min(1).max(128).optional(),
  })
  .strict();
export type WillingnessToPay = z.infer<typeof willingnessToPaySchema>;

export const commercialPaymentSchema = z
  .object({
    paymentId: z.string().uuid(),
    engagementId: z.string().uuid(),
    currency: z.string().min(3).max(12),
    grossAmount: moneyAmountSchema,
    refundedAmount: moneyAmountSchema,
    netAmount: moneyAmountSchema,
    status: z.enum([
      "pending",
      "received_verified",
      "partially_refunded",
      "refunded",
      "chargeback",
    ]),
    receivedAt: z.string().datetime().optional(),
    privateEvidenceReference: evidenceReferenceSchema,
  })
  .strict()
  .superRefine((value, context) => {
    const scale = 1_000_000;
    const decimal = (input: string) => Math.round(Number(input) * scale);
    if (
      decimal(value.netAmount) !==
      decimal(value.grossAmount) - decimal(value.refundedAmount)
    ) {
      context.addIssue({
        code: "custom",
        path: ["netAmount"],
        message: "netAmount must equal grossAmount minus refundedAmount",
      });
    }
  });
export type CommercialPayment = z.infer<typeof commercialPaymentSchema>;

export const fundingTrancheSchema = z
  .object({
    trancheId: z.string().uuid(),
    awardId: z.string().uuid(),
    amount: moneyAmountSchema,
    currency: z.string().min(3).max(12),
    state: z.enum([
      "not_due",
      "eligible",
      "submitted",
      "approved",
      "payment_pending",
      "received_verified",
      "rejected",
    ]),
    privateEvidenceReference: evidenceReferenceSchema.optional(),
    publicSafeStatus: z.string().min(1).max(128),
  })
  .strict();
export type FundingTranche = z.infer<typeof fundingTrancheSchema>;
