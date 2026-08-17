import type { DiagnosticFinding } from "@usemeterkit/core";
import { withRemediation } from "./remediation.js";

const DEVNET_GENESIS_HASH = "EtWTRABZaYq6iMfeYKouRu166VU2xqa1";
const TEST_USDC_MINT = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";

export async function checkSolanaReadiness(options: {
  rpcUrl: string;
  recipient?: string;
  payer?: string;
  fetch?: typeof fetch;
  timeoutMs?: number;
}): Promise<DiagnosticFinding[]> {
  const request = options.fetch ?? fetch;
  const rpc = async (method: string, params: unknown[] = []) => {
    const response = await request(options.rpcUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
      signal: AbortSignal.timeout(options.timeoutMs ?? 5_000),
    });
    if (!response.ok) throw new Error(`HTTP_${response.status}`);
    const body = (await response.json()) as {
      result?: unknown;
      error?: unknown;
    };
    if (body.error) throw new Error("RPC_ERROR");
    return body.result;
  };
  try {
    const genesis = await rpc("getGenesisHash");
    if (genesis !== DEVNET_GENESIS_HASH) {
      return [
        withRemediation({
          code: "RPC_WRONG_NETWORK",
          category: "solana",
          state: "failed",
          summary: "The configured RPC is not Solana devnet.",
        }),
      ];
    }
    const findings: DiagnosticFinding[] = [
      {
        code: "RPC_DEVNET_READY",
        category: "solana",
        state: "passed",
        summary: "The RPC reports the Solana devnet genesis hash.",
      },
    ];
    if (!options.recipient) return findings;
    const accounts = (await rpc("getTokenAccountsByOwner", [
      options.recipient,
      { mint: TEST_USDC_MINT },
      { encoding: "jsonParsed", commitment: "confirmed" },
    ])) as { value?: unknown[] } | undefined;
    findings.push(
      accounts?.value?.length
        ? {
            code: "TOKEN_ACCOUNT_READY",
            category: "solana",
            state: "passed",
            summary: "The recipient has a devnet test-USDC token account.",
          }
        : withRemediation({
            code: "TOKEN_ACCOUNT_MISSING",
            category: "solana",
            state: "failed",
            summary:
              "No devnet test-USDC token account was found for the recipient.",
          }),
    );
    if (options.payer) {
      const balance = (await rpc("getBalance", [options.payer])) as
        { value?: number } | undefined;
      const lamports = balance?.value ?? 0;
      const payerAccounts = (await rpc("getTokenAccountsByOwner", [
        options.payer,
        { mint: TEST_USDC_MINT },
        { encoding: "jsonParsed", commitment: "confirmed" },
      ])) as
        | {
            value?: Array<{
              account?: {
                data?: {
                  parsed?: { info?: { tokenAmount?: { amount?: string } } };
                };
              };
            }>;
          }
        | undefined;
      const tokenAmount = (payerAccounts?.value ?? []).reduce(
        (sum, item) =>
          sum +
          BigInt(item.account?.data?.parsed?.info?.tokenAmount?.amount ?? "0"),
        0n,
      );
      findings.push(
        lamports > 0 && tokenAmount > 0n
          ? {
              code: "PAYER_ASSETS_READY",
              category: "wallet",
              state: "passed",
              summary:
                "The disposable payer has devnet test SOL and test-USDC.",
            }
          : withRemediation({
              code: "PAYER_ASSETS_MISSING",
              category: "wallet",
              state: "failed",
              summary:
                "The disposable payer lacks devnet test SOL or test-USDC.",
            }),
      );
    }
    return findings;
  } catch {
    return [
      withRemediation({
        code: "RPC_UNAVAILABLE",
        category: "solana",
        state: "unavailable",
        summary: "The configured RPC could not be checked within the timeout.",
      }),
    ];
  }
}

export async function checkFacilitator(options: {
  url: string;
  fetch?: typeof fetch;
  timeoutMs?: number;
}): Promise<DiagnosticFinding> {
  try {
    const response = await (options.fetch ?? fetch)(
      `${options.url.replace(/\/$/, "")}/supported`,
      { signal: AbortSignal.timeout(options.timeoutMs ?? 5_000) },
    );
    if (!response.ok) throw new Error("FACILITATOR_HTTP_ERROR");
    return {
      code: "FACILITATOR_READY",
      category: "facilitator",
      state: "passed",
      summary: "The facilitator support endpoint is reachable.",
    };
  } catch {
    return withRemediation({
      code: "FACILITATOR_UNAVAILABLE",
      category: "facilitator",
      state: "unavailable",
      summary: "The facilitator could not be checked within the timeout.",
    });
  }
}
