import { publicPaymentReceiptSchema } from "@usemeterkit/core";
import { z } from "zod";

const settlementEvidenceInputSchema = z
  .object({
    receipt: publicPaymentReceiptSchema,
    replay: z
      .object({
        rejected: z.literal(true),
        status: z.number().int().min(400).max(499),
        protectedExecutions: z.literal(1),
      })
      .strict(),
  })
  .strict();

export function validateSettlementEvidence(input: unknown) {
  const value = settlementEvidenceInputSchema.parse(input);
  if (!["confirmed", "finalized"].includes(value.receipt.settlement)) {
    throw new Error("receipt does not prove confirmed or finalized settlement");
  }
  if (value.receipt.decision !== "accepted") {
    throw new Error("receipt does not prove an accepted payment");
  }
  return {
    schemaVersion: 1 as const,
    kind: "meterkit-pilot-evidence" as const,
    proofLevel: "settlement" as const,
    passed: true,
    receipt: value.receipt,
    replay: value.replay,
    notice:
      "This report proves a sanitized test-network settlement and rejected replay. It contains no signing material or full signature.",
  };
}
