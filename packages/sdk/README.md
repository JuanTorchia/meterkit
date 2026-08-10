# @usemeterkit/sdk

Non-custodial x402 payments for Express APIs on Solana. The client pays your
wallet directly; MeterKit never receives funds or signing secrets.

## Install

```bash
pnpm add @usemeterkit/sdk express
```

## Protect one endpoint

Create `server.mjs`:

```js
import express from "express";
import { MemoryPaymentStore, protect, SOLANA_DEVNET } from "@usemeterkit/sdk";

const merchantWallet = process.env.MERCHANT_WALLET;
if (!merchantWallet) throw new Error("Set MERCHANT_WALLET to a devnet address");

const app = express();

app.get(
  "/premium",
  protect({
    product: {
      id: "premium",
      name: "Premium API",
      description: "Paid JSON response",
      resource: "http://localhost:3000/premium",
      priceAtomic: "10000",
      assetMint: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
      payTo: merchantWallet,
      network: SOLANA_DEVNET,
    },
    // Local quickstart only. Use a durable PaymentStore for replicas/production.
    store: new MemoryPaymentStore(),
    // Challenge-only local setup. Enable RPC validation for paid devnet retries.
    rpcUrl: false,
  }),
  (_request, response) => response.json({ protected: true }),
);

app.listen(3000, () => console.log("http://localhost:3000/premium"));
```

Run it:

```bash
MERCHANT_WALLET=<disposable-devnet-public-address> node server.mjs
curl -i http://localhost:3000/premium
```

Expected: HTTP `402` with a `PAYMENT-REQUIRED` header for 0.01 test USDC on
Solana devnet. Continue with the repository's
[end-to-end guide](https://github.com/JuanTorchia/meterkit/blob/main/docs/sdk-quickstart.md)
to pay using a disposable client wallet, retry the request, inspect the sanitized
receipt, and prove replay rejection.

## Public API lifecycle

- `protect()` is the recommended integration.
- `createX402Middleware()` remains compatible during the 0.1 release line.
- `createDynamicX402Middleware()` is for the hosted multi-product gateway.
- `createMeterKitMiddleware()` is a legacy low-level compatibility path.

MeterKit currently supports devnet only. Do not use mainnet assets or place a
private key, seed phrase, payment proof, bearer credential, or full signature in
configuration or logs.
