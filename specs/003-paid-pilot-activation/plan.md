# Implementation Plan: Paid Pilot Activation

**Branch**: `003-paid-pilot-activation` | **Date**: 2026-08-14 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/003-paid-pilot-activation/spec.md`

## Summary

Convert MeterKit's verified devnet foundation into an assisted, measurable and
sellable provider pilot. Delivery begins by extending the existing local pilot
evidence into truthful v2 engagement events and by documenting one offer. It
then promotes the rich receipt model into a provider-owned settlement projection
linked through immutable product identity, adds bounded JSON/CSV reconciliation,
and only after external activation adds signed event notifications through a
transactional outbox. Existing Solana allowances are packaged as the bounded
agent-budget demonstration rather than replaced. Grant tranches remain a
separate applicant-controlled funding record and never enter adoption or revenue
metrics.

## Technical Context

**Language/Version**: TypeScript 5.9 strict; Node.js 22 minimum; ECMAScript modules

**Primary Dependencies**: Existing pnpm 11 monorepo, Express 5 gateway, Next.js
16 App Router, Zod 4 boundary schemas, Node crypto/HTTPS/DNS primitives, official
x402 2.21 and Solana Subscriptions & Allowances packages already selected by the
project; no queue or CSV runtime dependency added for the pilot

**Storage**: PostgreSQL remains authoritative for provider products, settlement
projections, pilot metadata and the notification outbox; Solana devnet remains
authoritative for settlement finality and agent authorizations; applicant grant
receipts and KYC remain private and outside hosted product storage

**Testing**: Vitest unit/contract/integration tests, PostgreSQL isolation and
concurrency tests, Playwright provider journeys, packed pilot CLI fixtures,
SSRF/DNS-rebinding and webhook signature fixtures, devnet settlement evidence,
existing lint/typecheck/build/security/release gates

**Target Platform**: Node.js gateway on Linux, modern browsers for the hosted
provider workspace, public pilot CLI/package consumers, Solana devnet only

**Project Type**: Public packages plus hosted web application and gateway service
in the existing monorepo

**Performance Goals**: Provider settlement pages return bounded results without
unbounded memory; synchronous exports cover up to 90 days and 10,000 records;
healthy notification destinations receive 95% of actionable events within five
minutes; payment settlement never waits for notification network I/O

**Constraints**: Direct non-custodial settlement; no mainnet or real customer
funds; no stored or logged wallet secrets, payment proofs or clear webhook
secrets; tenant isolation by authenticated owner and immutable product UID;
pending/unknown states preserved; stable at-least-once event identity; English
and Spanish claim parity; explicit participant and economic classification

**Scale/Scope**: Three external pilot starts, two completed integrations, one
provider settlement workspace, JSON/CSV export up to 10,000 records, optional
notification subscriptions at pilot volume, and one existing allowance journey;
no multichain, new framework, marketplace or asynchronous export infrastructure

## Constitution Check

_GATE: Passed before research and re-checked after Phase 1 design._

| Principle / gate                          | Design response                                                                                                                                                                               | Status |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| Non-Custodial by Construction             | Payments remain payer-to-provider; pilot, export and notification records never grant spending authority; secrets are not exposed                                                             | Pass   |
| Protocol-Native Interoperability          | Existing official x402 and Solana authorization contracts remain unchanged; new work is policy, evidence and operations around them                                                           | Pass   |
| Security and Evidence First               | Rich receipts preserve unknown states; outbox transitions are atomic; exports and notifications exclude full proofs; SSRF, replay, concurrency and state regression receive adversarial tests | Pass   |
| AAA Developer Experience                  | One assisted offer leads from readiness to settlement, protected response, replay rejection, export and optional automation                                                                   | Pass   |
| Activation Before Expansion               | P1 external activation and P2 reconciliation precede notifications; existing allowances are repackaged; new chains/frameworks are excluded                                                    | Pass   |
| Observable and Reproducible Operations    | Pilot stages, interventions, export snapshot, event identity and delivery attempts are sanitized and traceable; workers have bounded retry and recovery                                       | Pass   |
| Open Source Integrity and Truthful Claims | Participant class, scoped consent, retention, willingness to pay, commercial cash and grant tranches are separate evidence domains                                                            | Pass   |
| Mandatory review gates                    | Contract, database, browser, devnet, supply-chain, docs parity and rollback evidence are included in the quickstart and future tasks                                                          | Pass   |

### Post-design re-check

The data model and contracts preserve all constitutional guarantees. The
settlement projection fixes an existing tenant-linkage gap by using immutable
product UID. PostgreSQL outbox delivery adds no custody or payment-path
dependency. Notification work remains gated by a completed pilot or explicit
blocking demand. No constitutional exception is required.

## Project Structure

### Documentation (this feature)

```text
specs/003-paid-pilot-activation/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── pilot-evidence.md
│   ├── settlement-api.md
│   └── webhook-delivery.md
├── checklists/
│   └── requirements.md
└── tasks.md                 # created by speckit-tasks, not this phase
```

### Source Code (repository root)

```text
packages/
├── core/                    # settlement/export/event schemas and projections
├── database/                # migration 007+, tenant queries, pilot and outbox stores
├── pilot/                   # v2 engagement/evidence contracts and CLI workflow
└── subscriptions/           # existing bounded authorization builders
apps/
├── gateway/src/
│   ├── server.ts            # owner-authenticated settlement/pilot/webhook routes
│   ├── webhook-delivery.ts  # worker, HMAC and retry classification
│   └── webhook-transport.ts # DNS-pinned HTTPS transport
└── web/app/
    ├── pilots/              # disclosed assisted offer and pilot journey
    ├── dashboard-client.tsx # settlement filters/export/notification controls
    └── agent/allowances/    # existing agent-budget demonstration
