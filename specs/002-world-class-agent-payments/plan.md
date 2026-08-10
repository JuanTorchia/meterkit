# Implementation Plan: World-Class Agent Payments

**Branch**: `002-world-class-agent-payments` | **Date**: 2026-08-10 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/002-world-class-agent-payments/spec.md`

## Summary

Turn the existing devnet-verified MeterKit foundation into independently
adoptable developer infrastructure. The delivery order is: secure and complete
public distribution; a five-minute initializer and searchable bilingual docs;
full-lifecycle parity for Express, Next.js route handlers, MCP and Hono; a
coherent bounded-agent-budget experience on Solana's official primitives;
reproducible performance/trust evidence; then genuine pilots and one bounded
upstream proposal. The phase extends official x402 and Solana protocols instead
of replacing them and keeps mainnet, custody and fabricated traction out of
scope.

## Technical Context

**Language/Version**: TypeScript 5.9 strict; Node.js 22 minimum, Node.js 24 in
release validation; ECMAScript modules

**Primary Dependencies**: pnpm 11 monorepo; official x402 2.21 compatibility
target; Solana Kit 5.5 for x402 surfaces and Solana Kit 6.x where required by
`@solana/subscriptions` 0.4; Express 5, Next.js 16 App Router, MCP SDK, official
Hono x402 adapter; Fumadocs 16 with local search; Zod at public boundaries

**Storage**: PostgreSQL for durable hosted receipts, challenges, idempotency,
activation records and benchmark metadata; onchain Solana state remains
authoritative for allowances/subscriptions; versioned Markdown/JSON for docs,
release manifests and public evidence

**Testing**: Vitest unit/contract/integration tests, PostgreSQL concurrency tests,
Playwright browser and accessibility journeys, clean packed-package smoke tests,
CLI fixture tests, devnet settlement evidence, load/resilience harness, CI
dependency/security/provenance checks

**Target Platform**: Public npm registry; Node.js Linux/macOS/Windows including
WSL consumers; modern browsers for documentation/dashboard; Solana devnet only
for signed validation

**Project Type**: Public libraries plus project initializer CLI, web
documentation/dashboard, gateway service and runnable examples in one monorepo

**Performance Goals**: Publish an explicit supported envelope beginning with 100
concurrent unpaid/policy requests and 25 concurrent paid-retry verifications;
measure p50/p95/p99 separately for MeterKit-local work and external RPC/
facilitator time; zero duplicate protected executions under the declared load

**Constraints**: Direct non-custodial settlement; no signing secrets; exact
resource scope; bounded authorization; deterministic devnet/mainnet separation;
public package tarballs contain only intended runtime/docs files; release only
from an approved CI-green commit; English/Spanish claim parity; no mainnet or
real-fund execution

**Scale/Scope**: Four maintained integration surfaces, one initializer with
surface templates, one bilingual searchable documentation path, six publishable
packages assessed individually, three independent pilots, one upstream proposal,
and benchmark evidence at three workload levels

## Constitution Check

_GATE: Passed before research and re-checked after design._

| Principle / gate                          | Design response                                                                                                                                              | Status |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ |
| Non-Custodial by Construction             | Initializer and all examples configure direct provider settlement; authorization remains owner-revocable; no keys are generated or collected                 | Pass   |
| Protocol-Native Interoperability          | Uses official x402 packages and official Solana Subscriptions & Allowances; Hono is an official x402 surface; version changes require compatibility evidence | Pass   |
| Security and Evidence First               | Release, initializer, authorization and load contracts include adversarial and concurrency evidence; unknown finality stays recoverable                      | Pass   |
| AAA Developer Experience                  | One primary initializer, searchable bilingual docs, actionable diagnostics and a full payment lifecycle target                                               | Pass   |
| Activation Before Expansion               | Release/activation precedes new surfaces; Hono is the only new framework and must pass parity; multichain/marketplace work is excluded                       | Pass   |
| Observable and Reproducible Operations    | Exact-commit manifests, provenance, SBOM, load metadata, health and rollback are first-class artifacts                                                       | Pass   |
| Open Source Integrity and Truthful Claims | Pilot/upstream states are evidence-classified; internal dogfood never counts as independent adoption                                                         | Pass   |
| Mandatory review gates                    | Tests, compatibility, UI, supply chain and devnet evidence are mapped into the validation guide and future tasks                                             | Pass   |

### Post-design re-check

The contracts preserve all seven principles. Fumadocs, Hono and the initializer
add bounded surface area with clear removal criteria and do not enter the
payment protocol core. No constitutional exception is required.

## Project Structure

### Documentation (this feature)

```text
specs/002-world-class-agent-payments/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── agent-authorization.md
│   ├── benchmark-evidence.schema.json
│   ├── documentation.md
│   ├── initializer-cli.md
│   └── release-manifest.schema.json
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
apps/
├── gateway/                    # hosted receipt/finality/health service
└── web/                        # landing, docs, dashboard and allowance UX
packages/
├── core/                       # stable schemas and evidence contracts
├── sdk/                        # canonical protect() and payment lifecycle
├── subscriptions/             # official allowance/subscription integration
├── pilot/                     # diagnostics and consented activation evidence
├── policy-webacy/              # optional policy adapter
├── database/                   # durable hosted persistence
└── create-meterkit/            # project initializer and versioned templates
examples/
├── express-quickstart/
├── next-route-quickstart/
├── hono-quickstart/
├── mcp-scout/
├── client/
└── subscriptions-client/
content/docs/
├── en/                         # canonical English product documentation
└── es/                         # claim-equivalent Spanish documentation
scripts/
├── verify-release-version.mjs
├── verify-clean-quickstarts.mjs
├── verify-compatibility.mjs
├── verify-docs-parity.mjs
├── benchmark.mjs
└── verify-world-class-evidence.mjs
tests/e2e/                      # docs, initializer result and product journeys
.github/workflows/
├── ci.yml
└── release.yml                # OIDC staged/trusted publishing
```

**Structure Decision**: Extend the current monorepo rather than introduce a
second product repository. Add one leaf initializer package and one Hono example;
integrate documentation into the existing web deployment so brand, product and
docs share accessibility, security headers and release cadence. Keep public
protocol code in existing core/SDK/subscriptions packages.

## Delivery Increments

1. **Release trust**: reconcile the already-published `0.1.0` core/SDK packages,
   verify tarballs, add staged OIDC publishing and owner setup instructions, and
   decide which remaining packages are truly public.
2. **Five-minute activation**: ship the initializer, safe diagnostics, public
   artifact templates and clean-environment acceptance evidence.
3. **Documentation product**: searchable English/Spanish docs, reference,
   troubleshooting, version/maturity matrix and navigation tests.
4. **Surface parity**: upgrade x402 behind compatibility tests and add Hono only
   when Express/Next/MCP/Hono share identical acceptance/security behavior.
5. **Agent budget wedge**: unify create/inspect/spend/revoke receipts around the
   official Solana program and harden concurrency/revocation evidence.
6. **Professional trust**: benchmarks, outage recovery, release manifest,
   provenance, SBOM, support/security expectations and exact-commit evidence.
7. **Independent adoption**: invite pilots only after clean activation passes;
   report real outcomes and propose one bounded upstream contribution.
8. **Brand decision**: evaluate names/domains/packages only after activation
   language stabilizes; migrate only with a documented compatibility plan.

## Complexity Tracking

No constitutional violation requires justification. New dependencies are
isolated to documentation or examples; the new initializer is a leaf package.
