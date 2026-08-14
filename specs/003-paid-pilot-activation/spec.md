# Feature Specification: Paid Pilot Activation

**Feature Branch**: `003-paid-pilot-activation`

**Created**: 2026-08-14

**Status**: Draft

**Input**: User description: "Design the next steps to earn the remaining grant tranche, validate paid external integrations, and evolve MeterKit beyond an x402-only message toward API monetization and bounded agent spending."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Complete an External Provider Pilot (Priority: P1)

An independent API or MCP provider can understand the assisted pilot offer, connect one endpoint, receive a finalized test payment directly in its own wallet, and verify the protected response and receipt without trusting MeterKit or surrendering custody.

**Why this priority**: An independently completed integration is the strongest missing evidence. It validates the existing product before additional capabilities are built and creates a concrete service that can be sold.

**Independent Test**: A provider unfamiliar with the repository can start from the public pilot entry point, protect one endpoint it controls, complete the documented payment journey, and submit a truthful completion record linked to independently verifiable evidence.

**Acceptance Scenarios**:

1. **Given** an independent provider with a supported API or MCP endpoint and a wallet it controls, **When** it follows the pilot journey, **Then** it can reach its first valid payment challenge within 15 minutes without sharing a private key.
2. **Given** a correctly integrated pilot endpoint, **When** a valid test payment is finalized, **Then** the provider receives the protected result and can verify the direct settlement, amount, recipient, network, product, and finality.
3. **Given** a previously consumed payment proof, **When** it is submitted again, **Then** access is rejected and the protected operation is not executed twice.
4. **Given** a completed integration, **When** the provider chooses whether to continue, **Then** MeterKit records consented feedback, support effort, intended continued use, and willingness to pay without presenting the provider as a customer unless payment occurred.

---

### User Story 2 - Operate and Export Settlement Evidence (Priority: P2)

An integrated provider can inspect and export its own settlement history so that payment events are useful for reconciliation, support, fulfillment, and a permitted pilot case study.

**Why this priority**: Providers need an operational outcome beyond receiving a payment. Portable evidence makes the hosted experience valuable while preserving the self-hosted and non-custodial boundary.

**Independent Test**: A provider with completed and failed payment attempts can view only its own records, filter them, and export a portable record whose totals and statuses match the independently verifiable source evidence.

**Acceptance Scenarios**:

1. **Given** a provider with settlements across multiple products and states, **When** it filters by time, product, and status, **Then** the displayed records and totals reflect only that provider's data.
2. **Given** a filtered settlement view, **When** the provider requests an export, **Then** it receives a portable file containing the visible records, clear units, timestamps, status, product identity, and redacted verification references.
3. **Given** an unknown or delayed finality state, **When** records are viewed or exported, **Then** the state remains unknown or pending rather than being reported as a success or failure.
4. **Given** a provider that withdraws permission for public attribution, **When** pilot evidence is retained, **Then** private operational evidence remains separated from public claims and no identifying case study is published.

---

### User Story 3 - Notify a Provider of Payment Outcomes (Priority: P3)

An integrated provider can configure a bounded notification destination and receive authenticated, retry-safe notifications when a settlement changes to an actionable state.

**Why this priority**: Notifications connect payment to fulfillment and automation, but they should follow successful pilot activation and must not delay the first external integration.

**Independent Test**: A provider registers a permitted notification destination, completes a payment, verifies the notification's authenticity, and observes that retries do not create distinct business events.

**Acceptance Scenarios**:

1. **Given** a verified provider and a permitted notification destination, **When** a settlement reaches a configured state, **Then** one identifiable business event is delivered with enough information to reconcile it to the provider's receipt.
2. **Given** a temporary delivery failure, **When** delivery is retried, **Then** every attempt carries the same event identity and the provider can process it idempotently.
3. **Given** an invalid, private, local, or disallowed destination, **When** the provider attempts to save it, **Then** it is rejected with a safe explanation.
4. **Given** a notification secret, **When** the destination is displayed, logged, exported, or used in support diagnostics, **Then** the secret is never revealed.

---

### User Story 4 - Delegate a Bounded Agent Budget (Priority: P4)

An agent operator can understand and demonstrate MeterKit's broader value by granting an agent a limited, expiring, inspectable, and revocable spending authorization for permitted paid tools.

**Why this priority**: This is the strongest differentiation beyond basic x402 payments, but it must build on evidence that providers can first integrate and operate the core payment journey.

**Independent Test**: An operator grants a test budget, observes permitted consumption, blocks an out-of-policy attempt, and revokes the remaining authorization without transferring custody to MeterKit.

