# MeterKit Express quickstart

This is the smallest provider integration in the repository. After the public
package release, copy this directory and replace the workspace dependency with:

```bash
pnpm add @usemeterkit/sdk express
```

Run it with a disposable devnet recipient:

```bash
MERCHANT_WALLET=<devnet-public-address> pnpm start
curl -i http://localhost:3000/premium
```

The response is an HTTP 402 containing the exact Solana devnet network, test-USDC
mint, 0.01 USDC amount and recipient. The in-memory receipt store is for this
quickstart only; hosted or replicated deployments need durable replay storage.
