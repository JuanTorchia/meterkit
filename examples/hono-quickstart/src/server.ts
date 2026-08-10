import { serve } from "@hono/node-server";
import {
  MemoryPaymentStore,
  SOLANA_DEVNET,
  type PaymentStore,
} from "@usemeterkit/core";
import { createMeterKitResourceServer } from "@usemeterkit/sdk";
import type { FacilitatorClient } from "@x402/core/server";
import { paymentMiddleware } from "@x402/hono";
import { Hono } from "hono";

const USDC_DEVNET = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";

export function createApp(
  merchantWallet: string,
  options: {
    facilitatorClient?: FacilitatorClient;
    store?: PaymentStore;
    rpcUrl?: string | false;
  } = {},
) {
  const product = {
    id: "hono-premium",
    name: "Premium Hono API",
    description: "A protected Hono JSON response",
    resource: "http://localhost/premium",
    priceAtomic: "10000",
    assetMint: USDC_DEVNET,
    payTo: merchantWallet,
    network: SOLANA_DEVNET,
  } as const;
  const server = createMeterKitResourceServer({
    product,
    store: options.store ?? new MemoryPaymentStore(),
    ...(options.facilitatorClient
      ? { facilitatorClient: options.facilitatorClient }
      : {}),
    ...(options.rpcUrl !== undefined ? { rpcUrl: options.rpcUrl } : {}),
  });
  const app = new Hono();
  app.use(
    paymentMiddleware(
      {
        "GET /premium": {
          accepts: {
            scheme: "exact",
            price: { amount: product.priceAtomic, asset: product.assetMint },
            network: SOLANA_DEVNET,
            payTo: product.payTo,
            maxTimeoutSeconds: 300,
          },
          description: product.description,
          mimeType: "application/json",
        },
      },
      server,
    ),
  );
  app.get("/premium", (context) => context.json({ protected: true }));
  return app;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const merchantWallet = process.env.MERCHANT_WALLET;
  if (!merchantWallet)
    throw new Error(
      "Set MERCHANT_WALLET to a disposable Solana devnet address",
    );
  const port = Number(process.env.PORT ?? "3000");
  serve({ fetch: createApp(merchantWallet).fetch, port });
  process.stdout.write(
    `MeterKit Hono ready: http://localhost:${port}/premium\n`,
  );
}
