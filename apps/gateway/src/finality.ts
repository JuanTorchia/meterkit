import { z } from "zod";
import type { FinalityStore } from "@usemeterkit/database";

const responseSchema = z.object({
  result: z.object({
    value: z.array(
      z
        .object({
          confirmationStatus: z
            .enum(["processed", "confirmed", "finalized"])
            .nullable(),
          err: z.unknown().nullable(),
        })
        .nullable(),
    ),
  }),
});

export class SolanaFinalityReconciler {
  readonly #missingChecks = new Map<string, number>();
  readonly #rpcUrls: readonly string[];
  #lastEvidence:
    | {
        dependency: "solana-rpc";
        outcome: "skipped" | "primary" | "recovered" | "unavailable";
        attempts: number;
        fallbackUsed: boolean;
        durationMs: number;
      }
    | undefined;

  get lastEvidence() {
    return this.#lastEvidence;
  }

  constructor(
    private readonly store: FinalityStore,
    rpcUrl: string | readonly string[],
    private readonly request: typeof fetch = fetch,
  ) {
    this.#rpcUrls =
      typeof rpcUrl === "string" ? [rpcUrl] : [...new Set(rpcUrl)];
    if (!this.#rpcUrls.length)
      throw new Error("at least one Solana RPC URL is required");
  }

  async reconcile(limit = 100) {
    const started = performance.now();
    const signatures = await this.store.listConfirmedSignatures(limit);
    if (!signatures.length) {
      this.#lastEvidence = {
        dependency: "solana-rpc",
        outcome: "skipped",
        attempts: 0,
        fallbackUsed: false,
        durationMs: Math.max(0, performance.now() - started),
      };
      return { checked: 0, finalized: 0, failed: 0, unknown: 0 };
    }
    let statusResult: {
      parsed: z.infer<typeof responseSchema>;
      attempts: number;
    };
    try {
      statusResult = await this.#getStatuses(signatures);
    } catch (error) {
      this.#lastEvidence = {
        dependency: "solana-rpc",
        outcome: "unavailable",
        attempts: this.#rpcUrls.length,
        fallbackUsed: this.#rpcUrls.length > 1,
        durationMs: Math.max(0, performance.now() - started),
      };
      throw error;
    }
    const { parsed, attempts } = statusResult;
    this.#lastEvidence = {
      dependency: "solana-rpc",
      outcome: attempts > 1 ? "recovered" : "primary",
      attempts,
      fallbackUsed: attempts > 1,
      durationMs: Math.max(0, performance.now() - started),
    };
    let finalized = 0;
    let failed = 0;
    let unknown = 0;
    for (const [index, status] of parsed.result.value.entries()) {
      const signature = signatures[index];
      if (
        signature &&
        status?.confirmationStatus === "finalized" &&
        status.err === null
      ) {
        this.#missingChecks.delete(signature);
        if (await this.store.markFinalized(signature)) finalized += 1;
      } else if (signature && status?.err != null) {
        this.#missingChecks.delete(signature);
        if (await this.store.markFailed(signature)) failed += 1;
      } else if (signature && status === null) {
        const misses = (this.#missingChecks.get(signature) ?? 0) + 1;
        this.#missingChecks.set(signature, misses);
        // RPC absence is not proof of an onchain failure. Keep the persisted
        // payment confirmed so a later historical lookup can recover it.
        unknown += 1;
      } else if (signature) {
        this.#missingChecks.delete(signature);
      }
    }
    return { checked: signatures.length, finalized, failed, unknown };
  }

  async #getStatuses(signatures: readonly string[]) {
    const errors: string[] = [];
    for (const rpcUrl of this.#rpcUrls) {
      try {
        const response = await this.request(rpcUrl, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: crypto.randomUUID(),
            method: "getSignatureStatuses",
            params: [signatures, { searchTransactionHistory: true }],
          }),
        });
        if (!response.ok) throw new Error(`HTTP_${response.status}`);
        return {
          parsed: responseSchema.parse(await response.json()),
          attempts: errors.length + 1,
        };
      } catch (error) {
        errors.push(error instanceof Error ? error.message : "unknown");
      }
    }
    throw new Error(`SOLANA_RPC_UNAVAILABLE:${errors.join(",")}`);
  }
}
