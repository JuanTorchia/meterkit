# MeterKit Hono quickstart

This example uses the official `@x402/hono` adapter with MeterKit's Solana
resource server, independent settlement validation and replay store.

```bash
MERCHANT_WALLET=<disposable-devnet-address> pnpm --filter @usemeterkit/example-hono-quickstart build
MERCHANT_WALLET=<disposable-devnet-address> node examples/hono-quickstart/dist/server.js
curl -i http://localhost:3000/premium
```

The unpaid request returns HTTP 402 with exact Solana devnet mint, amount and
recipient. Use only test-USDC and a disposable devnet wallet for paid retries.
