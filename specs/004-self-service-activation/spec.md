# Feature Specification: Self-Service Activation

**Feature Branch**: `[004-self-service-activation]`

**Created**: 2026-08-15

**Status**: Draft

**Input**: User description: "Make MeterKit trustworthy and independently installable before prioritizing a paid assisted service: a developer must be able to create, configure, run, verify, pay, and reject replay without cloning the monorepo or needing maintainer help; use a limited free beta to validate the path and keep USD 100 only as an optional implementation service."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Reach the First 402 Independently (Priority: P1)

An unfamiliar API or MCP developer starts from MeterKit's public entry point,
creates a supported project, supplies a disposable devnet recipient address,
runs the project, and observes a valid payment-required response without cloning
the MeterKit repository, installing its internal tooling, or contacting the
maintainer.

**Why this priority**: No brand, commercial offer, or advanced payment feature
can compensate for a broken first-run experience. This is the smallest external
activation that proves the public distribution is usable.

**Independent Test**: Give a clean supported development environment and only
the public quickstart URL to a person unfamiliar with MeterKit. They can create
and run one supported project and obtain a policy-valid HTTP 402 in under ten
minutes without maintainer intervention.

**Acceptance Scenarios**:

1. **Given** a developer has the documented prerequisites, **When** they run the recommended command without arguments, **Then** they can choose a project directory and supported surface and receive a usable generated project.
2. **Given** a developer prefers automation, **When** they provide every required option non-interactively, **Then** generation completes without prompts and honors the chosen package manager.
3. **Given** a generated project and a valid disposable devnet recipient, **When** the developer follows its displayed next steps, **Then** the service starts without undocumented environment handling and an unpaid request returns the expected HTTP 402 policy.
4. **Given** a required value is missing or invalid, **When** the developer starts or checks the project, **Then** the failure names the condition and provides a safe, directly actionable remedy.

---

### User Story 2 - Complete the Safe Payment Lifecycle (Priority: P2)

The developer continues from the generated project to a disposable devnet
payment, receives the protected response, verifies the settlement and receipt,
and confirms that reusing the same proof is rejected. This complete journey is
available from public releases and does not depend on scripts inside the
MeterKit monorepo.

**Why this priority**: A 402 alone proves challenge generation, not a useful or
safe paid endpoint. Independent settlement and replay rejection are the real
activation outcome.

**Independent Test**: Starting from a fresh generated project, a developer uses
only test assets and public tooling to complete one correlated payment, inspect
the finalized outcome, receive the protected response, and demonstrate zero
duplicate protected executions on replay.

**Acceptance Scenarios**:

1. **Given** the developer has a disposable payer with devnet test assets, **When** they follow the published payment path, **Then** the exact network, mint, amount, recipient and resource are checked before signing.
2. **Given** a valid payment finalizes, **When** the protected request completes, **Then** the developer can correlate the challenge, settlement, response and sanitized receipt without exposing a private key or complete proof.
3. **Given** a consumed payment proof, **When** it is submitted again, **Then** the request is rejected, the protected operation does not run again, and the recipient balance does not increase again.
4. **Given** a generated project is restarted, **When** an already consumed proof is replayed, **Then** the documented deployment-ready path preserves replay rejection rather than silently forgetting it.

---

### User Story 3 - Diagnose and Recover Without Support (Priority: P3)

A developer who encounters common devnet, wallet, token-account, endpoint,
policy, RPC, facilitator, dependency, or environment problems can identify the
failing prerequisite and recover through bounded, safe instructions.

**Why this priority**: Self-service is defined by recovery, not only by the
happy path. Actionable diagnosis reduces maintainer intervention and reveals
which external dependencies are actually blocking activation.

**Independent Test**: Introduce each documented failure condition separately.
The public diagnostic path identifies it, distinguishes unknown external state
from definitive failure, avoids secret disclosure, and supplies a remediation
that lets the developer continue.

**Acceptance Scenarios**:

1. **Given** configuration is missing or inconsistent, **When** diagnosis runs, **Then** each invalid field is reported without printing credentials or full payment material.
2. **Given** an external dependency is unavailable, **When** diagnosis runs, **Then** the result remains unknown or unavailable rather than reporting a false payment or policy failure.
3. **Given** the selected package manager or supported surface differs from the default, **When** the developer requests help, **Then** every displayed command remains valid for that selection.
4. **Given** setup is incomplete, **When** the developer reads generated or public guidance, **Then** expected output, reset/removal steps and a support escalation path are all available.

---

### User Story 4 - Evaluate a Trustworthy Free Beta (Priority: P4)

An early adopter can understand that the open-source self-service beta is free,
that MeterKit neither charges nor compensates beta testers, and that a separate
USD 100 done-for-you integration service is optional. They can inspect project
ownership, release, security, support, limitations and factual external
evidence before deciding whether to try it.

