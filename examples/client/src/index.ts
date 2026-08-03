import { x402Client } from "@x402/fetch";
import { wrapFetchWithPayment, decodePaymentResponseHeader } from "@x402/fetch";
import { ExactSvmScheme } from "@x402/svm";
import { createKeyPairSignerFromBytes } from "@solana/kit";
import { SOLANA_DEVNET } from "@meterkit/core";

export async function callPaidWeather(
  fetchWithPayment: typeof fetch,
  city = "Buenos Aires",
  gatewayUrl = "http://localhost:3402",
): Promise<{ data: unknown; receipt: unknown }> {
  const response = await fetchWithPayment(
    `${gatewayUrl.replace(/\/$/, "")}/v1/weather/premium?city=${encodeURIComponent(city)}`,
  );
  if (!response.ok) {
    const paymentResponse = response.headers.get("PAYMENT-RESPONSE");
    let detail = "";
    if (paymentResponse) {
      try {
        detail = `: ${JSON.stringify(decodePaymentResponseHeader(paymentResponse))}`;
      } catch {
        detail = ": invalid PAYMENT-RESPONSE";
      }
    } else {
      const body = await response.text();
      if (body && body !== "{}") detail = `: ${body.slice(0, 500)}`;
    }
    throw new Error(`Request failed: ${response.status}${detail}`);
  }
  return {
    data: await response.json(),
    receipt: response.headers.get("PAYMENT-RESPONSE")
      ? decodePaymentResponseHeader(response.headers.get("PAYMENT-RESPONSE")!)
      : null,
  };
}

export async function createDevnetPaymentFetch(options: {
  privateKeyBytes: Uint8Array;
  maxPerRequestAtomic?: bigint;
  maxSessionAtomic?: bigint;
  rpcUrl?: string;
}): Promise<typeof fetch> {
  return (await createDevnetPaymentClient(options)).fetch;
}

export async function createDevnetPaymentClient(options: {
  privateKeyBytes: Uint8Array;
  maxPerRequestAtomic?: bigint;
  maxSessionAtomic?: bigint;
  rpcUrl?: string;
}): Promise<{ fetch: typeof fetch; getLastPaymentHeader: () => string | undefined }> {
  const signer = await createKeyPairSignerFromBytes(options.privateKeyBytes);
  const maxPerRequest = options.maxPerRequestAtomic ?? 100_000n;
  const maxSession = options.maxSessionAtomic ?? 1_000_000n;
  let authorized = 0n;
  const client = new x402Client()
    .register(
      SOLANA_DEVNET,
      new ExactSvmScheme(signer, {
        rpcUrl: options.rpcUrl ?? "https://api.devnet.solana.com",
      }),
    )
    .registerPolicy((_version, requirements) => requirements.filter((requirement) => {
      if (requirement.network !== SOLANA_DEVNET) return false;
      const amount = BigInt(requirement.amount);
      return amount <= maxPerRequest && authorized + amount <= maxSession;
    }))
    .onAfterPaymentCreation(async ({ selectedRequirements }) => {
      authorized += BigInt(selectedRequirements.amount);
    });
  let lastPaymentHeader: string | undefined;
  const observedFetch: typeof fetch = async (input, init) => {
    const headers = input instanceof Request ? input.headers : new Headers(init?.headers);
    const payment = headers.get("PAYMENT-SIGNATURE");
    if (payment) lastPaymentHeader = payment;
    return fetch(input, init);
  };
  return {
    fetch: wrapFetchWithPayment(observedFetch, client),
    getLastPaymentHeader: () => lastPaymentHeader,
  };
}

async function main() {
  const encoded = process.env.SOLANA_PRIVATE_KEY;
  if (!encoded) throw new Error("SOLANA_PRIVATE_KEY must be a JSON array of 64 bytes");
  const parsed: unknown = JSON.parse(encoded);
  if (!Array.isArray(parsed) || parsed.length !== 64 ||
      !parsed.every((item) => Number.isInteger(item) && item >= 0 && item <= 255)) {
    throw new Error("SOLANA_PRIVATE_KEY must contain exactly 64 bytes");
  }
  const paidFetch = await createDevnetPaymentFetch({
    privateKeyBytes: Uint8Array.from(parsed as number[]),
    maxPerRequestAtomic: BigInt(process.env.MAX_PAYMENT_ATOMIC ?? "100000"),
    maxSessionAtomic: BigInt(process.env.MAX_SESSION_SPEND_ATOMIC ?? "1000000"),
    ...(process.env.SOLANA_RPC_URL ? { rpcUrl: process.env.SOLANA_RPC_URL } : {}),
  });
  const result = await callPaidWeather(paidFetch, process.argv[2]);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
