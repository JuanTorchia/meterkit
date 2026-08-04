# Agentic Engineering Grant response — MeterKit

## Project

**MeterKit — non-custodial USDC payments for APIs and AI agents on Solana**

## Response to the prompt

I used Codex to help build and verify MeterKit, an open-source TypeScript toolkit
that lets a developer monetize an API or MCP tool with USDC on Solana. A provider
sets a price and recipient wallet, then adds middleware to an existing Node.js
endpoint. An unpaid request receives an x402 HTTP 402 challenge; the client pays
from its own wallet, USDC settles directly to the provider, and the successful
request receives a verifiable receipt. MeterKit never holds user funds, seed
phrases or private keys.

The MVP has already completed a real 0.01 USDC x402 payment on Solana devnet.
The provider balance increased by exactly 10,000 atomic USDC units, the receipt
was indexed in PostgreSQL, finality was reconciled, and reuse of the same payment
proof was rejected:

<https://explorer.solana.com/tx/61NPoRT92dwGZby6q4qAoFP9CG9UAUKBM3PZtW1BbwHTWvB3udMKgmcEfUPMCqvjjUjKEpakgmFomVwWVpjHsqsf?cluster=devnet>

The current monorepo includes strict TypeScript packages for the x402 middleware,
payment validation, PostgreSQL indexing and Solana Subscriptions & Allowances;
an Express gateway; a Next.js dashboard; an example paying client; and a useful
MCP demo called Solana Project Scout. The Scout produces a dated, source-linked
report about a public Solana repository. Its free preview and paid-tool contract
are implemented; real devnet settlement of the MCP call remains grant-funded
work.

The requested grant will fund the AI coding subscription used to turn this
working proof into a public devnet release. The milestone is:

- a reproducible public repository and CI;
- an npm-ready middleware package and minimal integration example;
- a hosted devnet-only protected API and dashboard;
- a paid end-to-end Solana Project Scout MCP call;
- replay, idempotency, recipient, mint, amount and expiration tests;
- an allowance and revocation demonstration for bounded agent spending;
- browser QA, external tester feedback and a 90-second demo.

This is useful because monetizing a small API normally requires accounts, cards,
API keys, invoicing and a payment processor that may not serve every country.
MeterKit gives independent developers, including builders in Latin America, a
non-custodial path to accept global machine-to-machine payments. Solana makes
USDC micropayments practical through low costs, fast confirmation and publicly
verifiable settlement.

AI coding tools are being used for implementation, test generation, dependency
review, security review, documentation and browser QA. Generated changes are
reviewed and must pass strict TypeScript, lint, unit/integration tests and
Playwright before acceptance. Eligible subscription receipts totaling USD 200
will be retained for the second tranche.

## Current proof versus requested milestone

**Already complete:** real devnet x402 payment, direct provider settlement,
replay rejection, PostgreSQL receipt, finality reconciliation, middleware,
dashboard, example client, critical tests and npm package dry run.

**Grant-funded:** public hosted devnet demo, paid MCP settlement on devnet,
on-chain allowance/revocation demonstration, external pilots and demo video.
