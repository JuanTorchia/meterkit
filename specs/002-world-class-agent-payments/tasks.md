# Tasks: World-Class Agent Payments

**Input**: `spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/`, and `quickstart.md`

**Tests**: Required by the constitution and FR-028. Contract/adversarial tasks precede behavior changes.

## Phase 1: Setup

- [x] T001 Record current npm registry metadata and immutable 0.1.0 release facts in `docs/releases/0.1.0.md`
- [x] T002 Add `packages/create-meterkit` workspace metadata, strict TypeScript config and public-package allowlist in `packages/create-meterkit/package.json` and `packages/create-meterkit/tsconfig.json`
- [x] T003 [P] Add the Hono quickstart package skeleton in `examples/hono-quickstart/package.json` and `examples/hono-quickstart/tsconfig.json`
- [x] T004 [P] Add documentation content roots and source configuration skeleton in `content/docs/`, `apps/web/source.config.ts`, and `apps/web/lib/source.ts`
- [x] T005 [P] Add world-class evidence, benchmark, release-manifest and docs-parity output paths to `.gitignore` and `.dockerignore`
- [x] T006 Add root scripts for initializer, docs parity, benchmark and world-class evidence in `package.json`

## Phase 2: Foundational Contracts

**Purpose**: Stable contracts and shared safety boundaries required by every story.

- [x] T007 Add release-manifest and benchmark-evidence schemas with valid/invalid fixtures in `packages/core/src/release.ts` and `packages/core/src/release.test.ts`
- [x] T008 [P] Add initializer-plan schemas, secret-like input rejection and normalized-path fixtures in `packages/core/src/initializer.ts` and `packages/core/src/initializer.test.ts`
- [x] T009 [P] Add documentation-page claim/version schemas and bilingual parity fixtures in `packages/core/src/documentation.ts` and `packages/core/src/documentation.test.ts`
- [x] T010 [P] Add canonical agent-authorization view and lifecycle schemas in `packages/core/src/authorization.ts` and `packages/core/src/authorization.test.ts`
- [x] T011 Export new stable contracts with API lifecycle annotations in `packages/core/src/index.ts` and `docs/api-lifecycle.md`
- [x] T012 Add hosted metadata export/deletion and benchmark-run migrations with retention indexes in `packages/database/migrations/004_world_class_evidence.sql`
- [x] T013 Add atomic data mappings, owner isolation, retention and concurrency tests in `packages/database/src/index.ts` and `packages/database/src/index.test.ts`
- [x] T014 Add exact dependency/version/license decisions and support classifications to `docs/dependencies.md` and `docs/compatibility.md`

## Phase 3: User Story 1 — Install and Reach a Payment Independently (P1) 🎯 MVP

**Goal**: A developer installs public artifacts and completes the entire devnet paid lifecycle without cloning MeterKit or receiving code changes.

**Independent test**: From clean temporary directories and packed/public artifacts, generate a project, reach a challenge within five minutes, settle within twenty, receive a receipt and reject replay.

- [x] T015 [P] [US1] Add release-manifest generation, package allowlist, integrity and historical-registry tests in `scripts/verify-release-version.test.mjs` and `scripts/fixtures/releases/`
- [x] T016 [P] [US1] Add initializer CLI parsing, dry-run, stable exit-code and deterministic-plan tests in `packages/create-meterkit/src/cli.test.ts`
- [x] T017 [P] [US1] Add traversal, symlink escape, non-empty target, concurrent write, mainnet and secret-like input tests in `packages/create-meterkit/src/security.test.ts`
- [x] T018 [P] [US1] Add clean generated-project acceptance fixtures for Express, Next route, Hono and MCP in `packages/create-meterkit/src/templates.integration.test.ts`
- [x] T019 [US1] Implement safe normalized planning and atomic target writes in `packages/create-meterkit/src/plan.ts` and `packages/create-meterkit/src/write.ts`
- [x] T020 [US1] Implement the `create-meterkit` CLI, dry-run JSON and diagnostics in `packages/create-meterkit/src/cli.ts` and `packages/create-meterkit/src/index.ts`
- [x] T021 [P] [US1] Add versioned secretless Express and Next route templates in `packages/create-meterkit/templates/express/` and `packages/create-meterkit/templates/next-route/`
- [x] T022 [P] [US1] Add versioned secretless Hono and MCP templates in `packages/create-meterkit/templates/hono/` and `packages/create-meterkit/templates/mcp/`
- [x] T023 [US1] Extend clean-package smoke validation to pack, generate, install and exercise every declared surface/package-manager combination in `scripts/verify-clean-quickstarts.mjs`
- [x] T024 [US1] Generate and validate release manifests and intended package graph in `scripts/generate-release-manifest.mjs` and `scripts/verify-release-version.mjs`
- [x] T025 [US1] Change the release workflow to GitHub-hosted OIDC staged publishing with immutable actions and explicit approval in `.github/workflows/release.yml`
- [x] T026 [US1] Document npm owner setup, package claiming, stage approval, token restriction, emergency recovery and 0.1.0 limitations in `docs/releasing.md`
- [x] T027 [US1] Run the packed initializer and full x402 devnet journey from a clean project and record sanitized evidence in `specs/002-world-class-agent-payments/quickstart.md`

