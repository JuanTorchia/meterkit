# Data Model: Self-Service Activation

## InitializerRequest

- `directory`: normalized target path; never overwritten when non-empty.
- `surface`: `express | next | hono | mcp`.
- `packageManager`: supported `npm | pnpm`; experimental values remain explicit.
- `recipient`: validated public Solana address.
- `install`: explicit boolean.
- `interactive`: whether prompts are permitted.
- `outputMode`: `human | json`.

State: `requested → planned → written → installing → ready`. Installation may
end at `install_failed`, leaving the project and an exact recovery command.
Validation failure or an unsafe directory ends before `written`.

## GeneratedProjectConfig

- schema version and initializer/package versions
- surface and package manager
- network fixed to Solana devnet for this feature
- public recipient, mint, amount and protected resource
- RPC/facilitator endpoints without credentials
- `durabilityMode`: `memory | postgres`
- optional PostgreSQL pool limits; database URL remains only in local env

Memory is valid for discovery only. PostgreSQL requires a valid connection and
migrations before paid serving; no transition permits automatic fallback.

## DiagnosticReport

- `schemaVersion`, `generatedAt`, tool version and sanitized project identity
- ordered `findings`

Each `DiagnosticFinding` has a stable code, category, state
`passed | failed | unavailable | unknown`, summary, bounded remediation and an
optional sanitized evidence reference. External unknown/unavailable state never
becomes passed without a new observation.

## PaymentSession

- expected network, mint, atomic maximum, recipient and resource
- challenge fingerprint and expiry
- payer public address; never secret key material
- settlement/receipt identifiers and sanitized signature fingerprint
- state timestamps

State: `discovered → policy_validated → confirmed → submitted → settled →
protected_response → replay_rejected → closed`. Refusal, timeout, failed and
unknown are terminal observations, not settlement aliases. Persisted session
material, if requested, is permission-restricted and explicitly deleted.

## StandaloneReplayRecord

- `network`
- `signatureHash`: SHA-256 digest used with network as the unique key
- `signatureFingerprint`: bounded display-only fingerprint
- product/resource fingerprint
- `acceptedAt`
- optional sanitized amount/recipient/status fields needed for diagnostics

The unique constraint is authoritative. Exactly one concurrent save succeeds;
duplicate-key maps to `PAYMENT_REPLAYED`. Production records have no normal
reset path.

## RegistryVerification

- exact package/version/integrity and resolved registry location
- UTC timestamp, OS, Node and package-manager versions, surface
- invoked public commands and sanitized result per lifecycle step
- classification fixed to `synthetic`

It can gate a release but never count as a user, integration or retention.

## ExternalActivationRun

- locally generated engagement identifier and immutable participant class
- package version, OS/Node/package manager/surface
- milestone timestamps: initializer start, first 402, settlement, protected
  response, replay rejection
- outcome and last known stage
- intervention count/types and sanitized evidence references
- scoped consents for retention, follow-up, aggregate reporting and attribution

Only an independent external participant with participant-controlled provider
evidence satisfies external activation. Retries by one person/project are one
run. Unknown, abandoned and assisted outcomes remain distinct.

## SupportMatrix

- schema/version and effective release
- supported Node versions, surfaces, package managers and OS tiers
- each cell's verification tier and latest result reference

Documentation claims derive from this contract. Experimental cells are never
displayed as supported.
