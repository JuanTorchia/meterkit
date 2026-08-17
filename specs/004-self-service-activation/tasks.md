# Tasks: Self-Service Activation

**Input**: Design documents from `/specs/004-self-service-activation/`

**Tests**: Contract and journey tests are mandatory because the specification
requires literal public-command, restart/replay and external-evidence proof.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish public package and evidence boundaries without changing
existing product behavior.

- [x] T001 Add the `@usemeterkit/cli` workspace package, bin entry, TypeScript build and test scripts in `packages/cli/package.json`, `packages/cli/tsconfig.json`, and `pnpm-workspace.yaml`
- [x] T002 [P] Add versioned initializer, diagnostic, payment-session, support-matrix and verification schemas in `packages/core/src/self-service.ts` and export them from `packages/core/src/index.ts`
- [x] T003 [P] Add the machine-readable Node 22/npm/pnpm/four-surface beta contract in `support-matrix.json` and document ownership in `docs/support-matrix.md`
- [x] T004 Update the existing root pnpm build, typecheck, lint and test orchestration for `packages/cli` in `package.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared safe CLI behavior, sanitization and fixture infrastructure.

**⚠️ CRITICAL**: User-story work starts after this phase.

- [x] T005 [P] Write failing unit tests for stable CLI exit codes, JSON envelopes and redaction in `packages/cli/src/output.test.ts`
- [x] T006 [P] Write failing tests for public-key, URL, policy-limit and local-file permission validation in `packages/cli/src/config.test.ts`
- [x] T007 Implement shared command parsing, exit codes and schema-versioned human/JSON output in `packages/cli/src/cli.ts` and `packages/cli/src/output.ts`
- [x] T008 Implement sanitized config loading and validators that never emit keys, proofs or database URLs in `packages/cli/src/config.ts` and `packages/cli/src/output.ts`
- [x] T009 [P] Create isolated HTTP, RPC, facilitator and disposable-wallet fixtures in `packages/cli/test/fixtures.ts` and `scripts/fixtures/self-service/README.md`
- [x] T010 Add CLI package content and secret-scan assertions plus dependency maintenance/license review evidence to `scripts/verify-package-contents.mjs`, `scripts/scan-secrets.mjs`, and `docs/dependencies.md`

**Checkpoint**: Public CLI commands can share one validated, sanitized contract.

---

## Phase 3: User Story 1 — Reach the First 402 Independently (Priority: P1) 🎯 MVP

**Goal**: A stranger creates and runs any supported project and sees a valid 402
using only public artifacts and generated instructions.

**Independent Test**: In a clean environment, run the literal initializer for
each npm/pnpm × surface cell, load only its generated env file, start it and
obtain a decoded policy-valid 402 without a monorepo clone, PostgreSQL or help.

### Tests for User Story 1

- [x] T011 [P] [US1] Write failing guided-TTY and non-TTY initializer contract tests in `packages/create-meterkit/src/cli.test.ts`
- [x] T012 [P] [US1] Write failing atomic-directory, install-failure recovery and manager-specific output tests in `packages/create-meterkit/src/write.test.ts`
- [x] T013 [P] [US1] Write failing generated-project tests that use real env files and documented commands for all surfaces in `packages/create-meterkit/src/templates.integration.test.ts`
- [x] T014 [P] [US1] Write failing 402 decode/output contract tests for `meterkit check` in `packages/cli/src/check.test.ts`

### Implementation for User Story 1

- [x] T015 [US1] Model interactive defaults and complete non-interactive validation in `packages/create-meterkit/src/plan.ts`
- [x] T016 [US1] Implement TTY prompts, meaningful `--yes`, install/no-install, dry-run and JSON results in `packages/create-meterkit/src/cli.ts`
- [x] T017 [US1] Implement safe destination checks, recoverable installation failure and manager-specific next steps in `packages/create-meterkit/src/write.ts`
- [x] T018 [P] [US1] Make Express and Hono templates load `.env`, use the selected manager and expose HTTP check scripts in `packages/create-meterkit/templates/express/` and `packages/create-meterkit/templates/hono/`
- [x] T019 [P] [US1] Make Next load its documented env and expose an HTTP check script; make experimental MCP load `.env` and retain a truthfully labeled native stdio unpaid probe in `packages/create-meterkit/templates/next-route/` and `packages/create-meterkit/templates/mcp/`
- [x] T020 [US1] Implement unpaid challenge discovery and exact policy display in `packages/cli/src/check.ts` and wire it in `packages/cli/src/cli.ts`
- [x] T021 [US1] Replace one-line generated READMEs with manager-correct create→env→run→check instructions, expected output, memory warning and reset steps in `packages/create-meterkit/templates/*/README.md`
- [x] T022 [US1] Rewrite the canonical public initializer path and correct the published-package contradiction in `packages/create-meterkit/README.md`, `docs/sdk-quickstart.md`, and `README.md`
- [x] T023 [US1] Extend clean quickstart validation to execute literal generated commands without injected wallet env or workspace resolution in `scripts/verify-clean-quickstarts.mjs`

**Checkpoint**: This is an internal implementation checkpoint, not a releasable
public journey. A first-time developer can reach the first 402, but US2 is still
required before publishing the complete example promised by the constitution.

---

## Phase 4: User Story 2 — Complete the Safe Payment Lifecycle (Priority: P2)

**Goal**: Public tools complete a bounded devnet payment, protected response and
replay rejection, with a durable restart-safe deployment path.

**Independent Test**: Generate a fresh project, migrate PostgreSQL, pay once,
assert one protected execution, replay before/after restart and assert no second
acceptance or execution.

### Tests for User Story 2

- [x] T024 [P] [US2] Write failing standalone migration, duplicate-key and sanitized-record tests in `packages/database/src/standalone-payment-store.test.ts`
- [x] T025 [P] [US2] Write failing concurrent-consume, middleware protected-handler and post-restart replay tests in `packages/sdk/src/durable-replay.integration.test.ts`
- [x] T026 [P] [US2] Write failing exact-policy confirmation, spend-limit, secret-redaction and pay/replay tests in `packages/cli/src/pay.test.ts`
- [x] T027 [P] [US2] Write failing strict verify/correlation and SSRF/localhost policy tests in `packages/cli/src/verify.test.ts`

### Implementation for User Story 2

- [x] T028 [US2] Add the adapter-owned replay schema and idempotent advisory-lock migration in `packages/database/migrations/standalone/001_replay_store.sql` and `packages/database/src/standalone-migrations.ts`
- [x] T029 [US2] Implement `StandalonePostgresPaymentStore` with hashed replay keys, atomic duplicates, bounded pool lifecycle and `PAYMENT_REPLAYED` mapping in `packages/database/src/standalone-payment-store.ts`
- [x] T030 [US2] Export and document the standalone adapter without exposing hosted gateway setup in `packages/database/src/index.ts` and `packages/database/README.md`
- [x] T031 [US2] Add explicit memory/postgres generated configuration, fail-closed startup and shared store reuse to `packages/create-meterkit/src/plan.ts` and `packages/create-meterkit/templates/*/`
- [x] T032 [US2] Extract the strict public verifier from pilot-only orchestration into `packages/cli/src/verify.ts` while retaining compatibility exports in `packages/pilot/src/index.ts`
- [x] T033 [US2] Implement bounded local-keypair devnet payment, interactive confirmation and same-process replay in `packages/cli/src/pay.ts`
- [x] T034 [US2] Add generated `verify` and `pay:test` scripts plus exact safe-payment instructions to `packages/create-meterkit/templates/*/package.json` and `packages/create-meterkit/templates/*/README.md`
- [x] T035 [US2] Add the PostgreSQL migrate→pay→concurrent replay→restart→replay harness in `scripts/verify-generated-devnet.mjs`

**Checkpoint**: The full payment lifecycle works from public packages and the
deployment path rejects replay across processes and restart.

---

## Phase 5: User Story 3 — Diagnose and Recover Without Support (Priority: P3)

**Goal**: Developers identify and safely recover from setup, devnet and
durability failures without false certainty or secret disclosure.

**Independent Test**: Introduce every recovery-matrix fault independently and
assert the four-state finding, sanitized evidence and executable remediation.

### Tests for User Story 3

- [x] T036 [P] [US3] Write failing diagnostic finding/state/redaction tests in `packages/cli/src/doctor.test.ts`
- [x] T037 [P] [US3] Add failing RPC, facilitator, token-account, endpoint and database outage cases in `scripts/verify-self-service-recovery.test.mjs`

### Implementation for User Story 3

- [x] T038 [US3] Implement non-mutating runtime, config, endpoint and active-durability checks in `packages/cli/src/doctor.ts`
- [x] T039 [US3] Implement bounded-timeout RPC devnet identity, facilitator, recipient ATA/readiness and settlement-state checks with explicit retry/fail-closed semantics in `packages/cli/src/doctor-solana.ts`
- [x] T040 [US3] Map definitive failures versus unavailable/unknown external states to manager-correct remediation in `packages/cli/src/remediation.ts`
- [x] T041 [US3] Add generated `doctor` scripts and troubleshooting/escalation sections in `packages/create-meterkit/templates/*/package.json` and `packages/create-meterkit/templates/*/README.md`
- [x] T042 [US3] Implement and run the complete non-mutating recovery matrix in `scripts/verify-self-service-recovery.mjs` using `scripts/fixtures/self-service/`

**Checkpoint**: Common failures can be diagnosed without maintainer intervention.

---

## Phase 6: User Story 4 — Evaluate a Trustworthy Free Beta (Priority: P4)

**Goal**: Public surfaces truthfully explain the free beta, optional customer-paid
service, limitations and actual evidence.

**Independent Test**: Five candidates can correctly explain the offer and public
claims match a machine-validated evidence ledger with synthetic/external split.

### Tests for User Story 4

- [x] T043 [P] [US4] Write failing EN/ES CTA, devnet, compensation and optional-service parity assertions in `scripts/verify-docs-parity.test.mjs`
- [x] T044 [P] [US4] Write failing synthetic-versus-external classification and commercial-gate tests in `packages/pilot/src/self-service-evidence.test.ts`
- [x] T045 [P] [US4] Write failing homepage comprehension, trust-link, keyboard, mobile, contrast, loading and failure-state browser checks in `apps/web/app/self-service-cta.test.tsx`

### Implementation for User Story 4

- [x] T046 [US4] Add registry verification and external activation schemas with scoped consent and immutable participant classification in `packages/pilot/src/self-service-evidence.ts`
- [x] T047 [US4] Add a minimized append-only local beta ledger and aggregate exporter that excludes CI/downloads from adoption in `packages/pilot/src/self-service-ledger.ts` and `packages/pilot/src/cli.ts`
- [x] T048 [US4] Replace the primary sales CTA with the free five-person beta and separate optional USD 100 setup copy in `apps/web/app/page.tsx` and `apps/web/app/pilots/page.tsx`
- [x] T049 [US4] Publish factual maintainer, support, release provenance, security, roadmap, devnet-only and current-evidence links in `apps/web/app/page.tsx` and `README.md`
- [x] T050 [US4] Add a public synthetic/external beta result template with zero/unknown-safe metrics in `docs/beta-results.md` and validate it in `scripts/verify-version-claims.mjs`
- [x] T051 [US4] Correct stale package/support claims and synchronize canonical English/Spanish setup and commercial wording in `docs/`, `packages/create-meterkit/README.md`, and `packages/pilot/README.md`

**Checkpoint**: The offer is understandable and no trust claim exceeds evidence.

---

## Phase 7: Release Evidence and Cross-Cutting Validation

**Purpose**: Prove the complete public story and prevent future drift.

- [x] T052 [P] Add PR packed-artifact and release-candidate npm/pnpm × supported HTTP surface jobs plus a separately labeled experimental MCP job in `.github/workflows/ci.yml` and `.github/workflows/release.yml`
- [x] T053 [P] Add macOS/Windows npm Express+Next portability anchors and non-blocking Yarn/Bun experiments in `.github/workflows/ci.yml`
- [x] T054 Implement exact-version post-publish registry smoke with integrity/resolution, health-check and tested rollback evidence in `scripts/verify-registry-quickstarts.mjs` and `.github/workflows/release.yml`
- [x] T055 Add a claim checklist that blocks release promotion on unsupported commands, semantic-version/migration/changelog gaps, versions or registry cells in `scripts/verify-self-service-claims.mjs` and `.github/workflows/release.yml`
- [ ] T056 Execute every step in `specs/004-self-service-activation/quickstart.md` and record sanitized release evidence in `docs/evidence/self-service/README.md`
- [ ] T057 Run the five-person external beta, record consented runs through `packages/pilot`, and publish only eligible aggregates in `docs/beta-results.md`
- [x] T058 Re-evaluate dedicated-domain purchase, visual identity and primary USD 100 promotion only after the evidence gate, documenting the decision in `docs/self-service-gate-review.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- Setup (T001–T004) starts immediately.
- Foundation (T005–T010) depends on setup and blocks all stories.
- US1 (T011–T023) is the first shippable MVP.
- US2 (T024–T035) depends on shared foundation and consumes the generated US1
  project, but its database and CLI tests can begin while US1 templates settle.