## Phase 4: User Story 2 — Understand and Adopt the Right Integration (P2)

**Goal**: Searchable bilingual documentation and four maintained surfaces share one recommended contract and full payment semantics.

**Independent test**: An unfamiliar developer finds the recommended integration/troubleshooting path within three actions and each surface passes the same paid acceptance journey.

- [x] T028 [P] [US2] Add documentation source, internal-link, version, heading and claim-key parity tests in `scripts/verify-docs-parity.test.mjs`
- [x] T029 [P] [US2] Add search, keyboard, mobile, empty/error, contrast and reduced-motion E2E cases in `tests/e2e/docs.spec.ts`
- [x] T030 [P] [US2] Add Hono unpaid challenge, paid receipt parity and replay contract tests in `examples/hono-quickstart/src/server.test.ts`
- [x] T031 [P] [US2] Add coordinated x402 2.21 compatibility fixtures for Express, Next, Hono and MCP in `scripts/fixtures/compatibility/`
- [x] T032 [US2] Integrate Fumadocs content, locale routing and local search into `apps/web/app/[lang]/docs/`, `apps/web/lib/source.ts`, and `apps/web/source.config.ts`
- [x] T033 [US2] Implement accessible documentation navigation, version badges, search recovery and locale switching in `apps/web/app/[lang]/docs/layout.tsx` and `apps/web/app/[lang]/docs/[[...slug]]/page.tsx`
- [x] T034 [P] [US2] Write canonical English start, concepts, integrations, operations, reference and trust content in `content/docs/en/`
- [x] T035 [US2] Write claim-equivalent Spanish documentation and stable claim keys in `content/docs/es/`
- [x] T036 [US2] Implement deterministic documentation parity/link/version validation in `scripts/verify-docs-parity.mjs`
- [x] T037 [US2] Implement the Hono example through the official x402 adapter and canonical MeterKit contracts in `examples/hono-quickstart/src/server.ts` and `examples/hono-quickstart/README.md`
- [x] T038 [US2] Upgrade the coordinated official x402 package set to 2.21 only after compatibility fixtures pass in `package.json`, workspace package manifests and `pnpm-lock.yaml`
- [x] T039 [US2] Extend machine-readable compatibility and API maturity output for all four surfaces in `scripts/verify-compatibility.mjs` and `docs/compatibility.md`
- [x] T040 [US2] Add documentation parity, production build and all-surface lifecycle gates to `.github/workflows/ci.yml`

## Phase 5: User Story 3 — Give an Agent a Safe Spending Budget (P3)

**Goal**: Operators create, inspect, spend within and revoke a bounded official Solana authorization with coherent receipts and race safety.

**Independent test**: On devnet create an exact-scope allowance, accept bounded spend, reject concurrent overspend, revoke and reject later use while retaining Explorer evidence.

