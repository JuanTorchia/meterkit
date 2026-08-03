# Agentic Engineering Grant — submission draft

Official listing: <https://superteam.fun/earn/grants/agentic-engineering>

This document separates completed proof from grant-funded work. Do not claim users,
revenue, a public deployment, or an approved grant until those facts are true.

## Suggested project title

MeterKit — non-custodial USDC payments for APIs and AI agents on Solana

## What do you want to build?

I want to ship MeterKit, an open-source TypeScript toolkit that lets developers
monetize APIs and MCP tools with USDC on Solana. A provider connects a wallet,
sets a per-call price, and adds middleware to an existing Node.js API. An unpaid
request receives an x402 payment challenge; the client signs locally, USDC settles
directly to the provider, and the API returns a verifiable receipt. MeterKit never
custodies funds or private keys.

The grant milestone is a public devnet release: a documented npm-ready middleware
package, a hosted protected API and dashboard, a working example client, and the
useful “Solana Project Scout” MCP demo. I will also harden replay protection,
idempotency and payment validation, and document bounded spending allowances for
AI agents.

## Why is it useful?

Monetizing a small API usually requires accounts, cards, API keys, invoicing and a
payment processor that may not serve every country. MeterKit gives independent
developers—especially in Latin America—a non-custodial path to accept global
machine-to-machine payments. It also gives AI agents a standard HTTP payment flow
with explicit price, recipient, network, expiration and verifiable settlement.

## Why Solana?

Low transaction costs and fast confirmation make USDC micropayments practical.
The payment itself is a Solana token transfer directly from the customer to the
provider. Solana Explorer provides public verification, while Wallet Standard
keeps signing in the user’s wallet. The project also explores Solana’s native
subscription and allowance primitives for bounded agent authorization.

## What already works?

A local MVP already proves feasibility. It completed a 0.01 USDC x402 payment on
Solana devnet directly to the provider:

<https://explorer.solana.com/tx/61NPoRT92dwGZby6q4qAoFP9CG9UAUKBM3PZtW1BbwHTWvB3udMKgmcEfUPMCqvjjUjKEpakgmFomVwWVpjHsqsf?cluster=devnet>

The monorepo currently includes the middleware, protected weather endpoint,
dashboard, example client, MCP server, PostgreSQL receipt index, replay protection
and critical payment tests. This is proof that I can execute; the requested work
is the polished, public and reproducible release described below.

## Deliverables for the second tranche

1. Public source repository with an Apache-2.0 license and reproducible README.
2. Public devnet demo URL for the dashboard and protected endpoint.
3. npm-ready SDK/middleware package with a minimal integration example.
4. Solana Project Scout MCP server with a free preview and paid full report.
5. Tests covering duplicate proof, wrong amount, mint, recipient and expiration.
6. Short demo video and public post showing the complete payment flow.
7. Explorer transaction and anonymized evidence that the dashboard indexed it.
8. Eligible AI coding subscription receipts totaling USD 200.

## Four-week execution plan

- Week 1: publish the repository, automate CI and deploy the devnet-only demo.
- Week 2: polish SDK ergonomics, example client and developer documentation.
- Week 3: finish the paid MCP flow and bounded allowance/revocation demonstration.
- Week 4: external tester feedback, security review, fixes and demo video.

## How will AI coding tools help?

I will use the funded coding subscription for implementation, test generation,
dependency and security review, documentation, browser QA and release automation.
Every AI-generated change will be reviewed and verified with lint, strict
TypeScript, unit/integration tests and Playwright. I will retain eligible receipts
totaling USD 200 for the second-tranche form.

## Applicant details to complete manually

- Full legal name: `[required]`
- Superteam profile: `[required]`
- Email: `[required]`
- Country: Argentina, if accurate
- Public Solana wallet: `[required — public address only]`
- GitHub repository URL: <https://github.com/JuanTorchia/meterkit>
- Live devnet URL: `[add after deployment; do not call it production]`
- AI coding tool and plan: `[confirm it is eligible before purchase]`

## Submission checklist

- [ ] Sign in to Superteam Earn.
- [ ] Confirm the listing still shows **Apply Now**.
- [ ] Paste the answers above, adapting only to the actual form fields.
- [ ] Add the devnet Explorer transaction as proof of execution.
- [ ] Complete KYC using only the official Superteam Earn flow.
- [ ] Save the application confirmation and submission date.
- [ ] Do not buy a subscription solely on the assumption of approval.
- [ ] After approval, confirm eligible receipt rules before spending the grant.
- [ ] Keep invoices/receipts totaling exactly USD 200 for tranche two.
- [ ] Submit repository, live URL and receipts through the tranche form.

## Short version

MeterKit is open-source, non-custodial infrastructure for charging USDC per API or
MCP tool call on Solana. A working local MVP has already settled a real 0.01 USDC
x402 payment on devnet directly to the provider. With the Agentic Engineering
Grant I will ship a public devnet release: npm-ready middleware, protected API,
dashboard, example client, paid Solana Project Scout MCP tool, critical security
tests and reproducible documentation. AI coding tools will accelerate
implementation, security review, tests and browser QA; all output will be reviewed
and verified before release.
