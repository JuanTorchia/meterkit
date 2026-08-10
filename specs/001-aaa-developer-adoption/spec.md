# Feature Specification: AAA Developer Adoption

**Feature Branch**: `main` (specification only; implementation uses focused pull requests)

**Created**: 2026-08-10

**Status**: Ready for planning

**Input**: Make MeterKit an AAA-quality, competitive, open-source product that developers can adopt independently; complete the paid x402 journey, expose bounded and revocable agent spending, build trust and distribution, and add an optional Webacy risk-policy integration without making the core dependent on a proprietary service.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Complete a Paid Endpoint Independently (Priority: P1)

An API developer discovers MeterKit, installs the public package, protects one
endpoint, and completes a test payment from challenge through protected response
and receipt without cloning or operating the MeterKit platform.

**Why this priority**: Independent end-to-end activation is the strongest missing
proof of product usability and is required before broader platform expansion.

**Independent Test**: Give the published quickstart to a developer unfamiliar
with the repository. The story succeeds when the developer receives a payment
challenge, completes a finalized test payment to a wallet they control, receives
the protected response, opens the receipt, and observes replay rejection.

**Acceptance Scenarios**:

1. **Given** a supported runtime and a test wallet address, **When** a developer follows the primary quickstart, **Then** the developer reaches a valid unpaid challenge in under five minutes.
2. **Given** the unpaid challenge and test funds, **When** the developer completes the guided payment, **Then** the original request returns the protected response and a verifiable finalized receipt in under twenty minutes from installation.
3. **Given** a settled payment proof, **When** it is submitted again, **Then** access is denied without executing the protected operation a second time.
4. **Given** an invalid network, mint, amount, recipient, origin, port, path, expiry, or finality state, **When** payment is attempted, **Then** access is denied with a safe and actionable explanation.

---

### User Story 2 - Adopt One Canonical Integration Path (Priority: P2)

A TypeScript developer can recognize one recommended MeterKit integration model
and use equivalent, production-shaped examples for an HTTP API, a web route, or
an MCP tool without first choosing among internal middleware variants.

**Why this priority**: Multiple overlapping entry points and incomplete examples
increase cognitive load and undermine confidence even when the implementation is
technically sound.

**Independent Test**: For each supported surface, a clean project can follow the
corresponding example and demonstrate the same challenge, payment, retry, receipt,
and rejection semantics using the documented public contract.

**Acceptance Scenarios**:

1. **Given** the package documentation, **When** a developer looks for the recommended integration, **Then** one primary entry point and its required configuration are unambiguous.
2. **Given** any maintained example, **When** its complete validation scenario is run, **Then** it proves the same security and receipt guarantees as the primary quickstart.
3. **Given** an existing consumer of an older public entry point, **When** the recommended interface is released, **Then** the consumer receives an explicit compatibility and migration policy rather than a silent break.

---

### User Story 3 - Operate and Audit Payments Confidently (Priority: P3)

A provider can understand why a payment was accepted, rejected, pending, or
unknown; correlate it with a sanitized receipt; and recover safely from RPC,
facilitator, database, or deployment failures.

**Why this priority**: Operational trust is MeterKit's defensible advantage over
a thin payment wrapper and is essential for real pilots.

**Independent Test**: A maintainer can induce each documented dependency failure,
observe the correct non-secret state and telemetry, restore the dependency, and
reconcile the transaction without false success, false definitive failure, or
duplicate protected execution.

**Acceptance Scenarios**:

1. **Given** a payment attempt, **When** a provider inspects its receipt, **Then** network, asset, amount, recipient, resource scope, decision, finality, timestamps, and Explorer destination are understandable without exposing secrets or complete signatures.
2. **Given** an unavailable dependency, **When** the result cannot be established safely, **Then** the attempt remains retryable or unknown according to a documented policy.
3. **Given** a released version, **When** a maintainer investigates it, **Then** the exact source commit, supported compatibility, dependency evidence, migrations, health checks, and rollback instructions are available.

---

### User Story 4 - Apply Optional Risk-Aware Payment Policies (Priority: P4)

An agent operator can optionally evaluate the payer, recipient, resource URL, or
prospective transaction with an external risk-intelligence provider before funds
move, then combine that result with spend and scope policies.

**Why this priority**: Risk-aware policy strengthens the agent-payment wedge and
may unlock Webacy credits and distribution, but it must not delay or control the
core payment path.

**Independent Test**: Enable the adapter in an otherwise working integration and
exercise allow, warn, deny, timeout, rate-limit, malformed-response, and provider-
unavailable scenarios. Disable it and demonstrate that the core remains fully
functional without importing, configuring, or contacting the provider.

**Acceptance Scenarios**:

