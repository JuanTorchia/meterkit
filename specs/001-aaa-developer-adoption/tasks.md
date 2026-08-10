# Tasks: AAA Developer Adoption

**Input**: `spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/`, and `quickstart.md`

**Tests**: Required by the constitution and FR-024. Test tasks precede behavior changes.

## Phase 1: Setup

- [x] T001 Add `packages/policy-webacy` to the workspace with strict TypeScript package metadata in `packages/policy-webacy/package.json` and `packages/policy-webacy/tsconfig.json`
- [x] T002 Add clean quickstart and compatibility commands to root scripts in `package.json`
- [x] T003 [P] Create the Next.js route example package skeleton in `examples/next-route-quickstart/package.json` and `examples/next-route-quickstart/tsconfig.json`
- [x] T004 [P] Add feature evidence output paths and secret exclusions to `.gitignore` and `.dockerignore`

## Phase 2: Foundational Contracts

- [x] T005 Add versioned policy input/configuration/decision schemas and types with boundary tests in `packages/core/src/policy.ts` and `packages/core/src/policy.test.ts`
- [x] T006 Add sanitized public receipt schema, fingerprint helper, and state transition tests in `packages/core/src/receipt.ts` and `packages/core/src/receipt.test.ts`
- [x] T007 Export the new stable domain contracts without breaking current exports in `packages/core/src/index.ts`
- [x] T008 Add package-level secret-like field rejection and payload-size fixtures in `packages/core/src/security.test.ts`
- [x] T009 Add receipt/policy persistence migration and indexes in `packages/database/migrations/003_policy_receipts.sql`
- [x] T010 Add database mappings, atomic receipt transitions, retention, and concurrency tests in `packages/database/src/index.ts` and `packages/database/src/index.test.ts`

## Phase 3: User Story 1 — Complete a Paid Endpoint Independently (P1)

**Goal**: A new developer completes challenge, settlement, receipt, protected result, and replay rejection.

**Independent test**: Run the primary quickstart from a clean install and produce a validated settlement evidence file without maintainer code edits.

- [x] T011 [P] [US1] Add adversarial configuration and lifecycle contract tests for the canonical SDK API in `packages/sdk/src/protect.test.ts`
- [x] T012 [US1] Implement synchronous option validation and canonical `protect()` delegation in `packages/sdk/src/protect.ts`
- [x] T013 [US1] Preserve compatibility by delegating `createX402Middleware` and documenting advanced exports in `packages/sdk/src/index.ts`
- [x] T014 [P] [US1] Add complete copy-paste Express server tests in `examples/express-quickstart/src/server.test.ts`
- [x] T015 [US1] Rewrite the Express quickstart as a complete published-package example in `examples/express-quickstart/src/server.ts` and `examples/express-quickstart/README.md`
- [x] T016 [P] [US1] Add diagnose/evidence command tests and stable exit-code tests in `packages/pilot/src/cli.test.ts` and `packages/pilot/src/evidence.test.ts`
- [x] T017 [US1] Implement `diagnose` and sanitized settlement `evidence` validation in `packages/pilot/src/cli.ts` and `packages/pilot/src/evidence.ts`
- [x] T018 [US1] Make the npm SDK README copy-paste complete and activation-first in `packages/sdk/README.md`
- [x] T019 [US1] Add a clean temporary-project smoke runner with no repository workspace resolution in `scripts/verify-clean-quickstarts.mjs`
- [x] T020 [US1] Add primary activation commands and stage timing to `package.json` and `docs/sdk-quickstart.md`

## Phase 4: User Story 2 — Adopt One Canonical Integration Path (P2)

**Goal**: Express, Next.js route, and MCP journeys use one documented contract with parity evidence.

**Independent test**: Each maintained example independently proves challenge, protected result contract, receipt shape, and replay behavior.

- [x] T021 [P] [US2] Add Next.js route contract tests in `examples/next-route-quickstart/app/api/premium/route.test.ts`
- [x] T022 [US2] Implement the Next.js route-handler adapter example in `examples/next-route-quickstart/app/api/premium/route.ts` and `examples/next-route-quickstart/README.md`
- [x] T023 [P] [US2] Add canonical receipt and policy parity assertions to `examples/mcp-scout/src/server.integration.test.ts`
- [x] T024 [US2] Migrate MCP Scout to the canonical public contracts in `examples/mcp-scout/src/server.ts` and `examples/mcp-scout/README.md`
- [x] T025 [US2] Generate a machine-readable compatibility report in `scripts/verify-compatibility.mjs` and `docs/compatibility.md`
- [x] T026 [US2] Document public API lifecycle and migration from legacy exports in `docs/api-lifecycle.md` and `CHANGELOG.md`
- [x] T027 [US2] Add compatibility/quickstart validation jobs to `.github/workflows/ci.yml`

## Phase 5: User Story 3 — Operate and Audit Payments Confidently (P3)

**Goal**: Decisions and dependency failures are observable, sanitized, recoverable, and release-traceable.

**Independent test**: Induced RPC/facilitator/store failures yield documented states and recover without duplicate execution.

