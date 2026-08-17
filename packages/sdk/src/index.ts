import type { NextFunction, Request, Response } from "express";
import {
  SOLANA_DEVNET,
  X402_PROTOCOL_VERSION,
  fingerprintSignature,
  paymentRecordSchema,
  publicPaymentReceiptSchema,
  type PaymentStore,
  type Product,
  type PublicPaymentReceipt,
  type PolicyDecision,
} from "@usemeterkit/core";
import { z } from "zod";
import {
  HTTPFacilitatorClient,
  x402ResourceServer,
  type FacilitatorClient,
} from "@x402/core/server";
import { paymentMiddleware } from "@x402/express";
import { ExactSvmScheme } from "@x402/svm/exact/server";
import { emitSafely, type PaymentEventSink } from "./events.js";
import {
  runPaymentPolicies,
  type ConfiguredPaymentPolicy,
} from "./policy-runner.js";

export { protect } from "./protect.js";
export type { ProtectOptions } from "./protect.js";
export * from "./events.js";
export * from "./policy-runner.js";
export * from "./agent-budget.js";

export { MemoryPaymentStore, SOLANA_DEVNET } from "@usemeterkit/core";
export type { PaymentStore, Product } from "@usemeterkit/core";

export interface Settlement {
  success: boolean;
  transaction?: string | undefined;
  payer?: string | undefined;
  network?: string | undefined;
}

export interface Facilitator {
  settle(
    paymentHeader: string,
    requirements: PaymentRequirements,
  ): Promise<Settlement>;
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
  result: z
    .object({
      meta: z.object({
        err: z.unknown().nullable(),
        preTokenBalances: z.array(tokenBalanceSchema).optional().default([]),
        postTokenBalances: z.array(tokenBalanceSchema).optional().default([]),
      }),
    })
    .nullable(),
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
          params: [
            input.signature,
            {
              encoding: "jsonParsed",
              commitment: "confirmed",
              maxSupportedTransactionVersion: 0,
            },
          ],
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
      if (parsed.result.meta.err !== null)
        throw new Error("SETTLEMENT_TRANSACTION_FAILED");
      const delta = ownerMintDelta(
        parsed.result.meta.preTokenBalances,
        parsed.result.meta.postTokenBalances,
        input.payTo,
        input.mint,
      );
      if (delta !== BigInt(input.amountAtomic))
        throw new Error("SETTLEMENT_TRANSFER_MISMATCH");
      const payerDelta = ownerMintDelta(
        parsed.result.meta.preTokenBalances,
        parsed.result.meta.postTokenBalances,
        input.payer,
        input.mint,
      );
      if (payerDelta > -BigInt(input.amountAtomic))
        throw new Error("SETTLEMENT_PAYER_MISMATCH");
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
    balances.reduce(
      (total, balance) =>
        balance.owner === owner && balance.mint === mint
          ? total + BigInt(balance.uiTokenAmount.amount)
          : total,
      0n,
    );
  return sum(after) - sum(before);
}

async function paymentPayloadFingerprint(paymentPayload: unknown) {
  const bytes = new TextEncoder().encode(JSON.stringify(paymentPayload));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Buffer.from(digest).toString("hex");
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
      const encoded = Buffer.from(
        JSON.stringify({
          x402Version: X402_PROTOCOL_VERSION,
          error: "Payment required",
          resource: requirements.resource,
          accepts: [requirements],
        }),
      ).toString("base64");
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
      response.set(
        "PAYMENT-RESPONSE",
        Buffer.from(
          JSON.stringify({
            success: true,
            transaction: result.transaction,
            network: SOLANA_DEVNET,
            payer: result.payer,
          }),
        ).toString("base64"),
      );
      next();
    } catch (error) {
      if (error instanceof Error && error.message === "PAYMENT_REPLAYED") {
        response.status(409).json({ error: "payment_replayed" });
        return;
      }
      response.status(400).json({ error: "malformed_payment" });
    }
  };
}