1. **Given** an enabled policy and a low-risk decision, **When** the user permits payment, **Then** the payment continues and the receipt records the policy provider, decision, confidence, reason codes, and evaluation time.
2. **Given** a deny decision, **When** payment is considered, **Then** funds do not move and the operator receives an explainable result.
3. **Given** a provider timeout or unavailable service, **When** a policy is evaluated, **Then** the configured fail-open or fail-closed behavior is applied explicitly and recorded.
4. **Given** no risk provider configuration, **When** the core package runs, **Then** it behaves exactly as documented without external risk calls.

---

### User Story 5 - Validate Adoption and Build Community Trust (Priority: P5)

An external developer can assess project maturity, contribute safely, report a
problem, track releases, and join a bounded pilot whose outcomes are reported
without inflating internal usage into external traction.

**Why this priority**: Grants and technical quality create an opportunity, but
continued funding and reputation require independent adoption and credible open-
source participation.

**Independent Test**: Three independent developers attempt the public integration
under a documented pilot protocol; at least two complete it without direct code
changes by the maintainer, and all friction and outcomes are recorded truthfully.

**Acceptance Scenarios**:

1. **Given** a potential contributor, **When** they inspect the repository, **Then** supported versions, roadmap, governance, security reporting, contribution path, release history, and bounded starter issues are discoverable.
2. **Given** a pilot participant, **When** they complete or abandon integration, **Then** time-to-stage, failure category, assistance level, feedback, and evidence status can be recorded with consent and minimal personal data.
3. **Given** a public status or grant update, **When** adoption is reported, **Then** internal dogfooding, synthetic evidence, external pilots, customers, revenue, cash grants, and in-kind credits are distinguished.

### Edge Cases

- A URL is equivalent after normalization but contains encoded separators,
  dot-segments, a changed port, Unicode host ambiguity, or a malicious prefix.
- Two requests race to consume the same payment, challenge, idempotency key, or
  allowance.
- Settlement succeeds onchain but receipt persistence or the protected operation
  fails; retry behavior must not double-charge or execute twice.
- RPC nodes disagree, return null for an extended period, recover later, or report
  a real onchain error.
- A facilitator changes its supported protocol version or response contract.
- A quickstart user has no test SOL, has test USDC only, or selects mainnet.
- An external risk provider returns stale, low-confidence, contradictory,
  oversized, malformed, or privacy-sensitive data.
- A risk score changes between evaluation and settlement.
- The risk provider exhausts credits, rate-limits, times out, or is removed.
- An existing consumer imports a deprecated entry point during a release upgrade.
- Telemetry or evidence generation encounters credentials, personal data, or full
  signatures.
- A pilot participant does not consent to analytics or abandons before payment.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: MeterKit MUST provide one primary installation-to-payment journey that does not require cloning or operating the full MeterKit repository.
- **FR-002**: The primary journey MUST cover challenge, payment, retry, protected result, durable receipt, finality evidence, Explorer link, and replay rejection.
- **FR-003**: The primary journey MUST diagnose missing test assets, unsupported network, configuration errors, and unavailable dependencies without requesting private keys or seed phrases.
- **FR-004**: MeterKit MUST designate one recommended public integration interface and classify all other interfaces as advanced, compatible, deprecated, or internal.
- **FR-005**: Maintained examples MUST be complete, independently runnable, version-matched to published packages, and prove identical security semantics.
- **FR-006**: Public contract changes MUST include version impact, compatibility evidence, migration guidance, and a deprecation window when compatibility cannot be preserved.
- **FR-007**: Every payment decision MUST validate the expected network, asset, amount, recipient, normalized origin, port, resource path, expiry, finality, and unique consumption state.
- **FR-008**: MeterKit MUST preserve direct provider settlement and MUST NOT custody funds or handle user signing secrets.
- **FR-009**: Receipts MUST expose a stable sanitized representation of the payment requirement, decision, settlement state, timestamps, resource scope, and verification evidence.
- **FR-010**: Unknown infrastructure or chain state MUST remain distinguishable from accepted, rejected, and definitive onchain failure states.
- **FR-011**: Critical flows MUST have bounded dependency behavior, explicit recovery semantics, sanitized correlation, and enough evidence to reproduce a decision.
- **FR-012**: A release MUST identify its exact source revision, supported compatibility, dependency provenance, migration impact, verification results, health checks, and rollback procedure.
- **FR-013**: MeterKit MUST support optional pre-payment policy evaluation without changing core behavior when no provider is installed or configured.
- **FR-014**: Each external policy MUST declare evaluated subject, provider, decision, confidence when supplied, reason codes, freshness, timeout, and fail-open or fail-closed behavior.
- **FR-015**: A deny policy MUST prevent payment creation; a warning MUST require an explicit configured continuation rule; a provider error MUST follow the declared failure policy.
- **FR-016**: External policy data MUST be minimized, bounded, redacted, retained according to a documented policy, and excluded from telemetry when sensitive.
- **FR-017**: The product MUST expose bounded, expiring, and revocable agent spending controls and explain their relationship to per-request payments.
- **FR-018**: Public documentation MUST identify supported networks, assets, protocol versions, facilitators, surfaces, limitations, and security assumptions.
- **FR-019**: The repository MUST provide a discoverable contribution path, security reporting path, governance model, maintained roadmap, release notes, and starter work for contributors.
- **FR-020**: The pilot process MUST measure independent activation stages, assistance level, repeated use, failure reasons, and consent while minimizing personal data.
- **FR-021**: Public claims MUST distinguish implementation, verification, synthetic evidence, internal dogfooding, external pilots, customers, revenue, cash funding, and in-kind credits.
- **FR-022**: Webacy-specific capability MUST be delivered only as an optional adapter and MUST NOT be required by the core package, default quickstart, or existing consumers.
- **FR-023**: The Webacy grant application MUST describe API credits as in-kind support unless the sponsor explicitly confirms cash, and MUST not claim approval before evidence exists.
- **FR-024**: All critical success and adversarial scenarios MUST have automated evidence suitable for repeatable local or test-network verification.
- **FR-025**: User-facing journeys MUST define responsive, keyboard, contrast, loading, empty, error, recovery, and reduced-motion behavior.

