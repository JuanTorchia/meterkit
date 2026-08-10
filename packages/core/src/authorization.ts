import { z } from "zod";

const solanaAddressSchema = z.string().regex(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/);
const solanaTransactionSchema = z
  .string()
  .regex(/^[1-9A-HJ-NP-Za-km-z]{64,88}$/);
const atomicSchema = z.string().regex(/^\d+$/);
const positiveAtomicSchema = z.string().regex(/^[1-9]\d*$/);

export const agentAuthorizationStatusSchema = z.enum([
  "pending",
  "active",
  "exhausted",
  "expired",
  "revocation_pending",
  "revoked",
  "unknown",
  "failed",
]);

export const agentAuthorizationViewSchema = z
  .object({
    schemaVersion: z.literal(1),
    authorizationAddress: solanaAddressSchema,
    program: solanaAddressSchema,
    network: z.literal("solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1"),
    kind: z.enum(["fixed", "recurring", "subscription"]),
    owner: solanaAddressSchema,
    delegate: solanaAddressSchema,
    assetMint: solanaAddressSchema,
    recipientScope: solanaAddressSchema.optional(),
    resourceScopes: z.array(z.string().url().max(2_048)).max(64),
    perRequestLimitAtomic: positiveAtomicSchema,
    aggregateLimitAtomic: positiveAtomicSchema,
    spentAtomic: atomicSchema,
    startsAt: z.string().datetime(),
    expiresAt: z.string().datetime(),
    status: agentAuthorizationStatusSchema,
    creationTransaction: solanaTransactionSchema.optional(),
    revocationTransaction: solanaTransactionSchema.optional(),
    observedCommitment: z.enum([
      "processed",
      "confirmed",
      "finalized",
      "unknown",
    ]),
    observedAt: z.string().datetime(),
  })
  .strict()
  .superRefine((view, context) => {
    const spent = BigInt(view.spentAtomic);
    const aggregate = BigInt(view.aggregateLimitAtomic);
    const perRequest = BigInt(view.perRequestLimitAtomic);
    if (spent > aggregate) {
      context.addIssue({
        code: "custom",
        message: "spent amount exceeds aggregate limit",
        path: ["spentAtomic"],
      });
    }
    if (perRequest > aggregate) {
      context.addIssue({
        code: "custom",
        message: "per-request limit exceeds aggregate limit",
        path: ["perRequestLimitAtomic"],
      });
    }
    if (Date.parse(view.expiresAt) <= Date.parse(view.startsAt)) {
      context.addIssue({
        code: "custom",
        message: "authorization expiry must follow its start",
        path: ["expiresAt"],
      });
    }
    if (view.status === "exhausted" && spent !== aggregate) {
      context.addIssue({
        code: "custom",
        message: "exhausted authorization must consume its aggregate limit",
        path: ["status"],
      });
    }
    if (view.status === "revoked" && !view.revocationTransaction) {
      context.addIssue({
        code: "custom",
        message: "revoked authorization requires public transaction evidence",
        path: ["revocationTransaction"],
      });
    }
  });
export type AgentAuthorizationView = z.infer<
  typeof agentAuthorizationViewSchema
>;
