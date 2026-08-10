# Feature Specification: World-Class Agent Payments

**Feature Branch**: `002-world-class-agent-payments`

**Created**: 2026-08-10

**Status**: Draft

**Input**: User description: "Turn MeterKit from a strong grant-ready prototype into a world-class open-source agent-payment product that can compete with the best developer infrastructure through public distribution, exceptional onboarding, differentiated bounded agent spending, ecosystem integrations, independently verified adoption, professional trust, and a credible product identity."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Install and Reach a Payment Independently (Priority: P1)

An API or MCP developer discovers MeterKit, installs a public version, protects
one useful operation, and completes a finalized test payment to a wallet they
control without cloning the MeterKit repository or receiving maintainer code
changes.

**Why this priority**: Public, independent activation is the prerequisite for
adoption, feedback, funding, and every competitive claim.

**Independent Test**: Give a developer only the public package page and
quickstart. Measure whether they reach a valid challenge, finalized paid
response, durable receipt, Explorer evidence, and rejected replay.

**Acceptance Scenarios**:

1. **Given** a supported project and disposable devnet wallets, **When** the
   developer follows the primary quickstart, **Then** they protect an operation
   and receive a valid payment challenge within five minutes.
2. **Given** the valid challenge and sufficient test assets, **When** the client
   pays and retries, **Then** the provider receives payment directly and the
   protected result and verifiable receipt are returned within twenty minutes
   of starting.
3. **Given** a consumed proof, **When** it is reused, **Then** MeterKit rejects
   it without executing the protected operation again.
4. **Given** missing or invalid configuration, **When** diagnostics run,
   **Then** the developer receives a safe, actionable explanation without being
   asked to expose signing secrets.

---

### User Story 2 - Understand and Adopt the Right Integration (Priority: P2)

A developer can compare supported application surfaces, choose the recommended
path, copy a complete example, and understand payment states and operational
limits without reading MeterKit internals.

**Why this priority**: Great infrastructure wins when users can form a correct
mental model quickly and avoid integration forks.

**Independent Test**: Ask an unfamiliar developer to find the recommended path,
identify supported alternatives and limitations, and complete one maintained
example from the documentation.

**Acceptance Scenarios**:

1. **Given** the documentation home page, **When** a developer searches for an
   API, route-handler, or MCP integration, **Then** they reach a complete,
   version-matched guide in no more than three navigation actions.
2. **Given** multiple supported surfaces, **When** the developer compares them,
   **Then** the documentation identifies one recommended contract and explains
   compatibility, maturity, and migration status for every alternative.
3. **Given** a failed payment or dependency outage, **When** the developer opens
   the troubleshooting guide, **Then** they can distinguish configuration,
   balance, policy, settlement, unknown-finality, and replay failures.

---

### User Story 3 - Give an Agent a Safe Spending Budget (Priority: P3)

An agent operator grants a bounded, expiring, inspectable, and revocable USDC
budget that an autonomous client can use for approved API or MCP operations
without giving MeterKit custody or unrestricted wallet authority.

**Why this priority**: This is MeterKit's strongest product wedge beyond generic
payment middleware and directly serves autonomous software buyers.

**Independent Test**: Create a limited authorization, execute allowed and
disallowed purchases, inspect remaining capacity and receipts, revoke it, and
verify subsequent use is rejected.

**Acceptance Scenarios**:

1. **Given** an operator-defined amount, expiry, delegate, network, asset, and
   resource scope, **When** authorization is created, **Then** all limits are
   inspectable and the operator retains unilateral revocation control.
2. **Given** an active authorization, **When** an approved purchase stays within
   per-request and aggregate limits, **Then** it can settle and updates the
   remaining capacity and receipt history.
3. **Given** an expired, revoked, out-of-scope, wrong-asset, or over-budget
   attempt, **When** the agent requests payment, **Then** it is rejected before
   protected execution.
4. **Given** MeterKit's hosted services are unavailable, **When** the operator
   inspects or revokes an onchain authorization, **Then** wallet ownership and
   revocation remain available through the underlying public protocol.

---

### User Story 4 - Evaluate MeterKit as Professional Infrastructure (Priority: P4)

A security-conscious maintainer or company can verify supported versions,
threat boundaries, release provenance, compatibility, operational behavior,
performance limits, and rollback instructions before adopting MeterKit.

