---
description: "Dependency-ordered tasks for paid pilot activation"
---

# Tasks: Paid Pilot Activation

**Input**: Design documents from `specs/003-paid-pilot-activation/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`,
`contracts/`, `quickstart.md`

**Tests**: Required by the MeterKit constitution for payment, tenant, export,
notification, consent and authorization behavior. Test tasks precede their
implementations and must fail for the intended reason before production changes.

**Organization**: Tasks are grouped by user story so each increment can be
implemented and validated independently. Notifications remain gated by external
activation or explicit pilot demand.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel because it modifies different files and has no
  dependency on another incomplete task in the same phase.
- **[Story]**: Maps the task to US1, US2, US3 or US4 from `spec.md`.
- Every task names the exact file or directory it changes.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish versioned contracts and migration/test scaffolding without
changing runtime behavior.

- [x] T001 Add pilot and settlement contract exports and schema version constants to `packages/core/src/index.ts`
- [x] T002 [P] Create the shared pilot and settlement test fixtures used by later failing tests in `packages/core/src/pilot-activation.test.ts` and `packages/database/src/settlements.test.ts`
- [x] T003 [P] Add migration `007_paid_pilot_activation.sql` to the ordered migration list and idempotency test fixtures in `packages/database/src/index.ts` and `packages/database/src/index.test.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Define shared sanitized identities, classifications and database
boundaries required by all four stories.

**⚠️ CRITICAL**: No user story implementation begins until this phase passes.

- [x] T004 Write failing schema tests for settlement projections, pilot classifications, scoped consent and commercial/funding outcomes in `packages/core/src/pilot-activation.test.ts`
- [x] T005 Implement versioned shared schemas for provider settlements, pilot evidence and commercial/funding classification in `packages/core/src/pilot-activation.ts` and export them from `packages/core/src/index.ts`
- [x] T006 Add `product_uid` tenant linkage and pilot v2 tables with checks, foreign keys and bounded indexes in `packages/database/migrations/007_paid_pilot_activation.sql`
- [x] T007 Extend database store interfaces with owner-scoped settlement and pilot types without implementing routes in `packages/database/src/index.ts`
- [x] T008 Add config validation for pilot and export bounds without introducing notification configuration in `apps/gateway/src/config.ts` and `apps/gateway/src/config.test.ts`

**Checkpoint**: Shared contracts compile, migration is repeatable, and boundary
tests pass before story-specific behavior begins.

---

## Phase 3: User Story 1 - Complete an External Provider Pilot (Priority: P1) 🎯 MVP

**Goal**: Publish one disclosed assisted offer and produce truthful, consented
external activation evidence through settlement, protected response and replay
rejection while keeping grant and commercial facts separate.

**Independent Test**: An unfamiliar provider can start from `/pilots`, integrate
one endpoint, create a v2 local report, record the required evidence and derive
completion; internal/synthetic reports and missing consent cannot complete.

### Tests for User Story 1

- [x] T009 [P] [US1] Write failing v2 activation state, classification, consent, intervention, retention and v1 compatibility tests in `packages/pilot/src/activation-v2.test.ts`
- [x] T010 [P] [US1] Write failing CLI tests for v2 init, stage recording, minimized export, withdrawal and commercial/grant separation in `packages/pilot/src/cli.test.ts`
- [x] T011 [P] [US1] Write failing browser acceptance tests for disclosed offer, readiness-to-pilot journey and consent boundaries in `tests/e2e/pilots.spec.ts`
- [x] T012 [P] [US1] Write failing persistence tests for append-only activation events, owner isolation and consent withdrawal in `packages/database/src/pilot-engagements.test.ts`

### Implementation for User Story 1

- [x] T013 [P] [US1] Implement v2 PilotEngagement, ActivationEvent, SupportIntervention, ConsentGrant, RetentionObservation and WillingnessToPay helpers in `packages/pilot/src/activation-v2.ts`
- [x] T014 [P] [US1] Preserve v1 parsing and add explicit non-upgrading compatibility conversion in `packages/pilot/src/activation.ts`
- [x] T015 [US1] Add v2 pilot CLI commands for engagement creation, stage/intervention capture, consent withdrawal, day-seven observation and minimized evidence export in `packages/pilot/src/cli.ts`
- [x] T016 [US1] Export the v2 pilot contract while preserving existing public exports in `packages/pilot/src/index.ts`
- [x] T017 [US1] Implement pilot engagement/event/consent persistence and derived activation metrics in `packages/database/src/index.ts`
- [x] T018 [US1] Add authenticated consented pilot ingestion and owner-scoped summary endpoints to `apps/gateway/src/server.ts`
- [x] T019 [P] [US1] Rewrite the assisted pilot offer, price disclosure, participant effort and truthful classifications in `apps/web/app/pilots/page.tsx` and `apps/web/app/pilots/pilots.module.css`
- [x] T020 [P] [US1] Document the v2 pilot journey, consent scopes and evidence deletion limits in `docs/pilot-program.md` and `docs/pilot-evidence.md`
- [ ] T021 [US1] Run and record the US1 independent journey, intervention time and truthful classification in `docs/pilots/README.md` without claiming a pilot until external evidence exists
- [x] T022 [US1] Derive starts, completions, support time, day-seven eligibility and willingness-to-pay counts from consented evidence in `packages/pilot/src/activation-v2.ts` and `packages/pilot/src/activation-v2.test.ts`

**Checkpoint**: US1 is deployable as the MVP. Stop here to recruit and observe at
least one real participant before treating later product work as validated.

---

## Phase 4: User Story 2 - Operate and Export Settlement Evidence (Priority: P2)

**Goal**: Give each provider a tenant-isolated settlement workspace with exact
pending/unknown states, bounded filtering and matching JSON/CSV exports.

**Independent Test**: Two providers can use the same product slug and see/export
only their own frozen settlement set; filters, cursors, totals, empty exports and
unknown states remain correct.

### Tests for User Story 2

- [ ] T023 [P] [US2] Write failing monotonic receipt transition and immutable product UID linkage tests in `packages/database/src/settlements.test.ts`
- [ ] T024 [P] [US2] Write failing cross-tenant, filter, cursor, snapshot, 90-day and 10,000-record query tests in `packages/database/src/settlements-query.test.ts`
- [ ] T025 [P] [US2] Write failing JSON/CSV contract tests for exact totals, empty export, quoting and formula-injection defense in `apps/gateway/src/settlement-export.test.ts`
- [ ] T026 [P] [US2] Write failing API authentication, cursor mismatch and cache/header tests in `apps/gateway/src/server.test.ts`
- [ ] T027 [P] [US2] Write failing provider filter/export browser journeys at desktop and mobile sizes that enforce the two-minute completion threshold in `tests/e2e/dashboard.spec.ts`

### Implementation for User Story 2

- [ ] T028 [P] [US2] Implement provider settlement and canonical export projections in `packages/core/src/settlements.ts` and export them from `packages/core/src/index.ts`
- [ ] T029 [US2] Implement monotonic rich receipt persistence linked through `product_uid` and safe legacy backfill behavior in `packages/database/src/index.ts`
- [ ] T030 [US2] Implement owner-first filtered cursor queries, frozen summaries and export bounds in `packages/database/src/index.ts`
- [ ] T031 [P] [US2] Implement the fixed-schema CSV serializer with exact atomic strings and spreadsheet neutralization in `apps/gateway/src/settlement-export.ts`
- [ ] T032 [US2] Add authenticated `GET /v1/settlements` and `/v1/settlements/export` routes matching `contracts/settlement-api.md` in `apps/gateway/src/server.ts`
- [ ] T033 [US2] Connect payment acceptance and finality reconciliation to rich settlement transitions without weakening replay storage in `apps/gateway/src/server.ts` and `apps/gateway/src/finality.ts`
- [ ] T034 [US2] Replace the provider payment list with settlement filters, literal state display, pagination and JSON/CSV download controls in `apps/web/app/dashboard-client.tsx`
- [ ] T035 [P] [US2] Add responsive settlement/export styles and accessible loading, empty, error and recovery states in `apps/web/app/styles.css`
- [ ] T036 [P] [US2] Document settlement states, filters, units, CSV safety and reconciliation in `content/docs/en/concepts.mdx` and `content/docs/es/concepts.mdx`
- [ ] T037 [US2] Record tenant-isolation, snapshot and export evidence and measure that at least 90% of completed pilot settlements have matching verifiable provider records in `specs/003-paid-pilot-activation/quickstart.md` and `scripts/verify-pilot-settlement-coverage.mjs`

**Checkpoint**: US2 operates independently for any authenticated provider even
if notification delivery is never enabled.

---

## Phase 5: User Story 3 - Notify a Provider of Payment Outcomes (Priority: P3)

**Goal**: Deliver authenticated, retry-safe settlement events to verified public
HTTPS destinations without blocking payments or exposing secrets.

**Independent Test**: A provider verifies a destination, validates exact-body
HMAC, receives one stable event identity across retries, rotates its secret and
disables further delivery; SSRF and concurrency cases remain rejected.

**Activation Gate**: Begin this phase only after one completed external pilot or
documented participant feedback that notifications block continued use.

### Tests for User Story 3

- [ ] T038 [US3] Record and validate the activation-gate evidence or explicit blocking request before any other US3 task begins in `docs/pilots/notification-gate.md`
- [ ] T039 [P] [US3] Write failing raw-body HMAC, timestamp tolerance and rotation-overlap tests in `apps/gateway/src/webhook-signature.test.ts`
- [ ] T040 [P] [US3] Write failing URL policy, mixed A/AAAA, DNS rebinding, TLS hostname, proxy and redirect tests in `apps/gateway/src/webhook-transport.test.ts`
- [ ] T041 [P] [US3] Write failing transactional outbox, stable identity, retry classification, disable and multi-worker claim tests in `apps/gateway/src/webhook-delivery.test.ts`
- [ ] T042 [P] [US3] Write failing subscription API ownership, one-time secret and rotation tests in `apps/gateway/src/server.test.ts`
- [ ] T043 [P] [US3] Write failing notification configuration and recovery browser journeys in `tests/e2e/dashboard.spec.ts`

### Implementation for User Story 3

- [ ] T044 [P] [US3] Implement exact-byte HMAC signing, constant-time verification fixtures and dual-key rotation headers in `apps/gateway/src/webhook-signature.ts`
- [ ] T045 [P] [US3] Implement HTTPS-only DNS-pinned transport with per-attempt revalidation, no redirects/proxies and bounded responses in `apps/gateway/src/webhook-transport.ts`
- [ ] T046 [US3] Implement encrypted one-time webhook secret creation, fingerprint display, rotation overlap and retirement in `apps/gateway/src/webhook-secrets.ts`
- [ ] T047 [US3] Implement versioned notification schemas, add an independently deployable migration 008, and implement atomic settlement-event insertion plus subscription/secret/event/delivery stores in `packages/core/src/notifications.ts`, `packages/core/src/index.ts`, `packages/database/migrations/008_settlement_notifications.sql`, `packages/database/src/index.ts`, and `packages/database/src/index.test.ts`
- [ ] T048 [US3] Implement bounded outbox claiming, retry classification, stable event IDs and sanitized delivery outcomes in `apps/gateway/src/webhook-delivery.ts`
- [ ] T049 [US3] Add subscription create/verify/list/rotate/disable and delivery-status routes matching `contracts/webhook-delivery.md` in `apps/gateway/src/server.ts`
- [ ] T050 [US3] Start and stop the bounded delivery worker with gateway lifecycle, health identity and safe configuration in `apps/gateway/src/server.ts` and `apps/gateway/src/build-identity.ts`
- [ ] T051 [US3] Add destination verification, one-time secret, rotation, disable and delivery-state controls in `apps/web/app/dashboard-client.tsx`
- [ ] T052 [P] [US3] Document receiver verification, idempotency, retries, rotation and SSRF restrictions in `content/docs/en/concepts.mdx` and `content/docs/es/concepts.mdx`
- [ ] T053 [US3] Record signed delivery, failure recovery and zero payment-path blocking evidence in `specs/003-paid-pilot-activation/quickstart.md`

**Checkpoint**: US3 is independently operable and removable without changing
settlement correctness or provider receipt access.

---

## Phase 6: User Story 4 - Delegate a Bounded Agent Budget (Priority: P4)

**Goal**: Repackage and independently validate the existing owner-controlled
allowance lifecycle as MeterKit's product differentiation beyond basic x402.

**Independent Test**: An operator creates, inspects, spends within scope, denies
over-limit/wrong-provider/expired attempts and revokes an authorization in under
ten minutes without MeterKit controlling the wallet.

### Tests for User Story 4

- [ ] T054 [P] [US4] Extend failing authorization view tests for remaining amount, provider/resource scope and denial reason in `apps/gateway/src/authorization.test.ts`
- [ ] T055 [P] [US4] Extend failing browser tests for create/inspect/deny/revoke and unknown recovery states in `tests/e2e/allowances.spec.ts`
- [ ] T056 [P] [US4] Add a failing independent evidence fixture test that enforces the ten-minute threshold for the complete allowance journey in `examples/subscriptions-client/src/verify-agent-budget-devnet.test.ts`

### Implementation for User Story 4

- [ ] T057 [US4] Complete the hosted authorization projection and denial metadata using existing protocol state in `apps/gateway/src/authorization.ts`
- [ ] T058 [US4] Connect provider/resource scope and exact remaining capacity to the allowance routes without changing onchain authority in `apps/gateway/src/server.ts`
- [ ] T059 [US4] Refine the allowance workspace to explain limits, remaining budget, expiry, scope, revocation and unknown state in `apps/web/app/agent/allowances/page.tsx`
- [ ] T060 [P] [US4] Update the runnable independent agent-budget evidence journey in `examples/subscriptions-client/src/verify-agent-budget-devnet.ts` and `examples/subscriptions-client/README.md`
- [ ] T061 [P] [US4] Position MeterKit as provider monetization plus bounded agent spending with claim-equivalent language in `apps/web/app/page.tsx`, `content/docs/en/index.mdx`, and `content/docs/es/index.mdx`
- [ ] T062 [US4] Record create/spend/deny/revoke devnet evidence, elapsed operator time under ten minutes and limitations in `specs/003-paid-pilot-activation/quickstart.md`

**Checkpoint**: All four stories are independently demonstrable; US4 adds a
broader product wedge without becoming a prerequisite for provider settlements.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Reconcile artifacts, verify all constitutional gates and prepare a
truthful release or pilot deployment.

- [ ] T063 [P] Reconcile English/Spanish claims, navigation and lifecycle documentation in `content/docs/en/`, `content/docs/es/`, and `docs/brand-localization.md`
- [ ] T064 [P] Add structured sanitized telemetry and retention/cleanup coverage for pilot, export and delivery records in `apps/gateway/src/server.ts` and `packages/database/src/index.ts`
- [ ] T065 Add migration, worker, encryption-key and deployment rollback procedures in `docs/operations.md` and `docs/releases/0.3.0.md`
- [ ] T066 Run formatting, lint, typecheck, tests, build, docs parity and relevant E2E gates and record exact-commit results in `specs/003-paid-pilot-activation/quickstart.md`
- [ ] T067 Run dependency audit, CodeQL, secret scan, SBOM and container scans and record only sanitized outcomes in `docs/audit.md`
- [ ] T068 Inspect desktop/mobile UI, keyboard, focus, contrast, reduced motion, loading/error recovery and console output and record evidence in `specs/003-paid-pilot-activation/quickstart.md`
- [ ] T069 Reconcile implementation against `spec.md`, `plan.md`, `tasks.md` and the constitution, appending any genuine remainder to `specs/003-paid-pilot-activation/tasks.md`
- [ ] T070 Publish only evidenced pilot, retention, willingness-to-pay, paid-integration, commercial-revenue and grant statuses in `docs/business-model.md`, `docs/roadmap.md`, and `CHANGELOG.md`
- [ ] T071 Update the funding record and second-tranche handoff checklist only after applicant verification, keeping private KYC/invoices outside Git and outside the MVP dependency graph, in `docs/funding.md` and `docs/agentic-grant-pack/11-APPROVAL-AND-TRANCHES.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Starts immediately.
- **Foundational (Phase 2)**: Depends on Phase 1 and blocks every user story.
- **US1 (Phase 3)**: Starts after Phase 2 and is the MVP.
- **US2 (Phase 4)**: Starts after Phase 2; can be built independently but is
  validated commercially through US1 pilots.