export class HttpFacilitator implements Facilitator {
  constructor(private readonly url: string) {}
  async settle(
    paymentHeader: string,
    requirements: PaymentRequirements,
  ): Promise<Settlement> {
    const paymentPayload = JSON.parse(
      Buffer.from(paymentHeader, "base64").toString("utf8"),
    );
    const response = await fetch(`${this.url.replace(/\/$/, "")}/settle`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        x402Version: X402_PROTOCOL_VERSION,
        paymentPayload,
        paymentRequirements: requirements,
      }),
    });
    if (!response.ok) return { success: false };
    return z
      .object({
        success: z.boolean(),
        transaction: z.string().optional(),
        payer: z.string().optional(),
        network: z.string().optional(),
      })
      .parse(await response.json());
  }
}

/**
 * Protocol-native x402 middleware. This is the recommended integration.
 * It delegates challenge parsing, verification and settlement to the audited
 * upstream x402 packages, while MeterKit owns persistence and analytics hooks.
 * The protocol revision on the wire is whatever those packages emit, so this
 * path is deliberately not pinned to a number here; see X402_PROTOCOL_VERSION
 * in @usemeterkit/core for the revision MeterKit itself writes and verifies.
 */
export function createX402Middleware(options: {
  product: Product;
  store: PaymentStore;
  facilitatorUrl?: string;
  facilitatorClient?: FacilitatorClient;
  rpcUrl?: string | false;
  settlementValidator?: SolanaSettlementValidator | false;
  policies?: readonly ConfiguredPaymentPolicy[];
  onEvent?: PaymentEventSink;
  onReceipt?: (receipt: PublicPaymentReceipt) => void | Promise<void>;
  agentBudget?: import("./agent-budget.js").AgentBudgetGuard;
}) {
  const server = createMeterKitResourceServer(options);
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

/** Build the protocol server shared by Express and framework-native adapters. */
export function createMeterKitResourceServer(options: {
  product: Product;
  store: PaymentStore;
  facilitatorUrl?: string;
  facilitatorClient?: FacilitatorClient;
  rpcUrl?: string | false;
  settlementValidator?: SolanaSettlementValidator | false;
  policies?: readonly ConfiguredPaymentPolicy[];
  onEvent?: PaymentEventSink;
  onReceipt?: (receipt: PublicPaymentReceipt) => void | Promise<void>;
  agentBudget?: import("./agent-budget.js").AgentBudgetGuard;
}) {
  const rpcUrl =
    options.rpcUrl === false
      ? false
      : (options.rpcUrl ?? "https://api.devnet.solana.com");
  const settlementValidator =
    options.settlementValidator === false || rpcUrl === false
      ? undefined
      : (options.settlementValidator ?? new SolanaSettlementValidator(rpcUrl));
  const facilitator =
    options.facilitatorClient ??
    new HTTPFacilitatorClient({
      url: options.facilitatorUrl ?? "https://x402.org/facilitator",
    });
  const settledRecords = new WeakMap<
    object,
    z.infer<typeof paymentRecordSchema>
  >();
  // x402 deliberately treats after-settlement hooks as observational and
  // swallows their failures. Persistence is authorization-critical for
  // MeterKit, so it must complete inside the facilitator boundary before a
  // successful settlement can reach any framework's protected handler.
  const durableFacilitator: FacilitatorClient = {
    getSupported: () => facilitator.getSupported(),
    verify: (paymentPayload, requirements) =>
      facilitator.verify(paymentPayload, requirements),
    settle: async (paymentPayload, requirements) => {
      const result = await facilitator.settle(paymentPayload, requirements);
      if (!result.success || !result.payer || !result.transaction)
        return result;
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
      await options.store.save(record);
      settledRecords.set(paymentPayload, record);
      return result;
    },
  };
  const policyResults = new WeakMap<object, PolicyDecision[]>();
  const budgetReservations = new WeakMap<
    object,
    import("./agent-budget.js").AgentBudgetReservation
  >();
  const localAuthorizationReservations = new Set<string>();
  const server = new x402ResourceServer(durableFacilitator)
    // Do not embed a volatile recentBlockhash in route requirements. The
    // middleware rebuilds requirements on the paid retry; a new blockhash would
    // make an otherwise identical payload fail requirement matching. The SVM
    // client obtains its own blockhash and we still validate settlement via RPC.
    .register(SOLANA_DEVNET, new ExactSvmScheme({}))
    .onAfterVerify(async ({ result, requirements, paymentPayload }) => {
      if (!result.isValid || !result.payer) return;
      if (options.policies?.length) {
        const evaluated = await runPaymentPolicies(
          {
            network: SOLANA_DEVNET,
            assetMint: requirements.asset,
            amountAtomic: requirements.amount,
            recipient: requirements.payTo,
            payer: result.payer,
            resource: options.product.resource,
          },
          options.policies,
        );
        policyResults.set(paymentPayload, evaluated.decisions);
        await emitSafely(options.onEvent, {
          schemaVersion: 1,
          type: "policy_evaluated",
          occurredAt: new Date().toISOString(),
          productId: options.product.id,
          reasonCode: evaluated.allowed ? "POLICY_ALLOWED" : "POLICY_DENIED",
        });
        if (!evaluated.allowed)
          return {
            abort: true as const,
            reason: "POLICY_DENIED",
            message: "Payment policy denied this request",
          };
      }
      if (options.agentBudget) {
        try {
          budgetReservations.set(
            paymentPayload,
            await options.agentBudget.reserve({
              payer: result.payer,
              network: SOLANA_DEVNET,
              assetMint: requirements.asset,
              recipient: requirements.payTo,
              resource: options.product.resource,
              amountAtomic: requirements.amount,
              paymentPayload,
            }),
          );
        } catch {
          return {
            abort: true as const,
            reason: "AGENT_BUDGET_DENIED",
            message: "Agent budget denied this request",
          };
        }
      }
      const authorizationFingerprint =
        await paymentPayloadFingerprint(paymentPayload);
      const reserved = options.store.reserveAuthorization
        ? await options.store.reserveAuthorization(authorizationFingerprint)
        : !localAuthorizationReservations.has(authorizationFingerprint);
      if (!options.store.reserveAuthorization && reserved)
        localAuthorizationReservations.add(authorizationFingerprint);
      if (!reserved)
        return {
          abort: true as const,
          reason: "PAYMENT_REPLAYED",
          message: "Payment authorization was already consumed",
        };
    })
    .onAfterSettle(async ({ result, requirements, paymentPayload }) => {
      if (!result.success || !result.payer || !result.transaction) return;
      const record = settledRecords.get(paymentPayload);
      if (!record) return;
      const budget = budgetReservations.get(paymentPayload);
      if (budget && !(await options.agentBudget?.consume(budget.reservationId)))
        throw new Error("AGENT_BUDGET_CONSUME_FAILED");
      const receipt = publicPaymentReceiptSchema.parse({
        schemaVersion: 1,
        receiptId: crypto.randomUUID(),
        productId: options.product.id,
        network: SOLANA_DEVNET,
        assetMint: requirements.asset,
        amountAtomic: requirements.amount,
        recipient: requirements.payTo,
        payer: result.payer,
        resource: options.product.resource,
        decision: "accepted",
        settlement: "confirmed",
        signatureFingerprint: fingerprintSignature(result.transaction),
        ...(budget
          ? {
              authorizationFingerprint: budget.authorizationFingerprint,
              paymentFingerprint: budget.paymentFingerprint,
            }
          : {}),
        explorerUrl: `https://explorer.solana.com/tx/${result.transaction}?cluster=devnet`,
        policyDecisions: policyResults.get(paymentPayload) ?? [],
        createdAt: record.settledAt,
        updatedAt: record.settledAt,
        reasonCode: "SETTLEMENT_CONFIRMED",
      });
      await options.onReceipt?.(receipt);
      await emitSafely(options.onEvent, {
        schemaVersion: 1,
        type: "settled",
        occurredAt: record.settledAt,
        productId: options.product.id,
        reasonCode: "SETTLEMENT_CONFIRMED",
        receiptId: receipt.receiptId,
        signatureFingerprint: receipt.signatureFingerprint,
      });
      policyResults.delete(paymentPayload);
      budgetReservations.delete(paymentPayload);
    })
    .onSettleFailure(async ({ paymentPayload }) => {
      const budget = budgetReservations.get(paymentPayload);
      if (budget) await options.agentBudget?.release(budget.reservationId);
      budgetReservations.delete(paymentPayload);
    })
    .onVerifiedPaymentCanceled(async ({ paymentPayload }) => {
      const budget = budgetReservations.get(paymentPayload);
      if (budget) await options.agentBudget?.release(budget.reservationId);
      budgetReservations.delete(paymentPayload);
    });

  return server;
}

export function createDynamicX402Middleware(options: {
  resolveProduct: (scope: {
    owner: string | null;
    slug: string;
  }) => Promise<Product | null>;
  store: PaymentStore;
  facilitatorUrl?: string;
  facilitatorClient?: FacilitatorClient;
  rpcUrl?: string | false;
  settlementValidator?: SolanaSettlementValidator | false;
}) {
  const productFromPath = async (path: string) => {
    const scope = parseProductScope(path);
    const product = await options.resolveProduct(scope);
    if (!product) throw new Error("PRODUCT_NOT_FOUND");
    return product;
  };
  const facilitator =
    options.facilitatorClient ??
    new HTTPFacilitatorClient({
      url: options.facilitatorUrl ?? "https://x402.org/facilitator",
    });
  const rpcUrl =
    options.rpcUrl === false
      ? false
      : (options.rpcUrl ?? "https://api.devnet.solana.com");
  const settlementValidator =
    options.settlementValidator === false || rpcUrl === false
      ? undefined
      : (options.settlementValidator ?? new SolanaSettlementValidator(rpcUrl));
  const server = new x402ResourceServer(facilitator)
    .register(SOLANA_DEVNET, new ExactSvmScheme({}))
    .onAfterSettle(async ({ result, requirements, transportContext }) => {
      if (!result.success || !result.payer || !result.transaction) return;
      const path = (
        transportContext as { request?: { path?: string } } | undefined
      )?.request?.path;
      if (!path) throw new Error("PAYMENT_PATH_MISSING");
      const product = await productFromPath(path);
      await settlementValidator?.validate({
        signature: result.transaction,
        payer: result.payer,
        payTo: requirements.payTo,
        mint: requirements.asset,
        amountAtomic: requirements.amount,
      });
      await options.store.save(
        paymentRecordSchema.parse({
          id: crypto.randomUUID(),
          productId: product.id,
          payer: result.payer,
          payTo: requirements.payTo,
          mint: requirements.asset,
          amountAtomic: requirements.amount,
          network: SOLANA_DEVNET,
          signature: result.transaction,
          settledAt: new Date().toISOString(),
          status: "confirmed",
        }),
      );
    });
  return paymentMiddleware(
    {
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
          body: {
            error: "payment_required",
            product: (await productFromPath(path)).id,
          },
        }),
      },
    },
    server,
  );
}

export function parseProductScope(path: string) {
  const scoped =
    /^\/v1\/products\/([1-9A-HJ-NP-Za-km-z]{32,44})\/([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)\/proxy$/.exec(
      path,
    );
  const legacy =
    /^\/v1\/products\/([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)\/proxy$/.exec(
      path,
    );
  const owner = scoped?.[1] ?? null;
  const slug = scoped?.[2] ?? legacy?.[1];
  if (!slug) throw new Error("PRODUCT_ROUTE_INVALID");
  return { owner, slug };
}
