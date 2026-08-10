export type FinalityOptions = {
  attempts?: number;
  intervalMs?: number;
};

export async function waitForFinalizedSignature(
  signature: string,
  rpcUrl: string,
  fetcher: typeof globalThis.fetch = globalThis.fetch,
  options: FinalityOptions = {},
) {
  const attempts = options.attempts ?? 30;
  const intervalMs = options.intervalMs ?? 1_000;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const response = await fetcher(rpcUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      signal: AbortSignal.timeout(10_000),
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "meterkit-revocation-finality",
        method: "getSignatureStatuses",
        params: [[signature], { searchTransactionHistory: true }],
      }),
    });
    const body = (await response.json()) as {
      result?: {
        value?: Array<{
          confirmationStatus?: string | null;
          err?: unknown;
        } | null>;
      };
      error?: { message?: string };
    };
    if (!response.ok || body.error)
      throw new Error(
        body.error?.message ?? "RPC could not confirm the revocation",
      );
    const current = body.result?.value?.[0];
    if (current?.err)
      throw new Error("The revocation transaction failed onchain");
    if (current?.confirmationStatus === "finalized") return;
    if (attempt + 1 < attempts) {
      await new Promise((resolve) =>
        globalThis.setTimeout(resolve, intervalMs),
      );
    }
  }
  throw new Error("Revocation submitted but finality was not reached in time");
}
