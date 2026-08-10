import { z } from "zod";

export const paymentLifecycleEventSchema = z
  .object({
    schemaVersion: z.literal(1),
    type: z.enum([
      "policy_evaluated",
      "payment_required",
      "settled",
      "rejected",
      "unknown",
    ]),
    occurredAt: z.string().datetime(),
    productId: z.string().min(1).max(128),
    reasonCode: z.string().regex(/^[A-Z][A-Z0-9_]{0,63}$/),
    receiptId: z.string().uuid().optional(),
    signatureFingerprint: z
      .string()
      .regex(/^sha256:[0-9a-f]{16}$/)
      .optional(),
  })
  .strict();
export type PaymentLifecycleEvent = z.infer<typeof paymentLifecycleEventSchema>;
export type PaymentEventSink = (
  event: PaymentLifecycleEvent,
) => void | Promise<void>;

export async function emitSafely(
  sink: PaymentEventSink | undefined,
  event: PaymentLifecycleEvent,
) {
  if (!sink) return;
  try {
    await sink(paymentLifecycleEventSchema.parse(event));
  } catch {
    // Observability callbacks are isolated from payment decisions by contract.
  }
}
