import { serve } from "@hono/node-server";
import { createMeterKitResourceServer, SOLANA_DEVNET } from "@usemeterkit/sdk";
import { paymentMiddleware } from "@x402/hono";
import { Hono } from "hono";
import { createPaymentStore } from "./payment-store.js";

const wallet = process.env.MERCHANT_WALLET;
if (!wallet)
  throw new Error("Set MERCHANT_WALLET to a disposable devnet address");
const port = Number(process.env.PORT ?? "3000");
const product = {
  id: "premium",
  name: "Premium API",
  description: "Protected data",
  resource: `http://localhost:${port}/premium`,
  priceAtomic: "10000",
  assetMint: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
  payTo: wallet,
  network: SOLANA_DEVNET,
} as const;
const store = await createPaymentStore();
const server = createMeterKitResourceServer({
  product,
  store,
  rpcUrl: process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com",
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
serve({ fetch: app.fetch, port });
process.stdout.write(`MeterKit: http://localhost:${port}/premium\n`);