- [x] T041 [P] [US3] Add official allowance create/inspect/revoke contract fixtures and address derivation tests in `packages/subscriptions/src/authorization.test.ts`
- [x] T042 [P] [US3] Add expiry, wrong delegate/network/mint/recipient/resource, over-budget and revoked-spend tests in `packages/subscriptions/src/policy.test.ts`
- [x] T043 [P] [US3] Add concurrent reservation, revocation race, RPC unknown/recovery and duplicate-consumption database tests in `packages/database/src/index.test.ts`
- [x] T044 [P] [US3] Add dashboard create/inspect/revoke loading, rejection, unknown and finalized browser tests in `tests/e2e/allowances.spec.ts`
- [x] T045 [US3] Implement the canonical authorization view over official Solana primitives in `packages/subscriptions/src/authorization.ts` and `packages/subscriptions/src/index.ts`
- [x] T046 [US3] Implement exact-scope bounded spend evaluation and sanitized authorization/payment receipt linkage in `packages/sdk/src/agent-budget.ts` and `packages/sdk/src/protect.ts`
- [x] T047 [US3] Implement atomic hosted reservation/consumption/release and retention mapping in `packages/database/src/index.ts`
- [x] T048 [US3] Add gateway authorization inspection, export and deletion endpoints with owner isolation in `apps/gateway/src/server.ts` and `apps/gateway/src/authorization.ts`
- [x] T049 [US3] Implement dashboard create, inspect, remaining-capacity, Explorer and wallet-controlled revoke UX in `apps/web/app/agent/allowances/`
- [x] T050 [US3] Document fixed, recurring and subscription-plan semantics and self-custody limitations in `content/docs/en/agent-budgets/` and `content/docs/es/agent-budgets/`
- [x] T051 [US3] Run fresh allowance create/spend/concurrency/revoke evidence on devnet without real funds and update `specs/002-world-class-agent-payments/quickstart.md`

## Phase 6: User Story 4 — Evaluate MeterKit as Professional Infrastructure (P4)

**Goal**: A reviewer can reproduce security, compatibility, performance, resilience, provenance and recovery claims from one exact revision.

**Independent test**: Run the evidence command on a clean commit, reproduce three workload levels/outages, validate manifests/SBOM and trace the public candidate to source and rollback.

- [x] T052 [P] [US4] Add benchmark schema, percentile, accounting and zero-duplicate unit tests in `scripts/benchmark.test.mjs`
- [x] T053 [P] [US4] Add RPC, facilitator, persistence outage and rate-limit recovery fixtures in `scripts/fixtures/resilience/`
- [x] T054 [P] [US4] Add hosted metadata export/deletion authorization and retention tests in `apps/gateway/src/server.test.ts`
- [x] T055 [US4] Implement the reproducible three-level local/external latency harness in `scripts/benchmark.mjs`
- [x] T056 [US4] Implement bounded rate-limit headers, retry guidance and sanitized correlation at hosted boundaries in `apps/gateway/src/http-policy.ts` and `apps/gateway/src/server.ts`
- [x] T057 [US4] Extend finality and dependency reconciliation with benchmarkable outage recovery evidence in `apps/gateway/src/finality.ts`
- [x] T058 [US4] Generate exact-commit release, compatibility, SBOM, benchmark, health and rollback evidence in `scripts/verify-world-class-evidence.mjs`
- [x] T059 [US4] Document measured operating envelope, limitations and non-SLA devnet posture in `docs/performance.md` and `docs/operations.md`
- [x] T060 [US4] Update supported-version, private disclosure and release remediation expectations in `SECURITY.md` and `SUPPORT.md`
- [x] T061 [US4] Add benchmark/resilience, staged provenance, manifest and secret-scan gates to `.github/workflows/ci.yml` and `.github/workflows/release.yml`

## Phase 7: User Story 5 — Contribute and Validate Independent Adoption (P5)

**Goal**: Contributors and pilot developers can participate independently, while all adoption and upstream claims remain evidence-backed.

**Independent test**: A third party follows public instructions, exports minimized evidence, or opens a conforming contribution without private setup information.

- [x] T062 [P] [US5] Add contributor setup and starter-issue reproducibility checks in `scripts/verify-contributor-path.mjs`
- [x] T063 [P] [US5] Add pilot consent, deletion, assistance, usefulness-rating and repeated-use evidence tests in `packages/pilot/src/activation.test.ts`
- [x] T064 [US5] Extend opt-in activation export, usefulness-rating and deletion semantics in `packages/pilot/src/activation.ts` and `packages/pilot/src/cli.ts`
- [x] T065 [US5] Publish bounded starter issues and upstream proposal criteria in `CONTRIBUTING.md`, `.github/ISSUE_TEMPLATE/`, and `docs/upstream.md`
- [x] T066 [US5] Update the public pilot path for released packages and generated projects in `docs/pilots/README.md` and `apps/web/app/pilots/page.tsx`
- [x] T067 [US5] Propose one useful standards-compatible contribution to an upstream Solana/x402/MCP project and record only its factual public status in `docs/upstream.md`
- [ ] T068 [US5] Record three genuine external integrations and assistance levels in `docs/pilots/results.md` only after consented evidence exists
- [ ] T069 [US5] Record one integration completing ten valid test payments across seven days only after participant evidence exists in `docs/pilots/results.md`
- [ ] T070 [US5] Publish the case study and funding update only after T068–T069 are supported in `docs/pilots/case-study.md` and `docs/funding.md`