**Why this priority**: Trust and reproducibility determine whether a promising
tool becomes production infrastructure.

**Independent Test**: Starting from a release, a reviewer traces it to approved
source, reproduces mandatory gates, reviews its dependency inventory, runs
adversarial scenarios, and finds a documented recovery path.

**Acceptance Scenarios**:

1. **Given** a public release, **When** a reviewer inspects it, **Then** they can
   trace version, source revision, provenance, dependency inventory,
   compatibility, migrations, verification and rollback.
2. **Given** representative load and dependency failures, **When** the published
   validation is reproduced, **Then** latency, capacity, timeout, recovery and
   duplicate-execution behavior match declared limits.
3. **Given** a suspected vulnerability, **When** a reporter follows the security
   policy, **Then** they can disclose it privately and understand supported
   versions and response expectations.

---

### User Story 5 - Contribute and Validate Independent Adoption (Priority: P5)

An ecosystem developer can run the project, select bounded starter work, propose
an integration upstream, or participate in a consented pilot whose results are
reported without inflating traction.

**Why this priority**: Reputation and defensibility come from independent use,
useful upstream contributions, and trustworthy public evidence.

**Independent Test**: An external participant completes the contributor or
pilot journey using public instructions and produces a minimized, consented
record that another reviewer can reconcile.

**Acceptance Scenarios**:

1. **Given** a new contributor, **When** they choose a starter issue, **Then**
   they can reproduce the development environment, validation gates and review
   expectations without private instructions.
2. **Given** an external pilot, **When** the developer completes or abandons the
   journey, **Then** assistance level, activation stage, friction and consented
   evidence are recorded without secrets or unnecessary personal data.
3. **Given** an upstream contribution candidate, **When** it is proposed, **Then**
   it solves a bounded ecosystem problem, follows upstream governance, and does
   not require MeterKit-specific protocol forks.

### Edge Cases

- A public package name or organization scope is unavailable or disputed.
- A release succeeds but its provenance, documentation, or example versions do
  not match the distributed artifact.
- A quickstart user has SOL but no test USDC, test USDC but no SOL, an
  incompatible wallet, or a rate-limited public RPC.
- A facilitator supports x402 but not the selected Solana network or asset.
- A maintained framework changes its request or middleware lifecycle.
- A documentation search result leads to a deprecated or unsafe integration.
- An agent races concurrent purchases against the same remaining allowance.
- Revocation and a payment attempt land concurrently or finality remains
  unknown for an extended period.
- An external pilot requests hands-on implementation, declines telemetry, or
  provides incomplete evidence.
- An upstream project declines a contribution or takes longer than the feature
  deadline to review it.
- Benchmark results vary because of public infrastructure rather than MeterKit.
- A domain, brand name, social handle, or package name conflicts with another
  product.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: MeterKit MUST distribute a publicly installable, versioned primary
  SDK with verifiable origin and without repository workspace dependencies.
- **FR-002**: The public package set MUST have one documented ownership model,
  release policy, support policy, compatibility policy, and safe recovery
  procedure for a compromised or failed release.
- **FR-003**: The primary onboarding journey MUST cover installation,
  configuration diagnostics, challenge, payment, retry, protected response,
  durable receipt, finality, Explorer evidence, and replay rejection.
- **FR-004**: Onboarding MUST diagnose missing test assets, invalid network,
  asset, recipient, resource, facilitator or endpoint configuration without
  collecting user signing secrets.
- **FR-005**: MeterKit MUST provide a searchable documentation entry point with
  a recommended path, conceptual model, complete quickstarts, API reference,
  troubleshooting, security, operations, migration and limitations guidance.
- **FR-006**: Maintained integration surfaces MUST expose equivalent payment and
  security semantics and MUST identify their maturity and supported versions.
- **FR-007**: Every maintained example MUST run independently from public
  artifacts and MUST be validated against the full paid lifecycle rather than
  only an unpaid challenge.
- **FR-008**: MeterKit MUST provide a guided project initializer or equivalent
  onboarding assistant that produces a minimal working integration and explains
  every security-relevant choice.
- **FR-009**: Generated configurations MUST default to devnet, direct provider
  settlement, exact resource scope, bounded spending and no secret logging.
