# @meterkit/sdk

Express middleware for non-custodial x402 v2 payments in USDC on Solana.

```ts
import { createX402Middleware } from "@meterkit/sdk";

app.get("/premium", createX402Middleware({
  product: {
    id: "premium",
    name: "Premium API",
    description: "Paid response",
    resource: "https://api.example.com/premium",
    priceAtomic: "10000",
    assetMint: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
    payTo: process.env.MERCHANT_WALLET!,
    network: "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1",
  },
  store,
}), handler);
```

`10000` atomic units are 0.01 USDC. The private key remains in the payer's wallet; the provider receives settlement directly. The current release intentionally accepts Solana devnet only.