content/docs/
├── en/                      # pilot, exports, webhook verification
└── es/                      # claim-equivalent maintained documentation
tests/e2e/                   # external activation, export and notification journeys
scripts/                     # reproducible pilot and delivery evidence validation
```

**Structure Decision**: Extend current packages and deployments. Do not create a
new service or queue. The database transaction owns settlement transition plus
outbox creation; a worker in the gateway performs bounded delivery. The pilot
CLI remains capable of producing minimized local evidence so a participant need
not surrender raw evidence to the hosted service.

## Delivery Increments

1. **Truthful offer and evidence v2**: disclose the assisted pilot, extend local
   engagement evidence, define consent scopes and separate grant/commercial
   classifications. Complete the applicant-controlled second-tranche handoff in
   parallel without making it a product dependency.
2. **Provider settlement projection**: link rich receipt state to immutable
   product UID, integrate it with runtime settlement/finality transitions, add
   monotonic state guards and tenant-scoped bounded queries.
3. **Reconciliation workspace**: ship filters, cursor pagination, exact totals,
   canonical JSON export and safe CSV projection from one frozen snapshot.
4. **First external activation gate**: recruit three independent starts, capture
   intervention/friction evidence and complete two integrations. Do not begin P3
   merely because synthetic tests pass.
5. **Notification automation**: only after one completed external pilot or an
   explicit blocking request, add verified HTTPS subscriptions, encrypted secret
   rotation, transactional events and bounded at-least-once delivery.
6. **Agent-budget positioning**: validate the existing create/inspect/spend/deny/
   revoke journey with an independent operator and connect its evidence to the
   product narrative without changing the onchain protocol.
7. **Commercial review**: observe day-seven retention and ask the disclosed-price
   willingness-to-pay question. Count a paid integration and revenue only after
   verified net cash receipt.

## Complexity Tracking

No constitutional violation requires justification. The only new operational
subsystem is a PostgreSQL outbox inside the existing gateway, introduced after
external demand and without a new infrastructure dependency.