- **FR-010**: MeterKit MUST provide bounded, expiring, inspectable and revocable
  agent spending authorization with per-request and aggregate constraints.
- **FR-011**: Spending decisions MUST validate authorization owner, delegate,
  network, asset, recipient, resource scope, amount, expiry, remaining capacity,
  finality and unique consumption state as applicable.
- **FR-012**: Concurrent spending and revocation MUST not permit aggregate spend
  beyond the authorized limit or duplicate protected execution.
- **FR-013**: Operators MUST be able to inspect active authorization, remaining
  capacity, expiry, delegate, status, receipts and revocation evidence.
- **FR-014**: MeterKit MUST remain non-custodial and MUST NOT request, persist,
  transmit or log seed phrases, private keys, wallet-auth signatures, full
  payment payloads or unrestricted wallet authority.
- **FR-015**: Public transaction identifiers MAY appear only as intentional
  receipt and Explorer evidence and MUST remain distinguishable from prohibited
  signing material.
- **FR-016**: Public releases MUST identify exact source, changelog, semantic
  version impact, supported compatibility, provenance, dependency inventory,
  security results, migrations, health checks and rollback.
- **FR-017**: MeterKit MUST publish reproducible performance and resilience
  measurements with environment, workload, uncertainty and dependency effects
  clearly separated.
- **FR-018**: Critical flows MUST define bounded timeouts, retry behavior,
  recoverable unknown state, failure state, idempotency and sanitized
  observability.
- **FR-019**: The project MUST provide private vulnerability reporting,
  supported-version disclosure, response expectations and a documented release
  remediation process.
- **FR-020**: MeterKit MUST provide a discoverable contribution path, governance,
  contributor setup, review gates, roadmap and bounded starter work.
- **FR-021**: Ecosystem integrations MUST use public standards, preserve upstream
  semantics, follow upstream governance and remain optional to MeterKit core.
- **FR-022**: Pilot records MUST capture consent, assistance level, activation
  stages, friction, finalized test settlement and repeated-use outcome while
  minimizing personal data.
- **FR-023**: Public claims MUST distinguish implementation, internal validation,
  synthetic evidence, independent pilots, customers, revenue, cash funding,
  credits, upstream proposals and accepted upstream contributions.
- **FR-024**: Internal applications MAY serve as reference integrations but MUST
  NOT count as independent adoption, customer evidence or guaranteed growth.
- **FR-025**: Product naming and domain selection MUST include availability,
  confusion, package, repository, social, trademark and migration assessment
  before a public rename.
- **FR-026**: English and Spanish maintained product paths MUST preserve the same
  technical, security, compatibility and evidence claims.
- **FR-027**: No feature in this phase MAY require mainnet, real funds, custody,
  a token, trading, hidden fees or unverified adoption claims.
- **FR-028**: All locally controllable acceptance and adversarial requirements
  MUST have repeatable evidence before release; third-party outcomes MUST remain
  open until genuine evidence exists.
- **FR-029**: Generated projects MUST identify their MeterKit version, supported
  update path, removal path and any migration impact; initializer analytics MUST
  be absent by default and require explicit consent if introduced later.
- **FR-030**: Public documentation and onboarding interfaces MUST define
  responsive, keyboard, focus, contrast, heading, loading, empty, error,
  recovery and reduced-motion behavior.
- **FR-031**: Hosted metadata MUST be exportable and deletable according to a
  documented retention policy, and hosted-service failure MUST NOT remove the
  owner's protocol-native inspection or revocation rights.
- **FR-032**: Registry ownership, trusted-publisher setup, stage approval and
  emergency recovery actions that require the owner MUST remain explicit manual
  gates and MUST NOT be bypassed or represented as automated completion.
- **FR-033**: Every public interface MUST declare stability, semantic-version
  impact, deprecation period and migration path before an incompatible change.
- **FR-034**: Hosted entry points MUST define abuse limits, retry guidance and
  deterministic behavior for rate limiting without changing payment validity.

### Key Entities

- **Public Release**: A versioned distributable artifact with source,
  provenance, compatibility, verification and recovery metadata.
- **Integration Surface**: A maintained way to protect an operation, including
  maturity, supported versions, examples and lifecycle parity.
