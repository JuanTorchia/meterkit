# Implementation Plan: Self-Service Activation

**Branch**: `004-self-service-activation` | **Date**: 2026-08-17 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-self-service-activation/spec.md`

## Summary

Make MeterKit independently usable before treating paid setup as the primary
experiment. Repair `create-meterkit` into a truthful guided/non-interactive
initializer, publish a separate `meterkit` operational CLI for check, doctor,
verify and disposable devnet pay/replay, and ship a standalone PostgreSQL replay
adapter behind the existing `PaymentStore` boundary. Validate literal registry
artifacts in clean environments and measure external beta activation separately
from synthetic release checks. The public CTA becomes a five-person free devnet
beta; the USD 100 done-for-you setup remains a separate optional service.

## Technical Context

**Language/Version**: TypeScript 5.9, Node.js 22 LTS, strict ESM

**Primary Dependencies**: Zod, x402, Solana Kit, Express, Next.js, Hono, MCP SDK, `pg`; Node readline/process APIs for CLI orchestration

**Storage**: In-memory store for explicitly labeled first-402 demos; standalone PostgreSQL replay store for paid/deployed flows; permission-restricted local session file only when replay cannot remain in one process

**Testing**: Vitest and Node test scripts, clean generated-project integration tests, Docker PostgreSQL restart/concurrency tests, Playwright for public CTA, GitHub Actions release matrix

**Target Platform**: Node 22 on Linux, macOS and Windows; Solana devnet only

**Project Type**: TypeScript monorepo containing public libraries, initializer/CLI, generated web-service templates and Next.js documentation/marketing UI

**Performance Goals**: Valid first 402 in under 10 minutes for at least 3/5 external evaluators; full settlement/protected-response/replay path in under 30 minutes for at least 2/5; median at most one maintainer intervention

**Constraints**: No monorepo clone for users; no secret material in argv, telemetry or logs; no PostgreSQL/Docker prerequisite for first 402; no silent durability fallback; exact public artifacts must be tested; npm and pnpm are supported

**Scale/Scope**: Three supported HTTP surfaces (Express canonical, Next and Hono), one experimental MCP stdio surface, two supported package managers, five-person external beta, one canonical provider journey, one narrow standalone replay schema

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design._

- **I. Non-Custodial by Construction — PASS**: signing material stays local, direct client-to-provider settlement is preserved, and CLI/evidence output excludes credentials and full proofs.
- **II. Protocol-Native Interoperability — PASS**: the design reuses official x402/Solana contracts and existing SDK boundaries; the PostgreSQL store is an optional replaceable adapter.
- **III. Security and Evidence First — PASS**: exact policy is checked before signing; concurrency, recovery, duplicate use and unknown infrastructure states have adversarial tests.
- **IV. AAA Developer Experience — PASS**: there is one recommended provider journey covering installation, challenge, settlement, protected response, receipt and replay. US1 is an internal implementation checkpoint only; public release requires US1 and US2.
- **V. Activation Before Expansion — PASS**: the independently measured activation path precedes domain, branding, new chains, dashboards or speculative x402 functions.
- **VI. Observable and Reproducible Operations — PASS**: structured sanitized CLI/evidence records, exact registry artifacts, migrations, health/failure checks and release rollback evidence are required.
- **VII. Open Source Integrity and Truthful Claims — PASS**: semantic-version, changelog, EN/ES parity and synthetic/external/commercial classifications gate public claims.

**Post-design re-check**: PASS. The design introduces no exception. The
operational CLI stays separate from the scaffolder, the standalone adapter
reuses `PaymentStore` without importing the hosted gateway schema, dependencies
require maintenance/license review, and no public release stops at HTTP 402.

## Project Structure

### Documentation (this feature)

```text
specs/004-self-service-activation/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
└── tasks.md
```

### Source Code (repository root)

```text
packages/create-meterkit/
├── src/
├── templates/{express,next,hono,mcp}/
└── README.md

packages/cli/
├── src/{check,doctor,verify,pay}/
└── tests/

packages/database/
├── src/
├── migrations/standalone/
└── tests/

packages/{core,sdk,pilot}/
apps/web/
docs/
scripts/
.github/workflows/
```

**Structure Decision**: Preserve the existing pnpm monorepo. Keep
`create-meterkit` focused on atomic scaffolding, add `@usemeterkit/cli` for
runtime operations, and add the narrow durable adapter to the already public
`@usemeterkit/database` package. Reuse core contracts, SDK middleware and pilot
evidence primitives; update web/docs/release scripts only at their current
boundaries.

## Complexity Tracking

No constitution violations require justification.
