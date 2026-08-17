# Reach the first HTTP 402 from public packages

This is the canonical self-service devnet-beta path. It needs Node 22 and npm,
but no repository clone, Docker, PostgreSQL, faucet funds or private key.

> Release gate: 0.3.0 is currently a candidate. Do not run or recommend the
> command below until the exact npm registry matrix has passed and this notice
> is removed. The source-tree and packed checks are not publication evidence.

## 1. Create and start

```bash
npm create meterkit@0.3.0 -- meterkit-app --surface express --package-manager npm --recipient <DEVNET_PUBLIC_WALLET> --yes
cd meterkit-app
npm run dev
```

Use a disposable Solana devnet public address for the recipient. The command
installs dependencies and writes only public devnet configuration.

## 2. Inspect the unpaid challenge

In a second terminal:

```bash
cd meterkit-app
npm run check:unpaid
```

Expected: HTTP 402 plus x402 version 2, Solana devnet, the Circle test-USDC
mint, 10,000 atomic units, the exact recipient and `/premium` resource. The
check fails if the policy is absent or malformed.

## 3. Understand the safety boundary

The generated first-402 project uses `MemoryPaymentStore`. It is intentionally
zero-infrastructure and not restart-safe; startup states that limitation. Do
not process paid requests with it. The durable PostgreSQL mode and the bounded
`meterkit pay`/`verify` lifecycle are documented only after their release gate
passes.

Stop the development server with Ctrl+C. To reset this disposable demo, remove
the generated `meterkit-app` directory. Never point the beta at mainnet or put a
private key in a command, environment variable, repository or dashboard.

For repository development, contribution and hosted gateway setup—not the
public initializer—use the root README and `CONTRIBUTING.md`.
