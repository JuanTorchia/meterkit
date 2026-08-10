import { createHash } from "node:crypto";
import { z } from "zod";
import { policyDecisionSchema } from "./policy.js";

const SOLANA_DEVNET_NETWORK = "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1" as const;

const solanaAddressSchema = z.string().regex(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/);

export const publicPaymentReceiptSchema = z.object({
  schemaVersion: z.literal(1),
  receiptId: z.string().uuid(),
  productId: z.string().min(1).max(128),
  network: z.literal(SOLANA_DEVNET_NETWORK),
  assetMint: solanaAddressSchema,
  amountAtomic: z.string().regex(/^[1-9]\d*$/),
  recipient: solanaAddressSchema,
  payer: solanaAddressSchema.optional(),
  resource: z.string().url().max(2_048),
  decision: z.enum(["accepted", "rejected", "unknown", "failed"]),
  settlement: z.enum(["not_started", "pending", "confirmed", "finalized", "unknown", "failed"]),
  signatureFingerprint: z.string().regex(/^sha256:[0-9a-f]{16}$/).optional(),
  explorerUrl: z.string().url().max(2_048).optional(),
  policyDecisions: z.array(policyDecisionSchema).max(16),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  reasonCode: z.string().regex(/^[A-Z][A-Z0-9_]{0,63}$/),
}).strict().refine((value) => Date.parse(value.updatedAt) >= Date.parse(value.createdAt), {
  message: "updatedAt must not precede createdAt",
  path: ["updatedAt"],
});
export type PublicPaymentReceipt = z.infer<typeof publicPaymentReceiptSchema>;

export function fingerprintSignature(signature: string) {
  return `sha256:${createHash("sha256").update(signature).digest("hex").slice(0, 16)}` as const;
}