### Key Entities

- **Integration Surface**: A maintained way to protect a resource, with lifecycle,
  compatibility status, examples, and supported capabilities.
- **Payment Policy**: A set of spend, resource, network, asset, recipient, expiry,
  finality, and optional risk rules evaluated before access.
- **Policy Decision**: An allow, warn, deny, or error result with source, reason,
  confidence, freshness, failure behavior, and sanitized evidence.
- **Payment Receipt**: Durable evidence linking a protected request, requirements,
  policy decisions, settlement, finality, response outcome, and Explorer location.
- **Compatibility Record**: Evidence for a MeterKit version against a protocol,
  network, facilitator, runtime, and integration surface.
- **Activation Attempt**: A consented pilot journey with anonymous participant ID,
  stage timestamps, assistance level, result, friction category, and evidence.
- **Release Evidence**: Exact revision, packages, provenance, security checks,
  migrations, deployment health, and rollback metadata for a release.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new developer reaches the first valid payment challenge within five minutes of starting the public quickstart.
- **SC-002**: A new developer completes a finalized paid response and opens its receipt within twenty minutes without a maintainer editing their project.
- **SC-003**: Three independent external developers complete payment to their own provider wallets; at least two do so without direct implementation assistance.
- **SC-004**: At least one external integration completes ten valid test payments within seven days of activation.
- **SC-005**: Every tested replay, wrong-network, wrong-asset, wrong-amount, wrong-recipient, out-of-scope resource, expired request, and definitive failed-transaction attempt is rejected without protected execution.
- **SC-006**: Every tested unknown dependency or finality condition remains recoverable and produces no false definitive onchain failure.
- **SC-007**: All maintained examples complete the same end-to-end acceptance journey from clean environments using published artifacts.
- **SC-008**: Existing supported consumers have a documented non-breaking path or migration guide before the recommended interface becomes generally available.
- **SC-009**: Disabling or removing the optional risk adapter changes no core payment acceptance result for equivalent input.
- **SC-010**: Allow, warn, deny, timeout, malformed-response, rate-limit, and provider-unavailable risk scenarios all produce the declared decision and sanitized receipt evidence.
- **SC-011**: No automated log, receipt, evidence bundle, test artifact, or pilot record contains private keys, seed phrases, bearer credentials, full signatures, or unapproved personal data.
- **SC-012**: A release reviewer can reproduce all mandatory quality gates and trace the deployed artifact to one exact approved revision.
- **SC-013**: All primary product journeys pass desktop and mobile visual review, keyboard navigation, basic contrast review, console inspection, and reduced-motion behavior.
- **SC-014**: A public product or funding update can be reconciled to evidence for every adoption, revenue, funding, security, and compatibility claim.

## Assumptions

- The initial target is a TypeScript developer monetizing an HTTP API, web route,
  or MCP tool on Solana devnet; local validator remains a supported test path.
- Published MeterKit packages, the current dashboard, gateway, database, and
  allowance/subscription capabilities remain the starting baseline.
- A disposable wallet can sign test payments on the developer's machine; MeterKit
  never receives its private material.
- External pilot activation is measured through explicit evidence and consent,
  not mandatory product telemetry.
- Risk intelligence is advisory policy input rather than KYC, legal advice, or an
  absolute statement that an address or transaction is safe.
- Webacy API credits, if awarded, are in-kind support; implementation proceeds only
  after contract and privacy review and never blocks the core roadmap.
- Mainnet deployment, real-fund spending, multi-chain expansion, a marketplace,
  token issuance, trading, and broad hosted billing are outside this feature.
- The first commercial offer remains a fixed-scope assisted integration; a broad
  SaaS plan requires evidence of repeatable external demand.
