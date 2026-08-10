# Implementation Plan: AAA Developer Adoption

**Branch**: `001-aaa-developer-adoption` | **Date**: 2026-08-10 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/001-aaa-developer-adoption/spec.md`

## Summary

Turn the existing secure devnet implementation into a product an external
developer can activate independently. Add one canonical SDK entry point, a CLI-
driven end-to-end quickstart, stable sanitized receipts, compatibility evidence,
and complete Express/Next.js/MCP examples. Add external risk intelligence behind
an optional generic policy interface and a separately published Webacy adapter.
Measure pilots through explicit local evidence rather than mandatory telemetry.

## Technical Context

**Language/Version**: TypeScript 5.9 strict mode; Node.js 22+

**Primary Dependencies**: Existing `@x402/*` 2.20.0, `@solana/kit` 5.5.1,
Express 5, Zod 4, Next.js 15, MCP SDK 1.17; Webacy uses native `fetch` only

**Storage**: PostgreSQL for production receipts and activation records; an
explicit memory store remains local-test only; JSON evidence files for opt-in
pilot handoff

**Testing**: Vitest unit/contract/integration tests, Playwright browser E2E,
clean-package smoke projects, devnet evidence runner, CodeQL/Trivy/audit gates

**Target Platform**: Linux/WSL/macOS developer environments and Linux containers;
public runtime remains Solana devnet only

**Project Type**: pnpm monorepo containing libraries, CLI, examples, gateway, and
Next.js web application

**Performance Goals**: local challenge in under 5 seconds after server startup;
policy evaluation default timeout at 2 seconds and hard maximum at 10 seconds;
bounded receipt/evidence payloads under 64 KiB; no unbounded retry or response read

**Constraints**: no custody, mainnet, real-fund spend, hidden telemetry, mandatory
Webacy dependency, complete signatures in public output, or breaking 0.1 consumers
without migration; all external calls require timeout and size limits

**Scale/Scope**: three maintained framework examples, one primary API, one generic
policy contract, one Webacy adapter, three external pilot activations; no
marketplace, multi-chain abstraction, or broad hosted billing

## Constitution Check

*GATE: Passed before research and re-checked after design.*

| Principle | Design response | Gate |
|---|---|---|
| Non-Custodial | SDK never signs or stores keys; direct `payTo`; adapter runs before payment | PASS |
| Protocol-Native | Existing official x402 and Solana packages remain authoritative | PASS |
| Security & Evidence | Adversarial contract tests, bounded calls, replay/finality receipts | PASS |
| AAA DX | One `protect()` entry point and clean end-to-end activation CLI | PASS |
| Activation First | P1 is install-to-settlement; Webacy and community work are later slices | PASS |
| Observable Operations | Sanitized event sink, compatibility matrix, provenance and rollback | PASS |
| OSS Integrity | Optional adapter, semantic release contract, truthful pilot taxonomy | PASS |

No constitutional exception is required. The post-design re-check passes because
the generic policy contract has a no-provider default and the Webacy package is a
leaf adapter rather than a core dependency.

## Project Structure

### Documentation (this feature)

```text
specs/001-aaa-developer-adoption/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── sdk-api.md
│   ├── policy-adapter.md
│   ├── pilot-cli.md
│   └── receipt.schema.json
├── checklists/
└── tasks.md
```

### Source Code (repository root)

```text
packages/
├── core/src/                 # receipt/policy domain schemas
├── sdk/src/                  # canonical protect() entry point and event hooks
├── pilot/src/                # init, diagnose, verify, and evidence CLI
└── policy-webacy/src/        # optional Webacy adapter

examples/
├── express-quickstart/       # primary clean-package journey
├── next-route-quickstart/    # Next.js route-handler parity example
└── mcp-scout/                # MCP parity and paid tool journey

apps/
├── gateway/src/              # durable receipt and policy status exposure
└── web/app/                  # receipt/pilot UX and adoption CTA

scripts/
├── verify-clean-quickstarts.mjs
├── verify-compatibility.mjs
└── verify-aaa-evidence.mjs

tests/e2e/                    # browser and public journey evidence
docs/                         # canonical English/Spanish public guidance
```

**Structure Decision**: Extend existing workspace boundaries. Policy schemas live
in core, Express integration remains in sdk, vendor code is isolated in a new
leaf package, and pilot orchestration remains in the existing CLI package.

## Delivery Increments

1. **Activation foundation**: canonical API, runnable Express quickstart,
   diagnose/verify CLI, stable receipt schema, clean-package smoke.
2. **Surface parity**: Next.js and MCP examples, compatibility matrix, migration
   guide, release evidence.
3. **Operational trust**: event sink, explicit unknown/recovery states, bounded
   evidence and runbooks.
4. **Risk-aware policy**: generic adapter contract plus optional Webacy package;
   grant application assets only after local contract tests pass.
5. **Adoption loop**: consented pilot records, public contribution/release path,
   three real integrations (external outcome, never synthetically marked done).

## Complexity Tracking

No constitution violations. The new package is justified because keeping vendor
credentials and semantics out of core is simpler and safer than conditional
vendor code in the SDK.
