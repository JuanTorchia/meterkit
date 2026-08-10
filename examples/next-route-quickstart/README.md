# MeterKit Next.js route quickstart

This example uses the official `@x402/next` route wrapper with MeterKit's same
product, persistence, settlement-validation, and receipt hook used by Express.

```bash
export MERCHANT_WALLET=<disposable-devnet-address>
pnpm --filter @usemeterkit/example-next-route dev
curl -i http://localhost:3000/api/premium
```

The first request returns HTTP 402. A compatible x402 client signs/pays test
USDC on Solana devnet and retries; only then does the route return
`{"protected":true}`. Production deployments must enable RPC validation (remove
`rpcUrl: false`) and use a durable `PaymentStore`; the in-memory store is solely
for this disposable quickstart.
