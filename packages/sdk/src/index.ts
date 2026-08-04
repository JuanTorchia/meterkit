import type { NextFunction, Request, Response } from "express";
import {
  SOLANA_DEVNET,
  paymentRecordSchema,
  type PaymentStore,
  type Product,
} from "@meterkit/core";
import { z } from "zod";
import {
  HTTPFacilitatorClient,
  x402ResourceServer,
  type FacilitatorClient,
} from "@x402/core/server";
import { paymentMiddleware } from "@x402/express";
import { ExactSvmScheme } from "@x402/svm/exact/server";

export interface Settlement {
  success: boolean;
  transaction?: string | undefined;
  payer?: string | undefined;
  network?: string | undefined;
}

export interface Facilitator {
  settle(paymentHeader: string, requirements: PaymentRequirements): Promise<Settlement>;
}

export interface PaymentRequirements {
  scheme: "exact";
  network: typeof SOLANA_DEVNET;
  amount: string;
  asset: string;
  payTo: string;
  maxTimeoutSeconds: number;
  resource: { url: string; description: string; mimeType: string };
  extra: { feePayer?: string };
}

const headerSchema = z.string().min(16).max(20_000);
const tokenBalanceSchema = z.object({
  accountIndex: z.number().int().nonnegative(),
  mint: z.string(),
  owner: z.string().optional(),
  uiTokenAmount: z.object({ amount: z.string().regex(/^\d+$/) }),
});
const parsedTransactionSchema = z.object({
  result: z.object({
    meta: z.object({
      err: z.unknown().nullable(),
      preTokenBalances: z.array(tokenBalanceSchema).optional().default([]),
      postTokenBalances: z.array(tokenBalanceSchema).optional().default([]),
    }),
  }).nullable(),
});

export class SolanaSettlementValidator {
  constructor(
    private readonly rpcUrl: string,
    private readonly request: typeof fetch = fetch,
    private readonly attempts = 30,
  ) {}

  async validate(input: {
    signature: string;
    payer: string;
    payTo: string;
    mint: string;
    amountAtomic: string;
  }) {
    for (let attempt = 0; attempt < this.attempts; attempt += 1) {
      const response = await this.request(this.rpcUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: crypto.randomUUID(),
          method: "getTransaction",
          params: [input.signature, {
            encoding: "jsonParsed",
            commitment: "confirmed",
            maxSupportedTransactionVersion: 0,
          }],
        }),
      });
      if (!response.ok) throw new Error(`SOLANA_RPC_${response.status}`);
      const parsed = parsedTransactionSchema.parse(await response.json());
      if (!parsed.result) {
        if (attempt + 1 < this.attempts) {
          await new Promise((resolve) => setTimeout(resolve, 1_000));
          continue;
        }
        throw new Error("SETTLEMENT_TRANSACTION_NOT_FOUND");
      }
      if (parsed.result.meta.err !== null) throw new Error("SETTLEMENT_TRANSACTION_FAILED");
      const delta = ownerMintDelta(
        parsed.result.meta.preTokenBalances,
        parsed.result.meta.postTokenBalances,
        input.payTo,
        input.mint,
      );
      if (delta !== BigInt(input.amountAtomic)) throw new Error("SETTLEMENT_TRANSFER_MISMATCH");
      const payerDelta = ownerMintDelta(
        parsed.result.meta.preTokenBalances,
        parsed.result.meta.postTokenBalances,
        input.payer,
        input.mint,
      );
      if (payerDelta > -BigInt(input.amountAtomic)) throw new Error("SETTLEMENT_PAYER_MISMATCH");
      return;
    }
  }
}

function ownerMintDelta(
  before: readonly z.infer<typeof tokenBalanceSchema>[],
  after: readonly z.infer<typeof tokenBalanceSchema>[],
  owner: string,
  mint: string,
) {
  const sum = (balances: readonly z.infer<typeof tokenBalanceSchema>[]) =>
    balances.reduce((total, balance) =>
      balance.owner === owner && balance.mint === mint
        ? total + BigInt(balance.uiTokenAmount.amount)
        : total, 0n);
  return sum(after) - sum(before);
}