**Acceptance Scenarios**:

1. **Given** an operator-controlled wallet, **When** the operator grants a bounded authorization, **Then** the amount, expiry, delegate, permitted scope, and revocation control are clear before approval.
2. **Given** an active bounded authorization, **When** an agent attempts a permitted purchase within all limits, **Then** the operator can trace the resulting consumption to the authorization and settlement.
3. **Given** a purchase that exceeds a limit, uses an unapproved provider, or occurs after expiry or revocation, **When** authorization is evaluated, **Then** payment is not approved and the denial reason is inspectable without exposing secrets.

### Edge Cases

- The provider can produce a payment challenge but settlement or finality cannot be determined because an external dependency is unavailable.
- A provider starts the pilot but requires maintainer intervention; the intervention time and failure stage must remain part of the activation record.
- The provider wallet, product, endpoint, or network changes after the pilot begins.
- Multiple settlement updates for the same receipt arrive out of order or are delivered more than once.
- An export is requested over a range with no records or enough records to require bounded processing.
- A notification destination redirects after validation, resolves to a disallowed address, times out, or returns conflicting success responses.
- A provider asks for deletion while immutable public settlement evidence still exists; MeterKit must explain what can be deleted and what cannot.
- The pilot participant is internal, synthetic, compensated, or otherwise not independent; the classification must remain explicit.
- A participant expresses willingness to pay but no commercial payment is received; it must not be counted as revenue or a customer.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: MeterKit MUST present one recommended assisted pilot journey for a provider to monetize one supported API or MCP endpoint.
- **FR-002**: The pilot journey MUST state its deliverables, supported environment, non-custodial boundary, expected participant effort, support boundary, and any price before the provider begins.
- **FR-003**: A pilot participant MUST be able to complete the core journey without giving MeterKit a seed phrase, private key, bearer credential, or control of provider funds.
- **FR-004**: MeterKit MUST verify network, asset, amount, recipient, product scope, expiry, finality, and replay state before reporting a successful protected execution.
- **FR-005**: MeterKit MUST preserve direct settlement from payer to provider and MUST NOT enable a hidden fee or implicit transfer.
- **FR-006**: MeterKit MUST record the pilot's start, activation stages, completion outcome, time to first challenge, time to first finalized settlement, support interventions, and participant classification.
- **FR-007**: MeterKit MUST distinguish internal tests, synthetic validations, independent pilots, paid integrations, customers, grant proceeds, and commercial revenue in every retained or published metric.
- **FR-008**: Public attribution, testimonials, and case studies MUST require explicit participant consent separate from technical participation.
- **FR-009**: A provider MUST be able to inspect only the products, payment attempts, settlements, and exports belonging to its authenticated identity.
- **FR-010**: A provider MUST be able to filter its settlement records by bounded date range, product, and settlement status.
- **FR-011**: A provider MUST be able to export the filtered settlement records in a documented portable format with unambiguous timestamps, amounts, units, states, and verification references.
- **FR-012**: Exports and provider views MUST preserve pending and unknown states and MUST NOT convert missing evidence into success or definitive failure.
- **FR-013**: Sensitive credentials, complete payment proofs, secrets, and unnecessary wallet data MUST be excluded from views, exports, logs, telemetry, and pilot reports.
- **FR-014**: A provider MAY configure authenticated event notifications for supported settlement state changes after the core pilot journey is operational.
- **FR-015**: Each notification event MUST have a stable identity, documented state and version, provider scope, occurrence time, and receipt reference sufficient for idempotent processing.
- **FR-016**: Notification delivery MUST use bounded attempts, expose delivery status to the owning provider, and prevent one failed destination from blocking settlement processing.
- **FR-017**: Notification destinations MUST be validated against network-access policy initially and at delivery time, including redirects and address resolution changes.
- **FR-018**: Notification signing secrets MUST be generated and handled as sensitive values, be replaceable, and never be retrievable in clear text after initial presentation.
- **FR-019**: The provider MUST be able to disable notifications immediately without deleting settlement history.
- **FR-020**: The agent-budget demonstration MUST show amount, expiry, delegate, permitted scope, consumed amount, remaining amount, and revocation status before the operator authorizes or relies on it.
- **FR-021**: A purchase outside an agent authorization's amount, time, provider, product, or revocation constraints MUST be denied without executing the protected operation.
- **FR-022**: Each independently testable priority MUST be releasable without requiring completion of lower-priority stories.
- **FR-023**: The remaining grant-tranche handoff MUST remain an applicant-controlled operational workstream and MUST NOT be represented as product adoption, a customer payment, or a dependency of the provider pilot.
- **FR-024**: MeterKit MUST provide a truthful summary of pilot conversion that includes starts, completed integrations, seven-day continued use, willingness-to-pay responses, paid integrations, and commercial revenue as separate measures.