- US3 (T036–T042) depends on shared CLI/config and integrates with US1/US2 checks.
- US4 (T043–T051) depends only on evidence schemas from setup/foundation; public
  activation claims remain zero/unknown until US1/US2 external results exist.
- Release evidence (T052–T058) follows the stories included in a release.

### Parallel Opportunities

- T002 and T003 can run alongside T001; T005, T006 and T009 are independent.
- US1 contract tests T011–T014 can be written in parallel; template pairs
  T018/T019 can be implemented in parallel.
- US2 store, middleware, pay and verify tests T024–T027 are independent.
- US3 CLI tests T036 and outage harness T037 are independent.
- US4 documentation, evidence and browser tests T043–T045 are independent.
- After foundation, separate owners can execute US1 and evidence-model portions
  of US4 concurrently without presenting unverified public claims.

## Implementation Strategy

### MVP first

1. Complete setup and foundation.
2. Complete US1 only.
3. Run the literal packed-artifact eight-cell first-402 test locally.
4. Do not publish or promote this checkpoint as the complete public journey.
5. Complete US2 and its paid-lifecycle evidence before any public release.
6. Observe initial external starts before expanding the feature surface.

### Incremental delivery

1. US1 proves public distribution and first 402.
2. US2 proves useful payment, replay and deployment durability.
3. US3 makes failures recoverable without support.
4. US4 aligns the public offer and gathers truthful external evidence.
5. Release gates prevent source-tree tests from masquerading as registry or
   adoption evidence.