export function createMeterKitMiddleware(options: {
  product: Product;
  facilitator: Facilitator;
  store: PaymentStore;
  now?: () => Date;
  onSettled?: (payment: unknown) => Promise<void>;
}) {
  const now = options.now ?? (() => new Date());
  const requirements: PaymentRequirements = {
    scheme: "exact",
    network: SOLANA_DEVNET,
    amount: options.product.priceAtomic,
    asset: options.product.assetMint,
    payTo: options.product.payTo,
    maxTimeoutSeconds: 300,
    resource: {
      url: options.product.resource,
      description: options.product.description,
      mimeType: "application/json",
    },
    extra: {},
  };

  return async (request: Request, response: Response, next: NextFunction) => {
    const raw = request.header("PAYMENT-SIGNATURE");
    if (!raw) {
      const encoded = Buffer.from(JSON.stringify({
        x402Version: 2,
        error: "Payment required",
        resource: requirements.resource,
        accepts: [requirements],
      })).toString("base64");
      response.set("PAYMENT-REQUIRED", encoded).status(402).json({
        error: "payment_required",
        price: options.product.priceAtomic,
        currency: "USDC",
        network: SOLANA_DEVNET,
      });
      return;
    }

    try {
      const payment = headerSchema.parse(raw);
      const result = await options.facilitator.settle(payment, requirements);
      if (!result.success || !result.transaction || !result.payer) {
        response.status(402).json({ error: "payment_invalid" });
        return;
      }
      if (result.network && result.network !== SOLANA_DEVNET) {
        response.status(402).json({ error: "wrong_network" });
        return;
      }
      if (await options.store.has(result.transaction)) {
        response.status(409).json({ error: "payment_replayed" });
        return;
      }
      const record = paymentRecordSchema.parse({
        id: crypto.randomUUID(),
        productId: options.product.id,
        payer: result.payer,
        payTo: options.product.payTo,
        mint: options.product.assetMint,
        amountAtomic: options.product.priceAtomic,
        network: SOLANA_DEVNET,
        signature: result.transaction,
        settledAt: now().toISOString(),
        status: "confirmed",
      });
      await options.store.save(record);
      await options.onSettled?.(record);
      response.set("PAYMENT-RESPONSE", Buffer.from(JSON.stringify({
        success: true,
        transaction: result.transaction,
        network: SOLANA_DEVNET,
        payer: result.payer,
      })).toString("base64"));
      next();
    } catch {
      response.status(400).json({ error: "malformed_payment" });
    }
  };
}

export class HttpFacilitator implements Facilitator {
  constructor(private readonly url: string) {}
  async settle(paymentHeader: string, requirements: PaymentRequirements): Promise<Settlement> {
    const paymentPayload = JSON.parse(Buffer.from(paymentHeader, "base64").toString("utf8"));
    const response = await fetch(`${this.url.replace(/\/$/, "")}/settle`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ x402Version: 2, paymentPayload, paymentRequirements: requirements }),
    });
    if (!response.ok) return { success: false };
    return z.object({
      success: z.boolean(),
      transaction: z.string().optional(),
      payer: z.string().optional(),
      network: z.string().optional(),
    }).parse(await response.json());
  }
}

/**
 * Protocol-native x402 v2 middleware. This is the recommended integration.
 * It delegates challenge parsing, verification and settlement to the audited
 * upstream x402 packages, while MeterKit owns persistence and analytics hooks.
 */
