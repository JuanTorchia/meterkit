import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { createKeyPairSignerFromBytes } from "@solana/kit";
import { x402Client, wrapFetchWithPayment } from "@x402/fetch";
import { ExactSvmScheme } from "@x402/svm";
import { SOLANA_DEVNET } from "@usemeterkit/core";
import { z } from "zod";
import {
  assertPrivateFilePermissions,
  parseAtomicLimit,
  parsePublicUrl,
  parseSolanaAddress,
} from "./config.js";

export type PayOptions = {
  endpoint: string;
  keypairPath: string;
  recipient: string;
  mint: string;
  maxAmountAtomic: string;
  maxSessionAtomic: string;
  rpcUrl?: string;
  replay?: boolean;
};

export function validatePaymentTerms(
  requirement: {
    network: string;
    asset: string;
    payTo: string;
    amount: string;
    resource?: { url: string };
  },
  options: Omit<PayOptions, "keypairPath">,
) {
  if (requirement.network !== SOLANA_DEVNET)
    throw new Error("PAYMENT_NETWORK_NOT_ALLOWED");
  if (requirement.asset !== options.mint)
    throw new Error("PAYMENT_MINT_NOT_ALLOWED");
  if (requirement.payTo !== options.recipient)
    throw new Error("PAYMENT_RECIPIENT_NOT_ALLOWED");
  if (
    requirement.resource &&
    parsePublicUrl(requirement.resource.url).toString() !==
      parsePublicUrl(options.endpoint).toString()
  )
    throw new Error("PAYMENT_RESOURCE_NOT_ALLOWED");
  if (BigInt(requirement.amount) > parseAtomicLimit(options.maxAmountAtomic))
    throw new Error("PAYMENT_AMOUNT_EXCEEDS_LIMIT");
}

export async function readKeypairFile(path: string) {
  await assertPrivateFilePermissions(path);
  const parsed: unknown = JSON.parse(await readFile(path, "utf8"));
  if (
    !Array.isArray(parsed) ||
    parsed.length !== 64 ||
    !parsed.every((item) => Number.isInteger(item) && item >= 0 && item <= 255)
  )
    throw new Error("keypair file must contain exactly 64 bytes");
  return Uint8Array.from(parsed as number[]);
}

const paymentResponseSchema = z
  .object({
    success: z.literal(true),
    transaction: z.string().min(8).max(512),
    network: z.literal(SOLANA_DEVNET),
  })
  .passthrough();

export function parsePaymentResponse(value: string | null) {
  if (!value) throw new Error("PAYMENT_RESPONSE_MISSING");
  try {
    return paymentResponseSchema.parse(
      JSON.parse(Buffer.from(value, "base64").toString("utf8")),
    );
  } catch (error) {
    if (error instanceof Error && error.message === "PAYMENT_RESPONSE_MISSING")
      throw error;
    throw new Error("PAYMENT_RESPONSE_INVALID");
  }
}

export async function payEndpoint(
  options: PayOptions,
  rawFetch: typeof fetch = fetch,
) {
  const endpoint = parsePublicUrl(options.endpoint).toString();
  const recipient = parseSolanaAddress(options.recipient);
  parseSolanaAddress(options.mint);
  const maxPerRequest = parseAtomicLimit(options.maxAmountAtomic);
  const maxSession = parseAtomicLimit(options.maxSessionAtomic);
  if (maxSession < maxPerRequest)
    throw new Error("session limit must be at least the request limit");
  const signer = await createKeyPairSignerFromBytes(
    await readKeypairFile(options.keypairPath),
  );
  let authorized = 0n;
  let paymentHeader: string | undefined;
  const client = new x402Client()
    .register(
      SOLANA_DEVNET,
      new ExactSvmScheme(signer, {
        rpcUrl: options.rpcUrl ?? "https://api.devnet.solana.com",
      }),
    )
    .registerPolicy((_version, requirements) =>
      requirements.filter((requirement) => {
        try {
          validatePaymentTerms(
            requirement as Parameters<typeof validatePaymentTerms>[0],
            { ...options, endpoint, recipient },
          );
          const amount = BigInt(requirement.amount);
          return authorized + amount <= maxSession;
        } catch {
          return false;
        }
      }),
    )
    .onBeforePaymentCreation(async ({ paymentRequired }) => {
      if (parsePublicUrl(paymentRequired.resource.url).toString() !== endpoint)
        return { abort: true, reason: "PAYMENT_RESOURCE_NOT_ALLOWED" };
    })
    .onAfterPaymentCreation(async ({ selectedRequirements }) => {
      authorized += BigInt(selectedRequirements.amount);
    });
  const observedFetch: typeof fetch = async (input, init) => {
    const headers =
      input instanceof Request ? input.headers : new Headers(init?.headers);
    paymentHeader = headers.get("PAYMENT-SIGNATURE") ?? undefined;
    return rawFetch(input, init);
  };
  const response = await wrapFetchWithPayment(observedFetch, client)(endpoint);
  if (!response.ok)
    throw new Error(`PAYMENT_REQUEST_FAILED_${response.status}`);
  const settlement = parsePaymentResponse(
    response.headers.get("PAYMENT-RESPONSE"),
  );
  const protectedBody = await response.text();
  let replayStatus: number | undefined;
  if (options.replay) {
    if (!paymentHeader) throw new Error("PAYMENT_SESSION_HEADER_MISSING");
    replayStatus = (
      await rawFetch(endpoint, {
        headers: { "PAYMENT-SIGNATURE": paymentHeader },
      })
    ).status;
    if (replayStatus < 400) throw new Error("PAYMENT_REPLAY_ACCEPTED");
  }
  return {
    status: response.status,
    protectedResponse: protectedBody.length > 0,
    settlementFingerprint: createHash("sha256")
      .update(settlement.transaction)
      .digest("hex")
      .slice(0, 16),
    ...(replayStatus ? { replayStatus } : {}),
    paymentFingerprint: paymentHeader
      ? createHash("sha256").update(paymentHeader).digest("hex").slice(0, 16)
      : undefined,
  };
}