## Notes

- Tests in each story are written and observed failing before implementation.
- `[P]` means different files and no dependency on another incomplete task.
- Memory mode never supports a production/deployment-ready claim.
- Domain, logo, contributions and additional x402 functions remain outside the
  MVP until activation evidence identifies them as the limiting factor.

## Phase 8: Convergence

- [x] T059 Complete `meterkit doctor` dependency, exact-policy, test-asset balance, settlement and replay diagnostics with bounded sanitized remediation per FR-013, FR-014 and FR-015 (partial)
- [x] T060 Replace hardcoded settlement/Explorer recovery outcomes with executable fixtures that exercise public diagnostic behavior in `scripts/verify-self-service-recovery.mjs` per SC-005 (partial)
- [x] T061 Render manager-correct `verify`, `doctor` and `pay:test` instructions in every generated README per FR-004 (contradicts)
- [x] T062 Extend the generated durable lifecycle harness across supported HTTP surfaces with concurrent paid proof, protected-execution counts, restart replay and database fail-closed assertions per FR-012 and SC-006 (partial)
- [x] T063 Preserve all five scoped beta consents in append-only external activation evidence and exclude ineligible records from aggregates per FR-025 (partial)
- [x] T064 Make registry smoke evidence schema-valid, automatically gate recommendation, and exercise a verifiable rollback decision rather than recording prose only per SC-007 and Constitution VI (partial)
- [x] T065 Add real Playwright desktop/mobile interaction, console, loading, failure, keyboard and accessibility checks for the public beta CTA per Constitution IV and delivery gate 5 (partial)
- [x] T066 Require and validate a correlated payment response and settlement reference before `meterkit pay` reports success per FR-008 and FR-009 (partial)
- [x] T067 Prevent the public primary journey from directing users to unpublished `0.3.0` artifacts before the exact registry gate passes per FR-019 (contradicts)
