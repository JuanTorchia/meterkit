import { createKeyPairSignerFromBytes } from "@solana/kit";
import { readFile } from "node:fs/promises";
import { createDevnetPaymentClient, callPaidWeather } from "./index.js";

const rpcUrl = process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com";
const gatewayUrl = process.env.GATEWAY_URL ?? "http://localhost:3402";
const merchant = required("MERCHANT_WALLET");
const persona = process.env.SYNTHETIC_PERSONA ?? "internal-agent";
const city = process.env.SYNTHETIC_CITY ?? "Buenos Aires";
const privateKeyBytes = await readPrivateKey();
const payer = await createKeyPairSignerFromBytes(privateKeyBytes);

const before = await usdcBalance(merchant);
const paymentClient = await createDevnetPaymentClient({
  privateKeyBytes,
  maxPerRequestAtomic: 10_000n,
  maxSessionAtomic: 10_000n,
  rpcUrl,
  expectedAssetMint: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
  expectedPayTo: merchant,
  allowedResourcePrefix: `${gatewayUrl}/v1/weather/premium`,
});
const result = await callPaidWeather(paymentClient.fetch, city, gatewayUrl);
const receipt = parseReceipt(result.receipt);
const paymentHeader = paymentClient.getLastPaymentHeader();
if (!paymentHeader) throw new Error("No se capturó PAYMENT-SIGNATURE");

const replay = await fetch(
  `${gatewayUrl}/v1/weather/premium?city=${encodeURIComponent(city)}`,
  {
    headers: { "PAYMENT-SIGNATURE": paymentHeader },
  },
);
if (replay.ok)
  throw new Error(
    "REPLAY_ACCEPTED: el comprobante volvió a ejecutar el recurso",
  );

const after = await waitForBalance(merchant, before + 10_000n);
const indexed = await waitForFinalizedReceipt(receipt.transaction);
process.stdout.write(
  `${JSON.stringify(
    {
      checkedAt: new Date().toISOString(),
      kind: "meterkit-internal-synthetic-validation",
      persona,
      externalUser: false,
      network: "solana-devnet",
      payer: payer.address,
      merchant,
      amountAtomic: "10000",
      merchantBalanceBeforeAtomic: String(before),
      merchantBalanceAfterAtomic: String(after),
      replayStatus: replay.status,
      transaction: receipt.transaction,
      explorerUrl: `https://explorer.solana.com/tx/${encodeURIComponent(receipt.transaction)}?cluster=devnet`,
      dashboardRecord: indexed,
      protectedResponse: result.data,
    },
    null,
    2,
  )}\n`,
);

async function rpc(method: string, params: unknown[]) {
  const response = await fetch(rpcUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: crypto.randomUUID(),
      method,
      params,
    }),
  });
  const body = (await response.json()) as { result?: unknown; error?: unknown };
  if (!response.ok || body.error)
    throw new Error(`RPC ${method} failed: ${JSON.stringify(body.error)}`);
  return body.result;
}

async function usdcBalance(owner: string) {
  const result = (await rpc("getTokenAccountsByOwner", [
    owner,
    { mint: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU" },
    { encoding: "jsonParsed", commitment: "confirmed" },
  ])) as {
    value?: Array<{
      account?: {
        data?: { parsed?: { info?: { tokenAmount?: { amount?: string } } } };
      };
    }>;
  };
  return (result.value ?? []).reduce(
    (sum, item) =>
      sum +
      BigInt(item.account?.data?.parsed?.info?.tokenAmount?.amount ?? "0"),
    0n,
  );
}

async function waitForBalance(owner: string, minimum: bigint) {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const balance = await usdcBalance(owner);
    if (balance >= minimum) return balance;
    await new Promise((resolve) => setTimeout(resolve, 2_000));
  }
  throw new Error(
    "El saldo USDC del proveedor no aumentó dentro de 60 segundos",
  );
}

async function waitForFinalizedReceipt(transaction: string) {
  for (let attempt = 0; attempt < 45; attempt += 1) {
    const response = await fetch(`${gatewayUrl}/v1/public/payments`);
    if (!response.ok)
      throw new Error(`Dashboard payments failed: ${response.status}`);
    const payments = (await response.json()) as Array<{
      signature?: string;
      status?: string;
    }>;
    const payment = payments.find(
      (candidate) => candidate.signature === transaction,
    );
    if (payment?.status === "finalized") return payment;
    await new Promise((resolve) => setTimeout(resolve, 2_000));
  }
  throw new Error("El recibo no llegó a finalized dentro de 90 segundos");
}

function parseReceipt(value: unknown): { transaction: string } {
  if (
    typeof value !== "object" ||
    value === null ||
    !("transaction" in value) ||
    typeof value.transaction !== "string"
  ) {
    throw new Error("PAYMENT-RESPONSE no contiene una transacción");
  }
  return { transaction: value.transaction };
}

async function readPrivateKey() {
  const keypairPath = process.env.SOLANA_KEYPAIR_PATH;
  const encoded = keypairPath
    ? await readFile(keypairPath, "utf8")
    : required("SOLANA_PRIVATE_KEY");
  const parsed: unknown = JSON.parse(encoded);
  if (
    !Array.isArray(parsed) ||
    parsed.length !== 64 ||
    !parsed.every((item) => Number.isInteger(item) && item >= 0 && item <= 255)
  ) {
    throw new Error("SOLANA_PRIVATE_KEY debe contener exactamente 64 bytes");
  }
  return Uint8Array.from(parsed as number[]);
}

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}
