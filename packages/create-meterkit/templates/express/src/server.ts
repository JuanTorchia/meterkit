import express from "express";
import { MemoryPaymentStore, protect, SOLANA_DEVNET } from "@usemeterkit/sdk";

const wallet = process.env.MERCHANT_WALLET;
if (!wallet)
  throw new Error("Set MERCHANT_WALLET to a disposable devnet address");
const port = Number(process.env.PORT ?? "3000");
const app = express();
app.get(
  "/premium",
  protect({
    product: {
      id: "premium",
      name: "Premium API",
      description: "Protected data",
      resource: `http://localhost:${port}/premium`,
      priceAtomic: "10000",
      assetMint: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
      payTo: wallet,
      network: SOLANA_DEVNET,
    },
    store: new MemoryPaymentStore(),
    rpcUrl: process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com",
  }),
  (_request, response) => response.json({ protected: true }),
);
app.listen(port, () =>
  process.stdout.write(`MeterKit: http://localhost:${port}/premium\n`),
);
