import { z } from "zod";

export * from "./policy.js";
export * from "./receipt.js";

export const SOLANA_DEVNET = "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1";
export const SOLANA_MAINNET = "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp";
export const SUBSCRIPTIONS_PROGRAM =
  "De1egAFMkMWZSN5rYXRj9CAdheBamobVNubTsi9avR44";
export const PRODUCT_SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

export const productSchema = z.object({
  id: z
    .string()
    .min(1)
    .max(63)
    .regex(
      PRODUCT_SLUG_PATTERN,
      "product id must be a lowercase DNS-style slug",
    ),
  name: z.string().min(3).max(100),
  description: z.string().max(500),
  resource: z.string().url(),
  upstreamUrl: z.string().url().optional(),
  priceAtomic: z.string().regex(/^[1-9]\d*$/),
  assetMint: z.string().min(32).max(44),
  payTo: z.string().min(32).max(44),
  network: z.literal(SOLANA_DEVNET),
});
export type Product = z.infer<typeof productSchema>;

export const persistedProductSchema = productSchema.extend({
  uid: z.string().uuid(),
});
export type PersistedProduct = z.infer<typeof persistedProductSchema>;

export const paymentRecordSchema = z.object({
  id: z.string(),
  productId: z.string(),
  payer: z.string(),
  payTo: z.string(),
  mint: z.string(),
  amountAtomic: z.string(),
  network: z.literal(SOLANA_DEVNET),
  signature: z.string(),
  settledAt: z.string().datetime(),
  status: z.enum(["confirmed", "finalized", "failed"]),
});
export type PaymentRecord = z.infer<typeof paymentRecordSchema>;

export interface PaymentStore {
  has(signature: string): Promise<boolean>;
  save(record: PaymentRecord): Promise<void>;
  list(): Promise<readonly PaymentRecord[]>;
}

export class MemoryPaymentStore implements PaymentStore {
  readonly #records = new Map<string, PaymentRecord>();
  async has(signature: string) {
    return this.#records.has(signature);
  }
  async save(record: PaymentRecord) {
    if (this.#records.has(record.signature))
      throw new Error("PAYMENT_REPLAYED");
    this.#records.set(record.signature, paymentRecordSchema.parse(record));
  }
  async list() {
    return [...this.#records.values()];
  }
}

export function explorerUrl(signature: string, network: "devnet" = "devnet") {
  return `https://explorer.solana.com/tx/${encodeURIComponent(signature)}?cluster=${network}`;
}