export function createX402Middleware(options: {
  product: Product;
  store: PaymentStore;
  facilitatorUrl?: string;
  facilitatorClient?: FacilitatorClient;
  rpcUrl?: string | false;
  settlementValidator?: SolanaSettlementValidator | false;
}) {
  const rpcUrl = options.rpcUrl === false
    ? false
    : options.rpcUrl ?? "https://api.devnet.solana.com";
  const settlementValidator = options.settlementValidator === false || rpcUrl === false
    ? undefined
    : options.settlementValidator ?? new SolanaSettlementValidator(rpcUrl);
  const facilitator = options.facilitatorClient ?? new HTTPFacilitatorClient({
    url: options.facilitatorUrl ?? "https://x402.org/facilitator",
  });
  const server = new x402ResourceServer(facilitator)
    .register(SOLANA_DEVNET, new ExactSvmScheme(rpcUrl === false
      ? {}
      : { rpcUrl }))
    .onAfterSettle(async ({ result, requirements }) => {
      if (!result.success || !result.payer || !result.transaction) return;
      await settlementValidator?.validate({
        signature: result.transaction,
        payer: result.payer,
        payTo: requirements.payTo,
        mint: requirements.asset,
        amountAtomic: requirements.amount,
      });
      const record = paymentRecordSchema.parse({
        id: crypto.randomUUID(),
        productId: options.product.id,
        payer: result.payer,
        payTo: requirements.payTo,
        mint: requirements.asset,
        amountAtomic: requirements.amount,
        network: SOLANA_DEVNET,
        signature: result.transaction,
        settledAt: new Date().toISOString(),
        status: "confirmed",
      });
      // Keep this write in the request path. A unique-key conflict must stop
      // the protected handler, even if a facilitator incorrectly accepts a
      // previously settled payload.
      await options.store.save(record);
    });

  return paymentMiddleware(
    {
      [`GET ${new URL(options.product.resource).pathname}`]: {
        accepts: {
          scheme: "exact",
          price: {
            amount: options.product.priceAtomic,
            asset: options.product.assetMint,
          },
          network: SOLANA_DEVNET,
          payTo: options.product.payTo,
          maxTimeoutSeconds: 300,
        },
        description: options.product.description,
        mimeType: "application/json",
      },
    },
    server,
  );
}

export function createDynamicX402Middleware(options: {
  resolveProduct: (id: string) => Promise<Product | null>;
  store: PaymentStore;
  facilitatorUrl?: string;
  facilitatorClient?: FacilitatorClient;
  rpcUrl?: string | false;
  settlementValidator?: SolanaSettlementValidator | false;
}) {
  const productFromPath = async (path: string) => {
    const match = /^\/v1\/products\/([a-z0-9-]+)\/proxy$/.exec(path);
    if (!match?.[1]) throw new Error("PRODUCT_ROUTE_INVALID");
    const product = await options.resolveProduct(match[1]);
    if (!product) throw new Error("PRODUCT_NOT_FOUND");
    return product;
  };
  const facilitator = options.facilitatorClient ?? new HTTPFacilitatorClient({
    url: options.facilitatorUrl ?? "https://x402.org/facilitator",
  });
  const rpcUrl = options.rpcUrl === false
    ? false
    : options.rpcUrl ?? "https://api.devnet.solana.com";
  const settlementValidator = options.settlementValidator === false || rpcUrl === false
    ? undefined
    : options.settlementValidator ?? new SolanaSettlementValidator(rpcUrl);
  const server = new x402ResourceServer(facilitator)
    .register(SOLANA_DEVNET, new ExactSvmScheme(rpcUrl === false
      ? {}
      : { rpcUrl }))
    .onAfterSettle(async ({ result, requirements, transportContext }) => {
      if (!result.success || !result.payer || !result.transaction) return;
      const path = (transportContext as { request?: { path?: string } } | undefined)?.request?.path;
      if (!path) throw new Error("PAYMENT_PATH_MISSING");
      const product = await productFromPath(path);
      await settlementValidator?.validate({
        signature: result.transaction,
        payer: result.payer,
        payTo: requirements.payTo,
        mint: requirements.asset,
        amountAtomic: requirements.amount,
      });
      await options.store.save(paymentRecordSchema.parse({
        id: crypto.randomUUID(), productId: product.id, payer: result.payer,
        payTo: requirements.payTo, mint: requirements.asset,
        amountAtomic: requirements.amount, network: SOLANA_DEVNET,
          signature: result.transaction, settledAt: new Date().toISOString(), status: "confirmed",
      }));
    });
  return paymentMiddleware({
    "GET /v1/products/*/proxy": {
      accepts: {
        scheme: "exact",
        price: async ({ path }) => {
          const product = await productFromPath(path);
          return { amount: product.priceAtomic, asset: product.assetMint };
        },
        network: SOLANA_DEVNET,
        payTo: async ({ path }) => (await productFromPath(path)).payTo,
        maxTimeoutSeconds: 300,
      },
      description: "MeterKit protected product",
      mimeType: "application/json",
      unpaidResponseBody: async ({ path }) => ({
        contentType: "application/json",
        body: { error: "payment_required", product: (await productFromPath(path)).id },
      }),
    },
  }, server);
}
