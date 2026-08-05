# Requirement traceability and claim audit

Audited on **2026-08-05** against repository source, the public deployment and
recorded devnet evidence.

| Requirement | Implementation | Verification | Status |
|---|---|---|---|
| FR-01 x402 challenge | `packages/sdk/src/index.ts` | `packages/sdk/src/index.test.ts` | Verified |
| FR-02 exact settlement | `packages/sdk/src/index.ts` | SDK settlement tests + devnet balance change | Verified |
| FR-03 direct payment | x402 Solana transfer requirements | Explorer transaction `61NPoR…Hsqsf` | Verified on devnet |
| FR-04 replay rejection | SDK receipt store + DB unique network/signature | SDK and PostgreSQL tests; real replay returned 402 | Verified |
| FR-04 idempotency | `packages/database`, gateway idempotency path | PostgreSQL integration test | Verified |
| FR-05 receipts/dashboard | `apps/web`, payment persistence | Playwright + public dashboard | Verified publicly |
| FR-06 package integration | `packages/sdk`, example client | tarball installed/imported outside workspace package graph | Verified |
| FR-07 useful MCP tool | `examples/mcp-scout` | Scout tests + devnet receipt `4ZkuVW…pM5wg` | Paid flow verified |
| FR-08 capped allowance | subscriptions package + devnet verifier | policy tests + `53Y9wj…9h4mi` | Onchain verified |
| FR-08 revocation | subscriptions package + Wallet Standard UI path | closed PDA + `2Ccw1b…XqzoU` | Onchain verified |
| Native subscription | plan, subscribe, pull and cancel builders | four finalized devnet transactions | Onchain verified |
| Finality | `apps/gateway/src/finality.ts` | finality tests + real receipt finalized | Verified |
| Wallet authentication | `apps/gateway/src/wallet-auth.ts` | signature, replay, expiration and mutation tests | Verified |
| Public hosted demo | Coolify deployment, devnet only | `meterkit.juanchi.dev`, `meterkit-api.juanchi.dev` | Verified |
| External pilots | Not started | No tester records | Pending |

## Claim-by-claim audit

### Safe to claim

- “A real 0.01 USDC x402 payment completed on Solana devnet.”
- “The provider received the transfer directly.”
- “The same payment proof was rejected when replayed.”
- “The repository contains middleware, gateway, dashboard, client and MCP demo.”
- “The repository test suite and PostgreSQL CI pass”; cite the current CI run rather
  than freezing a test count that changes as coverage grows.
- “The SDK was packed and imported outside the monorepo package graph.”

### Must be qualified

- Say “npm-ready” or “packaged,” not “published on npm.”
- Say “public devnet dashboard,” not “production dashboard.”
- Paid MCP devnet flow completed on 2026-08-04; cite the Explorer receipt.
- Say “allowance and fixed 30-day subscription lifecycles completed onchain.”
  The protocol period is 720 hours, not a calendar month.

### Do not claim yet

- production readiness;
- mainnet support proven in operation;
- users, revenue or commercial traction;
- approved grant or guaranteed funding;
- a formal third-party security audit.

## Auditor conclusion

The proposed grant scope is credible because its hardest feasibility assumption—
direct USDC settlement through an x402-protected request—already has independent
devnet evidence. The remaining grant evidence is primarily external validation
and the applicant-controlled AI subscription receipt. The application should be
submitted as a working proof seeking a public-release milestone, not as a finished
production company.
