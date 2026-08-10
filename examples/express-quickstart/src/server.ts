import express from "express";
import type { Express } from "express";
import { MemoryPaymentStore, protect, SOLANA_DEVNET } from "@usemeterkit/sdk";
import { createWebacyPolicy } from "@usemeterkit/policy-webacy";

export function createApp(merchantWallet: string): Express {
  const app = express();
  const store = new MemoryPaymentStore();
  const policies = process.env.WEBACY_API_KEY
    ? [
        {
          evaluator: createWebacyPolicy({
            id: "payer-risk",
            apiKey: process.env.WEBACY_API_KEY,
          }),
          configuration: {
            id: "payer-risk",
            mode: "observe" as const,
            onError: "allow" as const,
          },
        },
      ]
    : [];
  app.get(
    "/premium",
    protect({
      product: {
        id: "premium",
        name: "Premium API",
        description: "A protected JSON response",
        resource: "http://localhost:3000/premium",
        priceAtomic: "10000",
        assetMint: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
        payTo: merchantWallet,
        network: SOLANA_DEVNET,
      },
      store,
      rpcUrl: false,
      policies,
    }),
    (_request, response) => response.json({ protected: true }),
  );
  return app;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const merchantWallet = process.env.MERCHANT_WALLET;
  if (!merchantWallet)
    throw new Error(
      "Set MERCHANT_WALLET to a disposable Solana devnet address",
    );
  createApp(merchantWallet).listen(3000, () => {
    process.stdout.write(
      "MeterKit quickstart ready: http://localhost:3000/premium\n",
    );
    process.stdout.write("Next: curl -i http://localhost:3000/premium\n");
  });
}
