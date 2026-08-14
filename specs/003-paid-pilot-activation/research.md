# Research: Paid Pilot Activation

## Decision 1: Activation precedes feature expansion

**Decision**: Ship a disclosed assisted pilot and v2 evidence first. Settlement
exports follow as the minimum operational product. Signed notifications begin
only after one external completion or an explicit participant blocking need.

**Rationale**: The repository already proves x402, receipts, replay protection,
MCP and allowances internally. The missing evidence is independent use and
willingness to pay, not another protocol surface.

**Alternatives considered**: Build a full hosted SaaS first (premature); add more
frameworks or chains (maintenance without observed demand); sell transaction
fees first (unvalidated and operationally harder than assisted integration).

## Decision 2: Promote rich receipts into a tenant-owned settlement projection

**Decision**: Preserve `payments` for consumed proofs and replay protection.
Extend rich receipt storage with immutable `product_uid`, provider ownership
through the product relationship, operational timestamps and monotonic states
`pending | confirmed | finalized | unknown | failed`.

**Rationale**: `payments` only represents accepted onchain outcomes. Existing
rich receipts preserve decisions and unknown states, but their text product slug
is not globally tenant-safe. Product UID supplies the missing ownership link.

**Alternatives considered**: Expand `payments` to include attempts (blurs replay
and operational concerns); export existing public receipts by slug (tenant
isolation flaw); export only finalized payments (contradicts the product promise
to preserve pending and unknown states).

## Decision 3: Use cursor pagination and bounded frozen exports

**Decision**: Settlement queries begin with authenticated owner, accept an
inclusive UTC start and exclusive end, allowlisted product/status filters and an
opaque `(updated_at,id)` cursor. Export runs synchronously in a repeatable-read
snapshot, captures `asOf`, permits at most 90 days and 10,000 records, and
returns a clear oversized-range error.

**Rationale**: It is deterministic, tenant-safe and sufficient for pilot scale
without object storage or a job service. One snapshot keeps records and totals
consistent.

**Alternatives considered**: Offset pagination (unstable under updates); always
asynchronous exports (premature infrastructure); unbounded synchronous export
(resource exhaustion risk).

## Decision 4: JSON is canonical and CSV is a safe companion

**Decision**: JSON contains schema, export identity, snapshot, filters, units,
summary and records. CSV uses a fixed RFC-4180-style projection with manifest,
settlement and summary row types, exact integer strings, UTC timestamps, formula
injection protection and server-generated filenames.

**Rationale**: JSON is lossless and auditable, including for an empty result.
CSV serves spreadsheet reconciliation without becoming the typed source of truth.

**Alternatives considered**: CSV only (weak metadata/empty result semantics);
JSON only (less useful operationally); add a CSV package (unneeded dependency for
a fixed, heavily tested schema).

## Decision 5: Store pilot truth as orthogonal evidence

**Decision**: Preserve activation v1 read-only and introduce a v2 model with
separate engagement classification, append-only activation events, support
interventions, scoped consent, day-seven observations, willingness-to-pay
responses, commercial cash records and grant tranches.

**Rationale**: Participation consent does not imply attribution. A time window
does not prove day-seven retention. Interest, an invoice, a grant and received
commercial revenue are different facts and must never share one status.

**Alternatives considered**: Extend the current single JSON report indefinitely
(conflates incompatible domains); infer conversion from onchain payments or
GitHub issues (false attribution); use one commercial funnel status (loses cash
and refund truth).

## Decision 6: Use a transactional PostgreSQL outbox

**Decision**: Create the notification event in the same transaction that accepts
a settlement-state change. A bounded worker claims deliveries using database
row locking; settlement never waits for destination I/O. Stable uniqueness is
based on subscription, receipt, event type, state and schema version.

**Rationale**: It prevents a committed settlement without its event and avoids a
new queue dependency at pilot scale. Stable event IDs make at-least-once retries
safe for receivers.

**Alternatives considered**: Inline fire-and-forget (loss and latency); immediate
external queue (premature); polling settlements as the primary source (harder
transition identity, retained only as reconciliation tooling).

## Decision 7: Sign exact bytes and rotate secrets with overlap

**Decision**: Generate a one-time `whsec_` value, encrypt it at rest with a
deployment-managed key and show only its fingerprint later. Sign
`event_id.unix_timestamp.exact_raw_body` with HMAC-SHA256. Rotation emits both
old and new signatures for a bounded 24-hour overlap before retiring the old
secret.

**Rationale**: MeterKit must recover the secret to sign, so hashing alone cannot
work. Exact bytes avoid ambiguous JSON canonicalization. Overlap prevents
receiver downtime.

**Alternatives considered**: Plaintext database secrets (prohibited); hash only
(cannot sign); asymmetric signatures (useful later but unnecessary for a
provider-specific pilot); immediate invalidation (avoidable outage risk).

## Decision 8: Treat delivery as bounded at-least-once

**Decision**: Attempt immediately, then approximately 30 seconds, 2 minutes, 10
minutes and 30 minutes. A `2xx` succeeds; transient network, timeout, `408`,
`425`, `429` and `5xx` retry; other `4xx` and any redirect terminate. Event ID
never changes across attempts. Responses, concurrency and timeouts are bounded.

**Rationale**: Exactly-once is not achievable across HTTP. Stable identity plus
bounded retry is observable and safe for idempotent consumers.

**Alternatives considered**: Infinite retry (resource risk); new ID per attempt
(duplicate business actions); follow redirects (SSRF and identity ambiguity).

## Decision 9: Pin validated DNS for every HTTPS attempt

**Decision**: Accept only credential-free HTTPS port 443 destinations without
fragments or query strings. Resolve every A/AAAA address at registration and
before each attempt, reject if any address is non-public, then connect to a
validated address while preserving hostname for TLS. Disable redirects and
environment proxy use. Activate only after a challenge proves destination
control.

**Rationale**: URL parsing or a separate DNS check followed by ordinary fetch is
vulnerable to DNS rebinding and time-of-check/time-of-use changes.

**Alternatives considered**: Static allowlist (safe but too restrictive after
the first manually onboarded pilot); validate DNS once (unsafe); validate and
follow redirects (unnecessary complexity).

## Decision 10: Reuse official agent authorizations

**Decision**: Reuse the current allowance view, reservations, resource scopes,
finality and revocation flow. Add packaging, evidence and product language only
unless an external test reveals a concrete defect.

**Rationale**: The differentiated capability already exists and uses official
Solana primitives. A new program would add audit and interoperability risk.

**Alternatives considered**: Custom authorization protocol; database-only
budgets; delegated custody. All conflict with protocol-native owner control.
