# Protect an Express route in under ten minutes

This path is for API providers evaluating the public MeterKit package. It does
not require cloning the MeterKit monorepo, PostgreSQL or Docker.

## 1. Install

```bash
mkdir meterkit-provider && cd meterkit-provider
pnpm init
pnpm add @meterkit/sdk express
pnpm add -D tsx typescript @types/express
```

## 2. Add one protected route

Copy [`examples/express-quickstart/src/server.ts`](../examples/express-quickstart/src/server.ts)
into `server.ts`. Set `MERCHANT_WALLET` to a disposable Solana devnet public
address and run:

```bash
MERCHANT_WALLET=<devnet-public-address> pnpm tsx server.ts
curl -i http://localhost:3000/premium
```

The request must return HTTP 402 with x402 v2 terms for Solana devnet, the Circle
test-USDC mint, 10,000 atomic units and your exact recipient.

## 3. Before accepting paid requests

The quickstart uses an in-memory receipt store and disables the independent RPC
revalidation only so the unpaid challenge can be inspected without
infrastructure. Before processing a devnet payment:

- use durable storage implementing `PaymentStore`;
- configure a Solana devnet RPC and optional independent fallback;
- keep exact network, mint, amount and recipient policies;
- create the recipient test-USDC ATA;
- verify replay rejection and finality.

Use the [external pilot guide](pilot-quickstart.md) for a correlated settlement,
protected response and rejected replay. Use the repository README only when
self-hosting the complete dashboard and gateway.
