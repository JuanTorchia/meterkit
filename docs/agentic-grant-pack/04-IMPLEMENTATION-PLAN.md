# Grant-funded implementation plan

## Technical shape

MeterKit remains a strict TypeScript pnpm monorepo:

- Next.js provider dashboard;
- Node.js/Express gateway and middleware;
- PostgreSQL metadata, receipts and idempotency;
- official x402-compatible payment flow;
- Solana USDC settlement and Explorer receipts;
- Wallet Standard for user-controlled signing;
- Solana Subscriptions & Allowances transaction builders;
- Vitest and Playwright verification;
- Docker Compose local environment.

No custom token or custody contract is required.

## Four-week milestone

### Week 1 — public reproducibility

- verify clean-clone setup and database migrations;
- publish CI evidence and package dry run;
- deploy a devnet-only gateway and dashboard;
- document faucets, disposable wallets and expected USDC/SOL requirements;
- keep all mainnet actions disabled.

Exit criterion: another developer can reproduce the unpaid 402 flow from the
public README.

### Week 2 — complete public x402 demo

- harden minimal middleware configuration;
- complete example-client onboarding;
- validate failure modes against the deployed devnet endpoint;
- expose Explorer-linked receipts in the dashboard;
- record latency and facilitator/RPC failure behavior.

Exit criterion: one external tester completes a direct devnet payment and cannot
reuse it.

### Week 3 — paid MCP and bounded authorization

- complete a real paid Solana Project Scout call on devnet;
- execute allowance creation with maximum and expiration;
- demonstrate wallet-controlled revocation;
- add resulting transaction evidence and lifecycle tests.

Exit criterion: paid MCP settlement and allowance revocation have independent
devnet evidence.

### Week 4 — evaluation-ready release

- recruit three to five free middleware testers;
- fix onboarding, browser and documentation problems;
- complete security review and threat-model update;
- record the 90-second demo;
- tag the public devnet release and prepare second-tranche evidence.

Exit criterion: clean CI, public demo, public tag, video and eligible AI tooling
receipts totaling USD 200.

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| Devnet faucets or RPC instability | Document retry/fallback process and keep deterministic tests |
| Facilitator dependency | Independently validate on-chain transaction effects |
| Duplicate payment consumption | Database uniqueness plus atomic transaction |
| Wallet incompatibility | Wallet Standard capability detection and explicit errors |
| Scope growth | Public x402 flow remains P0; hosted billing extras remain out of scope |
| False completion claims | Update the evidence matrix only after reproducible verification |

## Definition of done

“Done” means independently reproducible evidence, not merely merged code. Each
required behavior must have at least one of: automated test, Explorer transaction,
browser capture or external tester record.
