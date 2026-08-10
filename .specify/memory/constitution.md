<!--
Sync Impact Report
- Version change: template -> 1.0.0
- Added principles:
  - I. Non-Custodial by Construction
  - II. Protocol-Native Interoperability
  - III. Security and Evidence First
  - IV. AAA Developer Experience
  - V. Activation Before Expansion
  - VI. Observable and Reproducible Operations
  - VII. Open Source Integrity and Truthful Claims
- Added sections:
  - Product and Technology Constraints
  - Delivery and Review Gates
- Removed sections: none (template placeholders replaced)
- Deferred TODOs: none
-->
# MeterKit Constitution

## Core Principles

### I. Non-Custodial by Construction

MeterKit MUST preserve direct settlement from client to provider and MUST NOT
hold, pool, intermediate, or control user funds. MeterKit MUST NOT request,
store, transmit, or log seed phrases, private keys, bearer credentials, or full
payment proofs. Fees MUST be explicit, independently verifiable, and disabled
by default in open-source deployments. Every authorization MUST remain bounded,
inspectable, and revocable by its owner. A change that weakens these guarantees
is prohibited rather than accepted as technical debt.

### II. Protocol-Native Interoperability

Public payment behavior MUST conform to current official x402, Solana, USDC,
Wallet Standard, and MCP contracts selected by the implementation plan.
MeterKit MUST extend upstream standards through policy, persistence,
observability, and developer experience rather than silently forking protocol
semantics. Supported versions, networks, facilitators, and deviations MUST be
documented and contract-tested. Proprietary integrations MUST be optional,
replaceable adapters and MUST NOT become prerequisites for the core SDK.

### III. Security and Evidence First

Every trust boundary MUST validate network, mint, amount, recipient, origin,
port, normalized resource scope, expiry, finality, and replay state as
applicable. Security-relevant changes MUST begin with adversarial acceptance
criteria and include automated tests for success, rejection, concurrency,
recovery, and duplicate use. Unknown infrastructure state MUST remain unknown;
it MUST NOT be converted into a false success or definitive onchain failure.
Claims of safety or compatibility MUST link to reproducible evidence. Mainnet
deployment or expenditure requires explicit owner authorization outside this
constitution.

### IV. AAA Developer Experience

MeterKit MUST expose one clearly recommended integration path before advanced
variants. Public examples MUST be copy-paste complete, typed, accessible, and
validated through the full paid lifecycle rather than stopping at an HTTP 402
challenge. Errors MUST identify the failing condition and a safe remediation
without leaking sensitive data. Installation, first challenge, settlement,
retry, protected response, receipt, and Explorer evidence MUST be documented as
one coherent journey. User-facing changes MUST meet responsive, keyboard,
contrast, loading, empty, failure, and recovery requirements.

### V. Activation Before Expansion

Work MUST prioritize a developer completing an independent integration and a
finalized test payment over new dashboards, marketplaces, chains, pricing
models, or speculative features. Each initiative MUST define one measurable
activation outcome, explicit exclusions, and an independently testable minimum
slice. Optional grants or partnerships MAY accelerate work only when they
strengthen the active product wedge and do not block the core path. Complexity
without observed user need requires written justification in the implementation
plan.

### VI. Observable and Reproducible Operations

Critical flows MUST emit structured, sanitized telemetry sufficient to explain
a payment decision without exposing secrets or complete signatures. Releases
MUST be traceable to an exact commit and include immutable dependency inputs,
software provenance, an SBOM, documented migrations, health checks, and a tested
rollback path. Local, CI, and deployed validation MUST use repeatable commands.
External dependency failures MUST have bounded timeouts, explicit retry or
circuit-breaker behavior, and documented fail-open or fail-closed semantics.

### VII. Open Source Integrity and Truthful Claims

Public APIs MUST follow semantic versioning, changelog, deprecation, license,
and contribution policies. Significant behavior or architecture changes MUST be
reviewable through a specification or proposal before implementation. English
and Spanish maintained documentation MUST preserve identical technical and
security claims. MeterKit MUST distinguish implemented, verified, synthetic,
internal dogfooding, external pilot, customer, revenue, cash grant, and in-kind
credit status. The project MUST NOT claim users, pilots, income, endorsements,
or funding that cannot be evidenced.

## Product and Technology Constraints

- The supported development network is Solana devnet or a local validator.
- USDC test assets MUST be separated from mainnet configuration by validation,
  environment, and documentation.
- TypeScript MUST remain strict. Boundary data MUST be schema-validated.
- Runtime dependencies MUST have a documented need, current compatibility,
  maintenance assessment, pinned compatible range, and license review.
- PostgreSQL is authoritative for durable challenges, receipts, replay state,
  idempotency, tenant metadata, and retention-sensitive records.
- SDK consumers MUST be able to self-host the critical payment path.
- Hosted services MUST preserve transparent direct settlement and data export.
- Risk intelligence providers, gas abstraction, analytics, and facilitators
  MUST be isolated behind explicit interfaces with deterministic fallback rules.
- No token issuance, investment advice, promised returns, custody, trading
  revenue, or hidden payment routing belongs in MeterKit.

## Delivery and Review Gates

Every feature MUST progress through specification, clarification when material
ambiguity remains, implementation planning, requirements-quality review,
dependency-ordered tasks, consistency analysis, implementation, and convergence.
The following gates are mandatory before merge or deployment when applicable:

1. Functional and adversarial acceptance criteria are mapped to tasks and tests.
2. Lint, strict typecheck, unit tests, build, and relevant end-to-end tests pass.
3. Payment changes include reproducible local-validator or devnet evidence.
4. Public contract changes include compatibility tests, migration notes, and
   semantic-version impact.
5. UI changes include desktop and mobile inspection, console review, and basic
   accessibility evidence.
6. Supply-chain changes pass dependency review, audit, CodeQL, secret scanning,
   SBOM generation, and container scanning where applicable.
7. Deployment occurs only from an exact CI-green commit with health checks and
   a documented rollback.
8. Documentation, examples, changelog, and maintained translations match the
   shipped behavior.

Pull requests MUST remain small enough to review and MUST separate unrelated
refactors, dependency updates, and product behavior. Exceptions require a
recorded rationale, owner approval, risk analysis, and time-bounded remediation;
no exception may override Principles I, III, or VII.

## Governance

This constitution supersedes conflicting project practices, specifications,
plans, tasks, grant requirements, and partner requests. Each specification and
pull request MUST record its constitution check. Reviewers MUST reject work that
violates a MUST statement or lacks evidence for a mandatory gate.

Amendments require a dedicated documentation change describing motivation,
affected principles, migration impact, and downstream templates or artifacts.
The project owner approves amendments. Versioning follows semantic versioning:

- MAJOR for removing or redefining a core guarantee incompatibly;
- MINOR for adding a principle or materially expanding governance;
- PATCH for non-semantic clarification.

Compliance MUST be reviewed during planning, before merge, and during release.
If implementation and specification diverge, work stops until the specification,
plan, and tasks are reconciled; passing tests alone does not waive governance.

**Version**: 1.0.0 | **Ratified**: 2026-08-10 | **Last Amended**: 2026-08-10