- **US3 (Phase 5)**: Starts after Phase 2 technically, but its explicit activation
  gate requires one completed external pilot or blocking participant demand.
- **US4 (Phase 6)**: Starts after Phase 2 and reuses existing allowance code; it
  does not depend on US2 or US3.
- **Polish (Phase 7)**: Runs after the set of stories selected for release.

### User Story Dependency Graph

```text
Setup → Foundation → US1 (MVP external activation)
                   ├── US2 (settlement operations)
                   ├── US4 (agent-budget positioning)
                   └── [external activation gate] → US3 (notifications)

Selected stories → Polish / release evidence
```

### Within Each User Story

- Write contract/adversarial tests first and verify the expected failure.
- Add schemas/migrations before store services.
- Add store services before routes/workers.
- Add runtime behavior before UI and documentation evidence.
- Finish the independent test at each checkpoint before starting a dependent
  commercial claim or later gated story.

### Parallel Opportunities

- T002 and T003 can run in parallel after T001.
- US1 tests T009–T012 can run in parallel; T013, T014 and T019–T020 use separate
  files and can run concurrently after failing tests exist.
- US2 tests T023–T027 can run in parallel; T028 and T031 can run alongside the
  database work; T035 and T036 can run after the UI/API contract stabilizes.
- US3 tests T039–T043 can run in parallel only after T038 passes; signature and transport
  implementations T044–T045 can run concurrently before delivery integration.