### Key Entities

- **Pilot Engagement**: A consented evaluation by a classified participant, including offer, endpoint surface, activation stages, timing, interventions, outcome, continued-use signal, willingness-to-pay response, and attribution consent.
- **Provider Product**: The provider-owned API or MCP capability being monetized, including its public identity, price, resource scope, recipient, and supported environment.
- **Settlement Record**: The provider-scoped operational representation of a payment attempt and its verifiable lifecycle, including amount, asset, state, timing, product, and redacted verification reference.
- **Settlement Export**: A point-in-time portable projection of provider-visible settlement records and the filters, units, generation time, and schema version used to produce it.
- **Notification Subscription**: A provider-owned destination and selected event states, including enabled status, secret lifecycle metadata, delivery policy, and verification status.
- **Notification Event**: A versioned, provider-scoped statement that a settlement reached a particular state, with stable identity and delivery history.
- **Agent Authorization**: An operator-controlled spending permission with delegate, amount, expiry, permitted scope, consumption, remaining value, and revocation state.
- **Commercial Outcome**: A separately evidenced result of a pilot, such as no continuation, continued evaluation, expressed willingness to pay, paid integration, customer relationship, or received commercial revenue.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: At least three independent providers start a pilot and at least two complete a finalized test payment to a wallet they control.
- **SC-002**: The median time for an independent provider to reach its first correct payment challenge is under 15 minutes.
- **SC-003**: At least 90% of completed pilot settlements produce a matching provider-visible record with an independently verifiable amount, recipient, product, and finality state.
- **SC-004**: Reuse of an observed consumed payment proof results in zero duplicate protected executions across all pilot evidence.
- **SC-005**: Every pilot record is classified correctly, and public reporting contains zero instances of internal or synthetic activity being counted as external adoption, customers, or commercial revenue.
- **SC-006**: A provider can find and export a selected settlement record in under two minutes without maintainer assistance.
- **SC-007**: Exported totals and statuses match the corresponding provider-visible settlement set in 100% of acceptance samples.
- **SC-008**: When notifications are enabled, at least 95% of actionable test events reach a healthy destination within five minutes, while duplicate deliveries remain safely identifiable as the same business event.
- **SC-009**: At least one independent participant continues using its integrated endpoint seven days after activation or explicitly agrees to a paid next step.
- **SC-010**: At least one independent provider gives a concrete willingness-to-pay response; a paid integration is counted only after payment is received.
- **SC-011**: An operator can create, inspect, exercise, and revoke a bounded test authorization in under ten minutes, and all tested out-of-policy purchases are denied.
- **SC-012**: The remaining eligible grant tranche is submitted with the required applicant-controlled evidence without being included in commercial revenue or customer metrics.

## Assumptions

- The first commercial offer is an assisted integration for one endpoint rather than a self-service paid subscription.
- Solana devnet remains the only supported payment environment for this feature; enabling mainnet is explicitly out of scope.
- Express, Next.js route handlers, Hono, and MCP remain the supported surfaces; adding frameworks or chains is out of scope.
- Existing provider authentication, product registration, receipt indexing, payment protection, and wallet-controlled authorization capabilities are reused.
- Settlement export is part of the minimum operational pilot; event notifications begin only after at least one external pilot completes or a participant explicitly identifies them as blocking continued use.
- The existing bounded authorization capability is packaged and validated before inventing a new authorization protocol.
- The applicant has access to the official grant channel and privately controlled eligible receipts; KYC, wallet control, invoices, and submission remain outside the public product and repository.
- Pilot participation does not imply permission to publish identity, endorsement, transaction details, or a case study.
- The initial commercial hypothesis is a fixed integration fee, with recurring hosted pricing evaluated only after evidence of continued use.

## Out of Scope

- Mainnet activation or use of real customer funds.
- New chains, tokens, investment products, custody, exchange, yield, or hidden transaction fees.
- A marketplace for APIs or MCP tools.
- Additional framework adapters without observed pilot demand.
- Full invoicing, tax accounting, fiat checkout, or card payments.
- General-purpose wallet custody or autonomous control of operator keys.
- Public claims based on unconsented, internal, synthetic, or incomplete evidence.
