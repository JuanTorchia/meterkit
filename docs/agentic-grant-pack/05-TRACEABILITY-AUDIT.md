# Requirement traceability and claim audit

Audited on **2026-08-03** against repository source and recorded devnet evidence.

| Requirement | Implementation | Verification | Status |
|---|---|---|---|
| FR-01 x402 challenge | `packages/sdk/src/index.ts` | `packages/sdk/src/index.test.ts` | Verified |
| FR-02 exact settlement | `packages/sdk/src/index.ts` | SDK settlement tests + devnet balance change | Verified |
| FR-03 direct payment | x402 Solana transfer requirements | Explorer transaction `61NPoR…Hsqsf` | Verified on devnet |
| FR-04 replay rejection | SDK receipt store + DB unique network/signature | SDK and PostgreSQL tests; real replay returned 402 | Verified |
| FR-04 idempotency | `packages/database`, gateway idempotency path | PostgreSQL integration test | Verified |
| FR-05 receipts/dashboard | `apps/web`, payment persistence | Playwright + desktop/mobile captures | Verified locally |
| FR-06 package integration | `packages/sdk`, example client | tarball installed/imported outside workspace package graph | Verified |
| FR-07 useful MCP tool | `examples/mcp-scout` | Scout unit test and MCP stdio integration test | Protocol verified; payment devnet pending |
| FR-08 capped allowance | `packages/subscriptions` | policy and transaction serialization tests | Builder verified |
| FR-08 revocation | subscriptions package + Wallet Standard UI path | revocation serialization test | Builder verified; devnet signing pending |
| Finality | `apps/gateway/src/finality.ts` | finality tests + real receipt finalized | Verified |
| Wallet authentication | `apps/gateway/src/wallet-auth.ts` | signature, replay, expiration and mutation tests | Verified |
| Public hosted demo | Not deployed | No public URL | Pending |
| External pilots | Not started | No tester records | Pending |

## Claim-by-claim audit

### Safe to claim

- “A real 0.01 USDC x402 payment completed on Solana devnet.”
- “The provider received the transfer directly.”
- “The same payment proof was rejected when replayed.”
- “The repository contains middleware, gateway, dashboard, client and MCP demo.”
- “Twenty-seven unit/integration tests passed at the evidence capture.”
- “The SDK was packed and imported outside the monorepo package graph.”

### Must be qualified

- Say “npm-ready” or “packaged,” not “published on npm.”
- Say “dashboard verified locally,” not “live dashboard.”
- Say “paid MCP contract implemented,” not “paid MCP devnet flow completed.”
- Say “allowance builders and revocation serialization implemented,” not
  “subscription lifecycle completed on-chain.”

### Do not claim yet

- production readiness;
- mainnet support proven in operation;
- users, revenue or commercial traction;
- approved grant or guaranteed funding;
- public hosted endpoint;
- a formal third-party security audit.

## Auditor conclusion

The proposed grant scope is credible because its hardest feasibility assumption—
direct USDC settlement through an x402-protected request—already has independent
devnet evidence. The remaining work is primarily public deployment, integration
completion, external validation and presentation. The application should be
submitted as a working proof seeking a public-release milestone, not as a finished
production company.
