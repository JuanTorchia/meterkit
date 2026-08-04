# MeterKit proof of work

Evidence captured on **2026-08-03**.

## On-chain payment

| Field | Verified value |
|---|---|
| Cluster | Solana devnet |
| Asset | devnet USDC |
| Amount | 0.01 USDC / 10,000 atomic units |
| Payer | `8SJE3aVLPpPgh5qsYJppsgdXdWusYUmJy3gfGKDEPsqS` |
| Provider | `9a4xvgAdtPxJf7eifkCTpUwwqd8Q8u8L6QJzwCCeaiR5` |
| Provider balance | `0 → 10000` atomic units |
| Transaction | `61NPoRT92dwGZby6q4qAoFP9CG9UAUKBM3PZtW1BbwHTWvB3udMKgmcEfUPMCqvjjUjKEpakgmFomVwWVpjHsqsf` |
| Finality | Finalized |

Explorer:
<https://explorer.solana.com/tx/61NPoRT92dwGZby6q4qAoFP9CG9UAUKBM3PZtW1BbwHTWvB3udMKgmcEfUPMCqvjjUjKEpakgmFomVwWVpjHsqsf?cluster=devnet>

The transfer settled directly from the client to the provider. MeterKit did not
custody the USDC. Replaying the same payload returned HTTP 402 and the database
uniqueness constraint prevents the signature from being consumed twice.

## Implemented artifacts

- `packages/sdk`: x402 v2 middleware, exact settlement validation and replay
  protection.
- `packages/database`: products, payments, idempotency and atomic signature
  consumption in PostgreSQL.
- `packages/subscriptions`: canonical allowance, recurring delegation,
  subscription and revocation transaction builders.
- `apps/gateway`: protected API, wallet challenge authentication, finality
  reconciliation and rate limiting.
- `apps/web`: provider landing/dashboard and Explorer links.
- `examples/client`: bounded-spend x402 client and devnet verification utility.
- `examples/mcp-scout`: source-linked public repository report, free preview and
  paid MCP tool contract.

## Verification already executed

```text
pnpm lint
pnpm typecheck
DATABASE_TEST_URL=postgresql://meterkit:meterkit@localhost:5432/meterkit pnpm test
pnpm build
pnpm test:e2e
```

At evidence capture, the suite contained **27 passing unit/integration tests**
plus the Playwright dashboard flow. Desktop and mobile captures are included in
the repository under `artifacts/`.

## Security cases covered

- unpaid request produces an x402 v2 challenge;
- duplicate receipt and concurrent replay rejection;
- wrong network rejection;
- invalid or expired settlement rejection;
- exact payer, provider, mint and balance-delta validation;
- one-use Ed25519 wallet challenges;
- modified and expired authentication challenge rejection;
- idempotent request persistence;
- finality promotion only for successful finalized signatures;
- positive allowance cap and future expiration;
- explicit revocation instruction generation;
- no private key required by Wallet Standard transaction builders.

## Honest limitations

- The dashboard and gateway are verified locally but not yet hosted publicly.
- The MCP protocol contract and paid devnet call completed on 2026-08-04
  ([Explorer receipt](https://explorer.solana.com/tx/4ZkuVWNuEZLJkYxvU485YUWqNq6pgyQG54mVcCYpSgyXAHEWtCqKMsfLVKiNbuQuAPnymYzwS732cvPXzU7pM5wg?cluster=devnet))
  a separate real devnet settlement.
- A 1 USDC allowance with seven-day expiry was created, read back, revoked and
  closed on devnet. All four transactions finalized and rent was recovered.
  Evidence: `docs/evidence/allowance-devnet-2026-08-04.json`.
- There are no claimed production users or revenue.