## Phase 8: Polish and Cross-Cutting Gates

- [x] T071 [P] Create a scored package/domain/repository/search/social/trademark brand assessment without purchasing or renaming in `docs/brand-assessment.md`
- [x] T072 [P] Reconcile architecture, security, business model, competition and roadmap with shipped facts in `docs/architecture.md`, `docs/security.md`, `docs/business-model.md`, `docs/competition.md`, and `docs/roadmap.md`
- [x] T073 Reconcile English/Spanish landing, README, docs and package claims in `README.md`, `docs/en/README.md`, `docs/es/README.md`, and `content/docs/`
- [ ] T074 Run formatting, lint, typecheck, tests, builds, E2E, audit, dependency review, CodeQL, secret scan, image scan, SBOM, package smoke, docs parity, compatibility and benchmarks via `package.json`
- [x] T075 Perform desktop/mobile visual, keyboard, console, contrast, heading, loading/error and reduced-motion inspection and save sanitized evidence via `scripts/verify-world-class-evidence.mjs`
- [x] T076 Run complete initializer x402, MCP and agent-authorization devnet journeys and update `specs/002-world-class-agent-payments/quickstart.md` with exact internal results
- [x] T077 Run Spec Kit convergence and leave only genuine third-party/owner-gated outcomes unchecked in `specs/002-world-class-agent-payments/tasks.md`

## Dependencies

- Phase 2 depends on Phase 1 and blocks every user story.
- US1 is the activation MVP and should ship before documentation expansion.
- US2 can begin after foundational contracts; x402 upgrade T038 depends on parity fixtures T030–T031.
- US3 can begin after foundational authorization contracts and does not depend on documentation UI.
- US4 can begin after foundational evidence schemas; release claims depend on US1 release manifests.
- US5 tooling can begin after US1; real outcomes T068–T070 depend on independent third parties and cannot be synthesized.
- Owner-gated npm configuration/public approval in T025–T027 must remain explicit even when all repository work passes.
- Polish gates run after all locally controllable story work; T077 must retain external or owner-gated outcomes truthfully.

## Parallel Opportunities

- Setup skeletons T003–T005 are independent after T002 identifies the workspace shape.
- Foundational schemas T008–T010 can run in parallel before shared exports/database mapping.
- US1 CLI tests, security tests, template fixtures and release tests T015–T018 are independent.
- US2 docs tests, Hono tests, compatibility fixtures and English content T028–T034 can proceed in parallel.
- US3 protocol, policy, concurrency and browser tests T041–T044 can proceed in parallel before integration.
- US4 benchmark, resilience and hosted-data tests T052–T054 are independent.
- US5 contributor and pilot evidence tooling T062–T063 are independent; external recruitment waits for the activation release.

## Implementation Strategy

1. Complete setup and foundational contracts with failing tests first.
2. Deliver US1 as the first independently reviewable PR: public release trust plus a clean generated full-payment journey.
3. Deliver documentation and Hono parity separately from the x402 version upgrade; upgrade only after fixtures are green.
4. Deliver agent authorization as an isolated protocol/SDK/database/UI increment with fresh devnet evidence.
5. Add benchmarks and professional evidence after critical behavior is stable.
6. Recruit pilots and propose upstream work only after public activation succeeds; never mark third-party outcomes from internal agents or maintainer wallets.
7. Evaluate branding last and do not purchase, rename, publish, or use mainnet without the corresponding owner gate.

## Phase 9: Convergence

- [ ] T078 CRITICAL Rotate the exposed Coolify deployment credential, inspect its audit history for unauthorized use, validate the replacement without logging it, and retain only sanitized incident evidence per Constitution I and Constitution VI (contradicts)
- [ ] T079 Publish the reviewed `0.2.0` public package set, including the first `create-meterkit` release, through the staged OIDC workflow; verify registry provenance, tarball contents, version-matched documentation, clean installation and rollback per FR-001 and FR-032 (partial)