- [x] T028 [P] [US3] Add sanitized event contract and callback-isolation tests in `packages/sdk/src/events.test.ts`
- [x] T029 [US3] Implement bounded payment lifecycle events and public receipt projection in `packages/sdk/src/events.ts` and `packages/sdk/src/protect.ts`
- [x] T030 [P] [US3] Add unknown/recovery/final failure reconciliation tests in `apps/gateway/src/finality.test.ts`
- [x] T031 [US3] Extend durable reconciliation and receipt state exposure in `apps/gateway/src/finality.ts` and `apps/gateway/src/server.ts`
- [x] T032 [P] [US3] Add receipt UI loading/error/unknown/finalized and keyboard tests in `tests/e2e/dashboard.spec.ts`
- [x] T033 [US3] Implement accessible receipt status and sanitized evidence UX in `apps/web/app/dashboard-client.tsx` and `apps/web/app/styles.css`
- [x] T034 [US3] Add an exact-commit AAA evidence runner and secret scan in `scripts/verify-aaa-evidence.mjs` and `package.json`
- [x] T035 [US3] Document SLOs, dependency failure semantics, health checks, and rollback in `docs/operations.md`
- [x] T036 [US3] Extend release verification with compatibility, SBOM, provenance, and migration evidence in `.github/workflows/release.yml` and `scripts/verify-release-version.mjs`

## Phase 6: User Story 4 — Apply Optional Risk-Aware Policies (P4)

**Goal**: Generic pre-payment policy evaluation plus a removable Webacy adapter.

**Independent test**: Adapter fixtures cover all decisions/failures and deleting its package/config leaves core results unchanged.

- [x] T037 [P] [US4] Add ordered evaluator, timeout, fail-mode, and callback-isolation tests in `packages/sdk/src/policy-runner.test.ts`
- [x] T038 [US4] Implement generic bounded policy orchestration in `packages/sdk/src/policy-runner.ts` and integrate it in `packages/sdk/src/protect.ts`
- [x] T039 [P] [US4] Add Webacy allow/warn/deny/error, URL-origin, size-limit, and credential-redaction tests in `packages/policy-webacy/src/index.test.ts`
- [x] T040 [US4] Implement the fetch-injected Webacy adapter and response mapping in `packages/policy-webacy/src/index.ts`
- [x] T041 [US4] Document Webacy configuration, data minimization, limitations, and removal in `packages/policy-webacy/README.md` and `docs/risk-policies.md`
- [x] T042 [US4] Add a safe disabled-by-default risk-policy example to `examples/express-quickstart/src/server.ts`
- [x] T043 [US4] Prepare truthful grant answers and integration milestones in `docs/grants/webacy-startup-accelerator.md` and update `docs/funding.md`

## Phase 7: User Story 5 — Validate Adoption and Community Trust (P5)

**Goal**: A consented, evidence-backed pilot and professional OSS adoption path.

**Independent test**: A participant can export a minimized activation report; project claims remain reconcilable and no external result is fabricated.

- [x] T044 [P] [US5] Add activation report schema, consent, assistance, and redaction tests in `packages/pilot/src/activation.test.ts`
- [x] T045 [US5] Implement opt-in activation stage recording/export in `packages/pilot/src/activation.ts` and `packages/pilot/src/cli.ts`
- [x] T046 [US5] Add pilot instructions, consent language, friction taxonomy, and evidence rules in `docs/pilots/README.md`
- [x] T047 [P] [US5] Refresh contributor entry points and bounded starter issues in `CONTRIBUTING.md`, `SUPPORT.md`, and `.github/ISSUE_TEMPLATE/`
- [x] T048 [US5] Add release badges, activation-first navigation, and pilot CTA to `README.md` and `docs/en/README.md`
- [ ] T049 [US5] Record three genuine external integrations and assistance levels in `docs/pilots/results.md` only after evidence is received
- [ ] T050 [US5] Publish a factual case study and grant update in `docs/pilots/case-study.md` only after T049 has real external evidence

## Phase 8: Polish and Cross-Cutting Gates

- [x] T051 [P] Add requirements-quality security/API/UX checklists in `specs/001-aaa-developer-adoption/checklists/`
- [x] T052 Reconcile English and Spanish technical claims across `README.md`, `docs/en/README.md`, and affected `docs/*.md`
- [x] T053 Run formatting, lint, typecheck, unit, build, E2E, audit, CodeQL-equivalent local checks, image scan, clean-package smoke, compatibility, and secret scan from `package.json`
- [x] T054 Perform desktop/mobile visual, keyboard, console, loading/error, and reduced-motion inspection and save sanitized evidence via `scripts/verify-aaa-evidence.mjs`
- [x] T055 Run complete local-validator or devnet x402 and MCP journeys without mainnet or real funds and update `specs/001-aaa-developer-adoption/quickstart.md` with exact results
- [x] T056 Update `docs/architecture.md`, `docs/security.md`, `docs/competition.md`, `docs/business-model.md`, and `docs/roadmap.md` to match shipped facts
- [x] T057 Run Spec Kit convergence and leave only externally blocked outcomes unchecked in `specs/001-aaa-developer-adoption/tasks.md`

## Dependencies

- Phase 2 blocks all user-story implementation.
- US1 is the MVP and blocks compatibility/parity claims in US2.
- US2 and US3 may proceed in parallel after US1.
- US4 depends on foundational policy schemas and canonical `protect()` but not on UI work.
- US5 tooling can proceed after US1; T049 and T050 require real third parties and cannot be completed synthetically.
- Cross-cutting gates run after all implementation tasks except externally blocked T049/T050.

## Parallel Examples

- After T007: T011, T014, and T016 can run in parallel.
- After US1: Next.js parity (T021-T022), MCP parity (T023-T024), and events (T028-T029) are independent.
- Policy runner tests (T037) and Webacy fixture tests (T039) can run in parallel before integration.
- Pilot activation schema (T044) and contributor documentation (T047) are independent.

## Implementation Strategy

1. Ship US1 as the first reviewable PR and prove clean activation.
2. Add US2 and US3 in separate PRs to preserve reviewability.
3. Add the generic policy interface before the Webacy leaf adapter.
4. Submit the Webacy application after adapter contract tests and truthful docs pass.
5. Recruit pilots only after clean-package evidence passes; never mark external
   outcome tasks complete without independent evidence.
