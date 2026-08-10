import express from "express";
import {
  createX402Middleware,
  MemoryPaymentStore,
  SOLANA_DEVNET,
} from "@usemeterkit/sdk";

const merchantWallet = process.env.MERCHANT_WALLET;
if (!merchantWallet) {
  throw new Error("Set MERCHANT_WALLET to a disposable Solana devnet address");
}

const app = express();
const store = new MemoryPaymentStore();

app.get(
  "/premium",
  createX402Middleware({
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
  }),
  (_request, response) => response.json({ protected: true }),
);

app.listen(3000, () => {
  process.stdout.write("MeterKit quickstart: http://localhost:3000/premium\n");
});