- US4 tests T054–T056 and documentation/positioning T060–T061 use separate files.

---

## Parallel Examples

### User Story 1

```text
Task T009: v2 activation state and compatibility tests
Task T011: pilot browser acceptance tests
Task T012: pilot persistence and isolation tests
```

### User Story 2

```text
Task T023: monotonic settlement transition tests
Task T025: JSON/CSV export contract tests
Task T027: provider browser journey tests
```

### User Story 3

```text
Task T039: HMAC and rotation tests
Task T040: DNS-pinned transport/SSRF tests
Task T041: outbox concurrency and retry tests
```

### User Story 4

```text
Task T054: authorization projection tests
Task T055: allowance browser tests
Task T056: independent evidence fixture test
```

---

## Implementation Strategy

### MVP First: User Story 1

1. Complete Setup and Foundation.
2. Complete US1 through T022.
3. Validate the independent provider journey.
4. Recruit three external starts and seek two completed integrations.
5. Process T071 and submit the remaining eligible grant tranche as a separate,
   non-blocking applicant action.
6. Do not claim adoption or revenue until the evidence contract permits it.

### Incremental Delivery

1. **MVP**: assisted pilot + truthful evidence.
2. **Operational product**: settlement filters and portable exports.
3. **Demand-gated automation**: signed notifications only when the gate passes.
4. **Differentiation**: independently validated bounded agent budget.
5. **Commercial decision**: day-seven observation and exact-price willingness to
   pay determine whether to prioritize hosted recurring service or integrations.

### Recommended Stop/Go Gates

- Stop after US1 if no independent provider will begin despite direct outreach;
  revise the offer before adding product scope.
- Stop before US3 if no completed participant requests automation.
- Continue hosted operations if at least one participant retains use or agrees
  to a paid next step; otherwise test a narrower integration-service offer.

## Notes

- `[P]` means file-level independence, not permission to skip prerequisites.
- External submissions, KYC, wallet control, invoices and payments remain user
  actions; repository tasks prepare truthful artifacts but do not impersonate the
  applicant or expose private evidence.
- Never commit wallet keys, webhook clear secrets, complete payment proofs or
  private grant documents.
- Commit after each task or cohesive test/implementation pair and preserve exact
  evidence classification throughout.
