# MeterKit Express quickstart

This is the canonical provider integration. It imports the same `protect()` API
published to npm:

```bash
pnpm add @usemeterkit/sdk express
```

Run it with a disposable devnet recipient:

```bash
MERCHANT_WALLET=<devnet-public-address> pnpm start
curl -i http://localhost:3000/premium
```

The unpaid response is HTTP 402 containing the exact Solana devnet network,
test-USDC mint, 0.01 USDC amount and recipient. Continue with
[`docs/sdk-quickstart.md`](../../docs/sdk-quickstart.md) for the paid retry,
sanitized receipt, Explorer evidence, and replay rejection.

The in-memory store and `rpcUrl: false` are challenge-only local defaults. Any
paid, hosted, or replicated deployment must use durable replay storage and RPC
settlement validation.

`WEBACY_API_KEY` optionally enables the removable payer-risk adapter in
observe/fail-open mode. It is disabled by default and never enters settlement.
