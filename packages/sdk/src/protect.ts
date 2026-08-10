import type { RequestHandler } from "express";
import {
  productSchema,
  type PaymentStore,
  type Product,
} from "@usemeterkit/core";
import type { FacilitatorClient } from "@x402/core/server";
import type { PublicPaymentReceipt } from "@usemeterkit/core";
import type { PaymentEventSink } from "./events.js";
import type { ConfiguredPaymentPolicy } from "./policy-runner.js";
import { createX402Middleware, SolanaSettlementValidator } from "./index.js";
import type { AgentBudgetGuard } from "./agent-budget.js";

export type ProtectOptions = {
  product: Product;
  store: PaymentStore;
  facilitatorUrl?: string;
  facilitatorClient?: FacilitatorClient;
  rpcUrl?: string | false;
  settlementValidator?: SolanaSettlementValidator | false;
  policies?: readonly ConfiguredPaymentPolicy[];
  onEvent?: PaymentEventSink;
  onReceipt?: (receipt: PublicPaymentReceipt) => void | Promise<void>;
  agentBudget?: AgentBudgetGuard;
};

export function protect(rawOptions: ProtectOptions): RequestHandler {
  let options: ProtectOptions;
  try {
    const product = productSchema.parse(rawOptions.product);
    const resource = new URL(product.resource);
    if (
      !["http:", "https:"].includes(resource.protocol) ||
      resource.username ||
      resource.password
    ) {
      throw new Error("unsafe resource URL");
    }
    options = {
      ...rawOptions,
      product: { ...product, resource: resource.toString() },
    };
  } catch (cause) {
    throw new Error("CONFIG_INVALID", { cause });
  }

  return createX402Middleware(options);
}
