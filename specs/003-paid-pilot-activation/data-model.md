# Data Model: Paid Pilot Activation

## ProviderSettlement

Provider-owned operational projection of a payment attempt or settlement.

- `receiptId`: UUID, immutable identity
- `productUid`: immutable foreign key to the provider-owned product
- `productSlug`: display snapshot, not an authorization key
- `decision`: `accepted | rejected | unknown | failed`
- `settlement`: `not_started | pending | confirmed | finalized | unknown | failed`
- `network`, `assetMint`, `amountAtomic`, `recipient`
- `signatureFingerprint`, optional public `explorerUrl`; no full proof
- `reasonCode`, sanitized policy decisions
- `occurredAt`, `settledAt`, `updatedAt`

State advances monotonically. `confirmed` may become `finalized`, `unknown` or
`failed`; terminal evidence cannot regress from `finalized` to a weaker state.
Stale updates are ignored. Ownership is always resolved through `productUid`.

## SettlementQuery

- authenticated `ownerWallet` (derived, never client-selectable)
- inclusive `from`, exclusive `to`, maximum 90 days
- optional owner-scoped product UID/slug
- optional allowlisted settlement states
- `limit` with bounded default/maximum
- opaque cursor encoding the last `(updatedAt, receiptId)`
- `asOf` upper boundary for stable paging/export

## SettlementExport

- `schemaVersion`, `exportId`, `generatedAt`, `asOf`
- normalized filters and canonical units
- exact record count and amounts grouped by asset and state
- ordered `ProviderSettlement[]`
- format `json | csv`

Exports contain at most 10,000 records. Amounts remain decimal integer strings.
JSON is canonical. CSV is a sanitized projection of the identical frozen result.

## PilotEngagement

- `engagementId`: non-wallet-correlating UUID
- `participantClass`: `internal_maintainer | synthetic | external_independent |
external_compensated | external_other`
- `offerVersion`, disclosed amount/currency/unit
- optional provider-owned `productUid`, `surface`
- `startedAt`, `source`, `lastKnownStage`, `operationalOutcome`
- `assistanceMode`, `createdAt`, `updatedAt`

Classification is immutable except through an audited correction. Derived
completion requires an independent participant, participant-controlled endpoint
and passing evidence through settlement, protected response and replay rejection.

## ActivationEvent

Append-only evidence linked to one engagement.

- `eventId`, `engagementId`
- `stage`: install, server, challenge, policy, payment, settlement, protected
  response, replay rejection or completion review
- `outcome`: `passed | failed | unknown`
- `occurredAt`, `recordedAt`
- minimized `evidenceReference`, optional `interventionId`

No mutable `completed` flag exists; engagement state is derived from events.

## SupportIntervention

- `interventionId`, `engagementId`, stage
- `kind`, bounded reason code, actor class
- `beganAt`, `endedAt`, derived duration

This distinguishes self-service success from maintainer-assisted activation.

## ConsentGrant

- `consentId`, `engagementId`
- `scope`: technical participation, private evidence retention, day-seven
  follow-up, aggregate reporting, public attribution, testimonial or case study
- `status`: `granted | denied | withdrawn`
- `termsVersion`, `capturedAt`, optional `withdrawnAt`, source reference

Consent is per scope. Technical participation never implies public attribution.
Withdrawal records what hosted data can be removed and what public/onchain
evidence cannot be erased.

## RetentionObservation

- `observationId`, `engagementId`
- `dueAt`: activation time plus seven days
- `observedAt`
- `outcome`: `retained | removed | unknown | ineligible`
- `evidenceType`: participant response or verifiable valid use
- optional valid payment count

`retained` is valid only when observed on/after `dueAt` with permitted evidence.
Intent to continue at activation time is not retention.

## WillingnessToPayResponse

- `responseId`, `engagementId`, `askedAt`, optional `respondedAt`
- response: stated-price yes, different-price yes, maybe, no, declined or unknown
- offer version, amount, currency and unit
- optional bounded reason code

Silence and product preference do not count as willingness to pay.

## CommercialEngagement and CommercialPayment

The commercial agreement records proposal/invoice lifecycle. Cash receipts are
separate append-only payment records with private evidence references, currency,
gross, refunds, net and verified receipt time. A paid integration exists only
when verified net commercial cash is greater than zero. Devnet assets and grants
are excluded.

Commercial progression: `none → interest_recorded → proposal_sent → accepted →
invoiced → payment_pending → payment_received`, with declined, expired and
cancelled exits. Payment records may later be partially or fully refunded.

## FundingAward and GrantTranche

- award/provider identity and category `grant`
- tranche amount/currency and required evidence description
- state: `not_due | eligible | submitted | approved | payment_pending |
received_verified | rejected`
- private evidence reference and separate public-safe status

Grant cash is never joined into commercial revenue, customer or adoption
metrics. Applicant identity, KYC and invoice documents remain outside public
hosted data.

## NotificationSubscription

- `subscriptionId`, owner relationship, HTTPS destination, selected event types
- state: `pending_verification | active | disabled | failed_verification`
- created/updated/disabled times and destination fingerprint

The destination must pass registration challenge and network policy. Disabling
stops new claims and retries without deleting history.

## NotificationSecret

- `secretId`, `subscriptionId`, key version
- encrypted secret material plus non-sensitive display fingerprint
- state `active | retiring | retired`
- `createdAt`, optional `retireAt`, `retiredAt`

Cleartext is displayed exactly once. Rotation permits at most one retiring key
during a bounded overlap.

## NotificationEvent and NotificationDelivery

Event is immutable: ID, subscription, receipt, type, settlement state, schema
version, exact serialized payload, occurred/created times. Uniqueness prevents a
second business event for the same transition.

Delivery records each attempt: ID, event, attempt number, state `due | claimed |
delivered | retry_wait | terminal | exhausted`, due/claimed/completed times,
bounded HTTP outcome and sanitized error. Events are at-least-once; receivers
deduplicate by event ID.

## Relationships

```text
Provider ──< Product ──< ProviderSettlement ──< NotificationEvent
    │                                      NotificationSubscription ──< Secret
    └──< PilotEngagement ──< ActivationEvent / Consent / Intervention
                         └── Retention / WTP / CommercialEngagement

FundingAward ──< GrantTranche     # intentionally separate from commercial data
```