- **Developer Activation**: The ordered stages from discovery through first
  challenge, settlement, receipt, replay rejection and repeated use.
- **Agent Spending Authorization**: Owner-controlled permission bounded by
  delegate, asset, network, resources, amount, expiry and revocation state.
- **Payment Receipt**: Sanitized evidence connecting a requirement, decision,
  settlement state, protected resource and public transaction identifier.
- **Evidence Claim**: A public assertion classified by source and verification
  status so internal work cannot be mistaken for external traction.
- **Ecosystem Contribution**: A bounded proposal to an upstream project with
  governance, status and acceptance evidence.
- **Brand Candidate**: A possible product identity with availability, conflict,
  migration and ownership evidence.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: An unfamiliar developer reaches a valid payment challenge within
  five minutes using only public distribution and documentation.
- **SC-002**: At least 80% of observed pilot participants complete a finalized
  paid response and receipt within twenty minutes without maintainer code edits.
- **SC-003**: Every maintained integration surface passes the same challenge,
  settlement, protected-response, receipt and replay acceptance journey.
- **SC-004**: Three independent developers integrate MeterKit into software they
  control and pay their own provider wallets; at least two complete it without
  direct implementation assistance.
- **SC-005**: At least one independent integration completes ten valid test
  payments across seven days after activation.
- **SC-006**: Every tested wrong-network, wrong-asset, wrong-recipient,
  wrong-amount, out-of-scope, expired, revoked, over-budget, replay and
  concurrent-overspend attempt is rejected without duplicate protected work.
- **SC-007**: An operator can create, inspect and revoke a bounded agent budget
  in under three minutes and verify all three states using public evidence.
- **SC-008**: Documentation participants find the recommended integration,
  supported versions and relevant troubleshooting path in three navigation
  actions or fewer for at least 90% of tested scenarios.
- **SC-009**: Published resilience evidence demonstrates recovery from all
  declared dependency outages without false final failure or duplicate
  execution.
- **SC-010**: A release reviewer reproduces all mandatory gates and traces every
  distributed artifact to one approved source revision without maintainer-only
  information.
- **SC-011**: Publicly reported performance includes at least three workload
  levels and shows the supported operating envelope without unexplained failed
  or duplicated accepted requests.
- **SC-012**: At least one useful upstream contribution is publicly proposed;
  acceptance is reported only if and when upstream maintainers merge it.
- **SC-013**: All public technical and adoption claims reconcile to linked
  evidence, with zero secret exposures or overstated pilot, customer, revenue,
  funding or upstream status.
- **SC-014**: At least 80% of observed developers rate the onboarding and error
  recovery experience four or higher on a five-point usefulness scale.
- **SC-015**: A product-identity decision is backed by a documented conflict and
  migration assessment; no rename occurs solely for aesthetics.
- **SC-016**: Every declared initializer surface and package-manager combination
  either completes a clean generated-project validation or is rejected before
  writes as explicitly unsupported.
- **SC-017**: All public documentation and onboarding journeys pass desktop,
  mobile, keyboard, basic contrast, heading, console and reduced-motion review
  with no critical accessibility failure.
- **SC-018**: A user can export or request deletion of hosted pilot/payment
  metadata without affecting onchain payment or authorization evidence.

## Assumptions

- The initial competitive wedge remains non-custodial Solana agent payments,
  not generalized billing, a marketplace, or multichain expansion.
- Solana devnet and test assets are sufficient for this phase; mainnet remains
  outside scope without separate explicit authorization and review.
- Existing MeterKit payment, receipt, allowance and MCP foundations remain the
  baseline and will be evolved compatibly where possible.
- Public package ownership and trusted release credentials require an owner
  action that can be documented and automated but must not be bypassed.
- Framework and ecosystem targets will be prioritized by observed developer
  demand and maintainability, not raw integration count.
- External pilot completion and upstream acceptance depend on third parties and
  cannot be synthesized or guaranteed by an implementation deadline.
- The private reference application provides continuing internal dogfooding but
  is never external traction.
- Brand research may conclude that MeterKit should remain the name; a rename is
  an outcome only if evidence justifies it.
- This devnet phase publishes health and recovery evidence but does not promise a
  commercial uptime SLA; any hosted-service SLA requires a later operational
  specification backed by measured capacity and incident response.
