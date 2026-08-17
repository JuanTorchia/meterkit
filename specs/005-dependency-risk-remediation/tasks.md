# Tasks: Dependency Risk Remediation

**Input**: Design documents from `/specs/005-dependency-risk-remediation/`

**Execution boundary**: Tasks explicitly labeled **[SERVER]** run only on the
designated 24 GB server or CI. WSL tasks are edits, inspection, syntax checks and
small named unit tests only.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish versioned contracts and isolated evidence directories.

- [x] T001 Add dependency finding, path, artifact, cohort, candidate, exception and evidence schemas in `packages/core/src/dependency-risk.ts` and export them from `packages/core/src/index.ts`
- [x] T002 [P] Add sanitized source and normalized inventory fixture directories with provenance rules in `scripts/dependency-risk/fixtures/README.md`
- [x] T003 [P] Add ignored private/raw and reviewable sanitized dependency-evidence paths to `.gitignore`, `.dockerignore`, and `docs/security/dependency-status.md`
- [x] T004 Add bounded dependency-risk script commands without attaching heavy work to local pretest hooks in `package.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Deterministic source/result handling shared by all stories.

- [x] T005 [P] Write failing schema tests for source availability, finding lifecycle, exceptions and evidence digest linkage in `packages/core/src/dependency-risk.test.ts`
- [x] T006 [P] Write failing normalization tests for duplicate advisories, conflicting providers, zero-result versus unavailable sources and stable ordering in `scripts/dependency-risk/normalize.test.mjs`
- [x] T007 Implement sanitized source snapshot adapters and bounded failure states, including maintainer reports, in `scripts/dependency-risk/sources.mjs`
- [x] T008 Implement deterministic identifiers, canonical ordering and redaction helpers in `scripts/dependency-risk/model.mjs`
- [x] T009 Implement one local dispatcher that rejects heavy collection in WSL unless explicitly running in the recorded server environment in `scripts/dependency-risk/cli.mjs`
- [x] T010 Document server environment identity, timeout, retry, private snapshot and artifact-retention rules in `docs/security/dependency-operations.md`

**Checkpoint**: Source silence, empty results and unavailable evidence are
represented distinctly before any risk classification occurs.

---

## Phase 3: User Story 1 — Establish a Trustworthy Risk Inventory (Priority: P1) 🎯 MVP

**Goal**: Account for every reported problem, exact path, exposure and affected
artifact in one deduplicated inventory.

**Independent Test**: Feed duplicate, transitive, development-only, conflicting
and unavailable fixtures; every source record maps to one finding or a bounded
error while all paths remain visible.

### Tests for User Story 1

- [x] T011 [P] [US1] Write failing manifest/lockfile path and multi-version tests in `scripts/dependency-risk/paths.test.mjs`
- [x] T012 [P] [US1] Write failing runtime/development/build/template/deployment classification tests in `scripts/dependency-risk/classify.test.mjs`
- [x] T013 [P] [US1] Write failing inventory completeness and inaccessible-source tests in `scripts/dependency-risk/inventory.test.mjs`

### Implementation for User Story 1

- [x] T014 [US1] Implement manifest, generated-template and exact package-manager graph snapshot path extraction in `scripts/dependency-risk/paths.mjs`
- [x] T015 [US1] Implement source record deduplication while preserving provider assessments and paths in `scripts/dependency-risk/normalize.mjs`
- [x] T016 [US1] Implement artifact exposure, compatibility-cohort and conservative reachability classification in `scripts/dependency-risk/classify.mjs`
- [x] T017 [US1] Implement normalized private inventory plus sanitized summary generation in `scripts/dependency-risk/inventory.mjs`
- [x] T018 [US1] Add current cohort and public/generated artifact mappings in `dependency-cohorts.json` and validate them from `scripts/verify-compatibility.mjs`
- [x] T019 [US1] [SERVER] Collect GitHub alerts/update metadata, production/development audit, manifests, lockfile and SBOM snapshots into the private evidence directory using `scripts/dependency-risk/collect.mjs`
- [x] T020 [US1] [SERVER] Generate the initial normalized inventory and account for every user-reported problem or inaccessible source in `docs/security/dependency-status.md`

**Checkpoint**: No dependency upgrade begins until T020 identifies its exact
finding, path, cohort, affected artifacts and release impact.

---

## Phase 4: User Story 2 — Remediate Without Breaking Payment Guarantees (Priority: P2)

**Goal**: Remove or bound actionable risk through small cohort-aware candidates.

**Independent Test**: Each high/critical candidate removes the vulnerable path,
changes only its declared graph and preserves all affected payment contracts.

### Tests for User Story 2

- [x] T021 [P] [US2] Write failing intended-versus-actual manifest/lockfile delta tests in `scripts/dependency-risk/remediation.test.mjs`
- [x] T022 [P] [US2] Write failing unsupported override and cross-cohort migration tests in `scripts/dependency-risk/cohorts.test.mjs`
- [x] T023 [P] [US2] Write failing exception approval, expiry and compensating-control tests in `scripts/dependency-risk/exceptions.test.mjs`

### Implementation for User Story 2

- [x] T024 [US2] Implement remediation candidate and graph-delta verification in `scripts/dependency-risk/remediation.mjs`
- [x] T025 [US2] Implement override compatibility checks and explicit cross-cohort rejection codes in `scripts/dependency-risk/cohorts.mjs`
- [x] T026 [US2] Implement time-bounded exception validation and append-only lifecycle history in `scripts/dependency-risk/exceptions.mjs`
- [x] T027 [US2] Generate one ordered candidate per actionable finding with affected files, required checks and rollback in `docs/security/dependency-remediation-plan.md`
- [x] T028 [US2] Apply the first reachable critical/high candidate only to the manifests and `pnpm-lock.yaml` paths declared in `docs/security/dependency-remediation-plan.md` (not applicable: complete inventory contained zero critical/high candidates)
- [x] T029 [US2] Apply subsequent actionable candidates one cohort at a time, recording each isolated manifest/lockfile delta in `docs/security/dependency-remediation-plan.md`
- [x] T030 [US2] Update purpose, maintenance, ownership and license assessment for every changed runtime dependency in `docs/dependencies.md` and `docs/licenses.md`
- [x] T031 [US2] Add semantic-version, migration, changelog and rollback notes for public dependency contract changes in `CHANGELOG.md` and `docs/releases/`

**Checkpoint**: A vanished scanner alert does not complete a candidate; graph
and regression evidence are still required.

---

## Phase 5: User Story 3 — Prove Released Artifacts Remain Safe (Priority: P3)

**Goal**: Produce exact server-side evidence for graphs, artifacts, generated
projects and payment security after remediation.

**Independent Test**: Starting from one exact candidate revision, the server
produces matching commit/lockfile/artifact digests and passes all required
artifact and adversarial checks or reports `incomplete/failed`.

### Tests for User Story 3

- [x] T032 [P] [US3] Write failing evidence digest mismatch, unavailable check and false-pass tests in `scripts/dependency-risk/evidence.test.mjs`
- [x] T033 [P] [US3] Write failing workspace-versus-packed graph drift tests in `scripts/dependency-risk/artifact-graph.test.mjs`
- [x] T034 [P] [US3] Add dependency-change fixtures that require payment policy, finality, concurrency and restart-replay suites in `scripts/dependency-risk/payment-impact.test.mjs`

### Implementation for User Story 3

- [x] T035 [US3] Implement exact workspace and packed-artifact graph comparison in `scripts/dependency-risk/artifact-graph.mjs`
- [x] T036 [US3] Implement payment-boundary impact mapping to required adversarial suites in `scripts/dependency-risk/payment-impact.mjs`
- [x] T037 [US3] Implement commit, lockfile, inventory, environment and artifact digest evidence generation in `scripts/dependency-risk/evidence.mjs`
- [x] T038 [US3] [SERVER] Run frozen install, production/development audit, typecheck, affected tests and builds for each remediation candidate through `scripts/dependency-risk/server-verify.mjs`
- [x] T039 [US3] [SERVER] Pack candidate public packages and compare their dependency graphs with workspace intent using `scripts/dependency-risk/server-verify.mjs`
- [x] T040 [US3] [SERVER] Run npm/pnpm × supported HTTP quickstarts and separately labeled experimental MCP verification using `scripts/verify-clean-quickstarts.mjs`
- [x] T041 [US3] [SERVER] Run mapped policy/finality/concurrency/restart-replay and container/SBOM checks and record outcomes through `scripts/dependency-risk/server-verify.mjs`
- [x] T042 [US3] Review server evidence and publish only the sanitized candidate result in `docs/security/dependency-status.md`

**Checkpoint**: Only exact candidate artifacts with complete server evidence may
advance to a release gate.

---

## Phase 6: User Story 4 — Prevent Dependency Drift From Returning (Priority: P4)

**Goal**: Keep future signals actionable and block stale or unsupported risk.

**Independent Test**: Fixtures for a severe finding, stale exception, unsupported
cohort change and template drift all produce stable blocking codes.

### Tests for User Story 4

- [x] T043 [P] [US4] Write failing release-gate tests for severe findings, unavailable sources, stale exceptions and digest mismatch in `scripts/dependency-risk/gate.test.mjs`
- [x] T044 [P] [US4] Add maintained-example/generated-template drift fixtures in `scripts/dependency-risk/drift.test.mjs`

### Implementation for User Story 4

- [x] T045 [US4] Implement stable rule-by-rule dependency release gating in `scripts/dependency-risk/gate.mjs`
- [x] T046 [US4] Extend version drift checks across apps, packages, examples and generated templates in `scripts/verify-compatibility.mjs`
- [x] T047 [US4] Add sanitized dependency evidence and gate result to `scripts/generate-release-manifest.mjs`
- [x] T048 [US4] Require complete dependency evidence before package staging in `.github/workflows/release.yml`
- [x] T049 [US4] Configure dependency review to preserve actionable high-severity blocking and record summary evidence in `.github/workflows/dependency-review.yml`
- [x] T050 [US4] Document weekly triage, emergency isolation, exception review and ownership in `docs/security/dependency-operations.md`

---

## Phase 7: Cross-Cutting Validation and Return to Activation

- [x] T051 [P] Confirm all dependency-risk JSON and Markdown artifacts pass secret and private-provider metadata redaction in `scripts/scan-secrets.mjs`
- [x] T052 [P] Verify English/Spanish security claims remain equivalent in `scripts/verify-docs-parity.mjs`
- [x] T053 [SERVER] Execute every server step in `specs/005-dependency-risk-remediation/quickstart.md` and preserve the exact sanitized evidence reference in `docs/security/dependency-status.md`
- [x] T054 Re-run SpecKit consistency/convergence for feature 005 and record zero unclassified severe findings or explicit exceptions in `specs/005-dependency-risk-remediation/tasks.md` (2026-08-17: zero unclassified severe findings; no exceptions)
- [x] T055 Restore `.specify/feature.json` to `specs/004-self-service-activation` and resume its first incomplete task only after the dependency gate is passed or explicitly excepted

---

## Dependencies & Execution Order

- Setup T001–T004 precedes shared foundation T005–T010.
- US1 T011–T020 is the MVP and blocks all actual version changes.
- US2 begins only from the inventory produced by T020; candidates run
  sequentially by cohort even when their test tooling is parallelizable.
- US3 tooling can be built after foundation, but server candidate evidence
  depends on the corresponding US2 remediation.
- US4 gate implementation can proceed alongside candidate remediation but
  cannot be declared effective before US3 evidence exists.
- T055 returns work to feature 004 only after feature 005's security decision.

### Parallel Opportunities

- T002/T003, T005/T006, T011–T013, T021–T023, T032–T034 and T043/T044 affect
  separate files and can proceed in parallel.
- Collection adapters for independent sources can be implemented independently
  inside T007, but their output contract is shared.
- Heavy server tasks remain sequential per candidate to preserve causal graph
  and rollback evidence.

## Implementation Strategy

### MVP first

1. Complete setup and foundation with bounded local tests.
2. Complete US1 and run T019/T020 on the server.
3. Stop and review the actual inventory before editing any dependency version.

### Incremental remediation

1. Select the highest-priority reachable finding.
2. Create one candidate and expected graph delta.
3. Apply only that cohort's change.
4. Run server artifact/security evidence.
5. Merge or roll back before starting the next candidate.
6. Enable the durable release gate and return to feature 004.

## Notes

- `[SERVER]` tasks must not run in WSL.
- Tests are written and observed failing before their implementation.
- User-reported problems remain inventory inputs even if a provider returns zero.
- Never combine dependency remediation with unrelated product refactors.