**Why this priority**: Clear commercial boundaries and verifiable project
identity prevent confusion while independent usage evidence is still being
built. Visual branding and a dedicated domain help only after the product path
is credible.

**Independent Test**: A visitor unfamiliar with MeterKit can explain the free
self-service beta, optional paid service, devnet-only limitation, maintainer and
support identity, and current external evidence without relying on private
context.

**Acceptance Scenarios**:

1. **Given** a visitor opens the primary public entry point, **When** they review the call to action, **Then** self-service beta participation is primary and the optional USD 100 implementation service is clearly separate.
2. **Given** no external activation or retention evidence exists, **When** public metrics or claims are shown, **Then** they report zero or unknown rather than implying adoption from downloads, clones, internal tests or automation.
3. **Given** a beta participant chooses to share evidence, **When** the record is collected, **Then** technical participation, private retention, follow-up and public attribution remain separate consent choices.
4. **Given** a visitor evaluates trust, **When** they inspect public project information, **Then** they can find release provenance, security disclosure, support expectations, maintainer identity, roadmap, limitations and factual case evidence when any exists.

### Edge Cases

- The requested output directory already exists, is non-empty, is read-only or
  contains a partially generated project.
- The command runs in an interactive terminal, a non-interactive shell, CI, or
  an unsupported runtime/package-manager version.
- Dependency installation is interrupted, unavailable, or fails a
  supply-chain policy.
- The recipient address is syntactically invalid, belongs to an unintended
  network context, or lacks a required test token account.
- Faucet, RPC, facilitator or Explorer is unavailable, slow, rate-limited or
  returns contradictory state.
- A payment finalizes after the client times out, or finality remains unknown.
- The project restarts between accepting a proof and receiving a replay.
- A user selects a different supported framework or package manager from the
  documentation's examples.
- The public package version and documentation drift after a new release.
- A beta participant requests private participation, withdraws attribution, or
  cannot use public issue reporting.
- Automated installs, CI downloads, repository clones or maintainer activity
  are observed but cannot be attributed to an external developer.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: MeterKit MUST present one primary self-service path from the public entry point through project creation, configuration, startup and a verified payment-required response.
- **FR-002**: The recommended creation command MUST succeed when used exactly as displayed and MUST support both guided interactive use and fully specified non-interactive use.
- **FR-003**: Project generation MUST require or safely derive a target directory, prevent unintended overwrite, and leave partial failures recoverable.
- **FR-004**: The generated project MUST honor the selected supported surface and package manager in project files, installation behavior and every displayed command.
- **FR-005**: The generated project MUST either install dependencies or explicitly obtain the user's choice to skip installation and MUST report the resulting state truthfully.
- **FR-006**: The generated project MUST load its documented configuration without undocumented shell-specific behavior and MUST validate the network, recipient and other payment-policy inputs before startup.
- **FR-007**: A fresh generated project MUST provide a directly executable unpaid request that returns a policy-valid HTTP 402 without requiring the MeterKit monorepo, PostgreSQL or Docker.
- **FR-008**: Publicly distributed tooling MUST allow a developer to validate policy, complete a disposable devnet payment, verify the protected response and settlement, and test replay rejection without using monorepo-only scripts.
- **FR-009**: Before any signing action, the developer MUST be shown and the system MUST enforce the exact network, asset, amount, recipient and protected resource.
- **FR-010**: MeterKit MUST NOT request, transmit, retain or log seed phrases, private keys, full payment proofs or unrelated credentials during creation, diagnosis, payment or evidence collection.
- **FR-011**: The self-service path MUST include a documented deployment-ready replay store whose state survives process restart; any in-memory demonstration path MUST be visibly labeled non-durable and unsuitable for deployment.
- **FR-012**: Reusing a consumed proof MUST cause zero duplicate protected executions and zero duplicate settlement acceptance, including after a restart on the deployment-ready path.
- **FR-013**: MeterKit MUST provide a public diagnostic flow covering runtime, dependencies, environment, endpoint reachability, policy, wallet readiness, token account, test assets, RPC, facilitator, settlement and replay state.
- **FR-014**: Diagnostic results MUST distinguish passed, failed, unavailable and unknown states and MUST give a safe remediation for each failed or unavailable prerequisite.
- **FR-015**: Error and diagnostic output MUST be actionable, bounded and sanitized, and MUST never convert unknown infrastructure state into success or definitive onchain failure.
- **FR-016**: Generated guidance and the canonical quickstart MUST include expected outputs, troubleshooting, reset/removal steps, and the point at which durable storage becomes mandatory.
- **FR-017**: Release validation MUST execute the literal public commands and artifacts a new user receives from the public registry in clean environments rather than substituting workspace-only packages or undocumented variables.
- **FR-018**: Release validation MUST cover every supported surface and declared package manager, including project creation, dependency installation, documented configuration, startup and first 402.
- **FR-019**: Documentation MUST identify a single canonical provider journey and MUST NOT claim an interactive choice, published tool, supported command, measured duration or deployment guarantee that the released artifact does not provide.
- **FR-020**: Maintained English and Spanish guidance MUST preserve equivalent setup, security, commercial and limitation claims; other published translations MUST not contradict them.
- **FR-021**: The primary public call to action MUST describe a bounded free self-service beta and MUST state that beta participants are neither charged nor compensated.
- **FR-022**: Any USD 100 offer MUST be presented only as a separate optional implementation service paid by the customer to MeterKit, never as a requirement for open-source use or compensation for testing.
- **FR-023**: MeterKit MUST publish factual maintainer, support, security, release, roadmap, devnet-only and current external-evidence information from the primary trust surfaces.
- **FR-024**: Download counts, repository traffic, stars, clones, internal runs and automated activity MUST NOT be represented as users, integrations, customers or retention.
- **FR-025**: Beta evidence MUST preserve participant classification and separate consent for technical participation, private evidence retention, follow-up, aggregate reporting and public attribution.
- **FR-026**: Product work beyond this feature MUST remain gated until independent self-service activation evidence identifies a specific blocking need.

