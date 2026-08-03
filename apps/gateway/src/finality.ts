import { z } from "zod";
import type { FinalityStore } from "@meterkit/database";

const responseSchema = z.object({
  result: z.object({
    value: z.array(z.object({
      confirmationStatus: z.enum(["processed", "confirmed", "finalized"]).nullable(),
      err: z.unknown().nullable(),
    }).nullable()),
  }),
});

export class SolanaFinalityReconciler {
  constructor(
    private readonly store: FinalityStore,
    private readonly rpcUrl: string,
    private readonly request: typeof fetch = fetch,
  ) {}

  async reconcile(limit = 100) {
    const signatures = await this.store.listConfirmedSignatures(limit);
    if (!signatures.length) return { checked: 0, finalized: 0 };
    const response = await this.request(this.rpcUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: crypto.randomUUID(),
        method: "getSignatureStatuses",
        params: [signatures, { searchTransactionHistory: true }],
      }),
    });
    if (!response.ok) throw new Error(`SOLANA_RPC_${response.status}`);
    const parsed = responseSchema.parse(await response.json());
    let finalized = 0;
    for (const [index, status] of parsed.result.value.entries()) {
      const signature = signatures[index];
      if (signature && status?.confirmationStatus === "finalized" && status.err === null) {
        if (await this.store.markFinalized(signature)) finalized += 1;
      }
    }
    return { checked: signatures.length, finalized };
  }
}
