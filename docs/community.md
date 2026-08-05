# Community and open-source plan

MeterKit grows by making useful technical work public. Followers, grants and
commercial opportunities are outcomes of trusted contributions, not substitutes
for adoption.

## Positioning

MeterKit is the open-source TypeScript toolkit for adding non-custodial x402 USDC
payments and bounded agent spending to APIs and MCP tools on Solana.

The project differentiates through hardened integration and evidence:

- direct client-to-provider settlement;
- durable replay and idempotency controls;
- verifiable PostgreSQL receipts and Solana Explorer links;
- native wallet-controlled allowances and subscriptions;
- useful paid MCP examples;
- reproducible adversarial tests and security documentation.

MeterKit does not claim to invent x402 or Solana payment primitives.

## Contribution strategy

### MeterKit repository

- maintain bounded `good first issue` tasks;
- respond to complete issues within three business days when possible;
- explain rejected proposals rather than silently closing them;
- credit accepted code, documentation, design and testing in release notes;
- publish sanitized architectural decisions and residual risks;
- use Discussions for questions and proposals that are not implementation-ready.

### Upstream ecosystem

Prioritize contributions that are independently useful:

- Solana support and tests in x402 or MCP integrations;
- SVM examples and failure cases;
- developer documentation corrections;
- reproducible finality, replay and resource-scope bug reports;
- templates that reduce time to a safe first devnet payment.

Do not promote MeterKit inside unrelated issues. A contribution should remain
valuable even if the recipient never adopts MeterKit.

## Public build cadence

Each meaningful release should produce:

1. a reviewed code or documentation change;
2. a reproducible command or devnet transaction;
3. a short English technical explanation;
4. an optional Spanish summary for Latin American builders;
5. one clear invitation to test, discuss or contribute.

Avoid vanity announcements without new evidence.

## Pilot funnel

Internal dogfooding and synthetic browser agents are reported separately.
External validation requires a developer independent from the maintainer who:

1. opens a pilot-start issue;
2. integrates the public package or a declared commit into a service they
   control;
3. completes a finalized devnet x402 payment to their own provider wallet;
4. confirms protected response and replay rejection;
5. submits the structured pilot report.

The primary activation metric is completed external integrations, not wallet
connections or landing-page visits.

## Ninety-day targets

| Outcome                          | Target |
| -------------------------------- | -----: |
| Independent integrations         |     10 |
| Active providers                 |      5 |
| Accepted upstream contributions  |      3 |
| External MeterKit contributors   |      3 |
| Published technical case studies |      2 |
| Paid integrations                |      2 |
| Technical workshop or live demo  |      1 |

Targets are aspirations, not existing traction.

## Commercial boundary

The Apache-2.0 packages remain usable without the hosted service. Initial revenue
should come from integration, deployment and support. Hosted analytics and
reconciliation may become recurring products after demand is demonstrated.

No commercial arrangement permits hidden fees, custody, false public claims or
weaker security treatment.

## Monthly review

Review:

- independent starts, completions and seven-day retention;
- time to first HTTP 402 and first settlement;
- support interventions required;
- repeated integration failures;
- upstream contributions opened and accepted;
- contributors and maintainers;
- qualified commercial conversations and paid work.

If ten pilots and twenty interviews produce no repeated use or willingness to
pay, stop adding general SaaS features and evaluate a narrower SDK or integration
services strategy.
