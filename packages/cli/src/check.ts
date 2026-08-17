import { isIP } from "node:net";

import { z } from "zod";

import { parsePublicUrl } from "./config.js";

const addressSchema = z.string().regex(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/);
const challengeSchema = z
  .object({
    x402Version: z.literal(2),
    accepts: z
      .array(
        z
          .object({
            scheme: z.literal("exact"),
            network: z.string().min(1).max(128),
            amount: z.string().regex(/^[1-9]\d*$/),
            asset: addressSchema,
            payTo: addressSchema,
          })
          .passthrough(),
      )
      .min(1),
  })
  .passthrough();

export interface CheckOptions {
  fetch?: typeof fetch;
  allowLocalhost?: boolean;
  timeoutMs?: number;
}

function assertAllowedDiscoveryUrl(url: URL, allowLocalhost: boolean) {
  const hostname = url.hostname.toLowerCase();
  const local =
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    (isIP(hostname) === 4 && hostname.startsWith("127."));
  if (local && !allowLocalhost) {
    throw new Error("localhost requires --allow-localhost");
  }
}

export async function checkEndpoint(value: string, options: CheckOptions = {}) {
  const url = parsePublicUrl(value);
  assertAllowedDiscoveryUrl(url, options.allowLocalhost ?? false);
  const response = await (options.fetch ?? fetch)(url, {
    method: "GET",
    redirect: "error",
    signal: AbortSignal.timeout(options.timeoutMs ?? 10_000),
  });
  if (response.status !== 402) {
    throw new Error(`expected HTTP 402, received ${response.status}`);
  }
  const encoded = response.headers.get("payment-required");
  if (!encoded) throw new Error("PAYMENT-REQUIRED header is missing");
  if (encoded.length > 32_768)
    throw new Error("PAYMENT-REQUIRED header is too large");

  let decoded: unknown;
  try {
    decoded = JSON.parse(Buffer.from(encoded, "base64").toString("utf8"));
  } catch {
    throw new Error("PAYMENT-REQUIRED header is not valid base64 JSON");
  }
  const challenge = challengeSchema.parse(decoded);
  const terms = challenge.accepts[0]!;
  return {
    status: 402 as const,
    x402Version: challenge.x402Version,
    network: terms.network,
    mint: terms.asset,
    amountAtomic: terms.amount,
    recipient: terms.payTo,
    resource: url.toString(),
  };
}
