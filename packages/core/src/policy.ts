import { z } from "zod";

const SOLANA_DEVNET_NETWORK =
  "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1" as const;

const solanaAddressSchema = z.string().regex(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/);
const safeCodeSchema = z.string().regex(/^[A-Z][A-Z0-9_]{0,63}$/);
const forbiddenMetadataKeys =
  /^(authorization|cookie|password|privatekey|secret|seed|signature|token)$/i;

export const paymentPolicyConfigurationSchema = z.object({
  id: z.string().regex(/^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/),
  mode: z.enum(["enforce", "observe"]).default("enforce"),
  onError: z.enum(["allow", "deny"]).default("deny"),
  timeoutMs: z.number().int().min(100).max(10_000).default(2_000),
  maxResponseBytes: z.number().int().min(1_024).max(65_536).default(32_768),
  maxAgeSeconds: z.number().int().min(0).max(3_600).default(0),
});
export type PaymentPolicyConfiguration = z.infer<
  typeof paymentPolicyConfigurationSchema
>;

export const policyEvaluationInputSchema = z
  .object({
    network: z.literal(SOLANA_DEVNET_NETWORK),
    assetMint: solanaAddressSchema,
    amountAtomic: z.string().regex(/^[1-9]\d*$/),
    recipient: solanaAddressSchema,
    payer: solanaAddressSchema.optional(),
    resource: z.string().url().max(2_048),
    transaction: z.string().max(20_000).optional(),
  })
  .strict();
export type PolicyEvaluationInput = z.infer<typeof policyEvaluationInputSchema>;

const metadataValueSchema = z.union([
  z.string().max(256),
  z.number().finite(),
  z.boolean(),
  z.null(),
]);

export const policyDecisionSchema = z
  .object({
    policyId: z.string().min(1).max(64),
    provider: z.string().min(1).max(64),
    outcome: z.enum(["allow", "warn", "deny", "error"]),
    reasonCodes: z.array(safeCodeSchema).max(20),
    confidence: z.number().min(0).max(1).optional(),
    evaluatedAt: z.string().datetime(),
    freshUntil: z.string().datetime().optional(),
    onErrorApplied: z.enum(["allow", "deny"]).optional(),
    metadata: z
      .record(z.string().max(64), metadataValueSchema)
      .refine(
        (value) =>
          Object.keys(value).every((key) => !forbiddenMetadataKeys.test(key)),
        {
          message: "metadata contains a sensitive field",
        },
      )
      .optional(),
  })
  .strict();
export type PolicyDecision = z.infer<typeof policyDecisionSchema>;

export interface PaymentPolicyEvaluator {
  readonly id: string;
  evaluate(
    input: PolicyEvaluationInput,
    signal: AbortSignal,
  ): Promise<PolicyDecision>;
}