### Key Entities

- **Generated Project**: A reviewable provider project created from a public release, including selected surface, package manager, release identity, configuration state, durability mode and executable next steps.
- **Activation Run**: One external developer's attempt from creation through first 402, payment, protected response and replay test, including timestamps, outcomes, intervention count and sanitized evidence references.
- **Diagnostic Finding**: A bounded check result with condition, state, safe remediation and optional sanitized evidence reference.
- **Beta Engagement**: A classified early-adopter evaluation with assistance mode, free-beta terms, scoped consents, activation outcome and follow-up eligibility.
- **Commercial Service Offer**: The optional, separately accepted done-for-you integration scope and disclosed customer-paid price; it is not implied by beta participation or open-source use.
- **Trust Evidence**: Publicly verifiable release, security, support, maintainer, transaction or consented external case information, with source and observation date.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: The literal primary creation command succeeds from a clean supported environment and produces a runnable project for every advertised surface and package-manager combination.
- **SC-002**: At least four of five unfamiliar external developers reach a valid first HTTP 402 using only the public journey, and at least three do so in under ten minutes.
- **SC-003**: At least two of five unfamiliar external developers complete a correlated devnet settlement, protected response and rejected replay in under thirty minutes without a critical maintainer intervention.
- **SC-004**: The median number of maintainer interventions among completed external activation runs is no more than one, with self-service and assisted outcomes reported separately.
- **SC-005**: Every tested missing, invalid or unavailable prerequisite produces a sanitized diagnostic state and an actionable recovery instruction; no tested unknown dependency state is reported as success.
- **SC-006**: Replay testing produces zero duplicate protected executions and zero duplicate accepted settlements before and after process restart on the deployment-ready path.
- **SC-007**: Public-release smoke validation detects any mismatch between documented commands, generated output, configuration loading and actual registry artifacts before release promotion.
- **SC-008**: Five external beta engagements are attempted and reported with starts, first-402 outcomes, settlements, completion, intervention count and unknown/abandoned states kept distinct.
- **SC-009**: At least three external developers complete installation, at least two complete without critical intervention, and at least one independently verifiable external settlement exists before paid implementation becomes the primary experiment.
- **SC-010**: Seven-day continued use is reported only among eligible consenting completed participants, with retained, removed, unknown and ineligible counts shown separately.
- **SC-011**: In a comprehension check, all five beta candidates correctly identify that self-service is free, testers are not compensated, the USD 100 service is optional, and the environment is devnet-only.
- **SC-012**: Public trust surfaces contain no known contradictions about published packages, supported commands, pricing direction, participant compensation, external adoption or production readiness.

## Assumptions

- The initial audience is a developer familiar with a supported JavaScript or
  TypeScript server surface but unfamiliar with MeterKit.
- The first 402 path may use a clearly labeled in-memory demonstration store;
  accepting and replay-protecting payments requires the documented durable
  path.
- Solana devnet and faucet assets remain the only payment environment in scope;
  mainnet enablement is excluded.
- A disposable public recipient address is acceptable input; MeterKit never
  generates, imports or receives the participant's private signing material.
- The beta is free and limited to five external design partners. Optional
  maintainer support may be offered for observation, but unassisted outcomes are
  measured separately.
- The USD 100 implementation service remains visible only as a secondary option
  and is not counted as revenue until payment is verified as received.
- A dedicated domain, visual identity work and contribution growth are useful
  trust improvements but follow the functional self-service path and factual
  external evidence.
- Existing release provenance, security policy, CI, devnet infrastructure and
  consented pilot evidence model are reused.
- Analytics are opt-in or aggregate and cannot be used to infer external users
  from automated downloads, clones or internal traffic.
