# Data Model: World-Class Agent Payments

The model distinguishes public protocol state, hosted operational metadata and
versioned repository evidence. Signing secrets are never entities.

## PublicRelease

- `version`: semantic version, unique across a released package set
- `sourceCommit`: full approved source revision
- `tag`: immutable release tag
- `packages`: ordered `PackageArtifact[]`
- `compatibilityReport`: content-addressed report reference
- `sbomReferences`: one or more content-addressed inventory references
- `provenanceStatus`: `staged | verified | unavailable | failed`
- `migrationImpact`: `none | compatible | breaking`
- `publishedAt`: optional UTC timestamp
- `rollback`: recovery or deprecation procedure reference

State: `planned → built → verified → staged → published`; any pre-publication
state may become `rejected`; published artifacts are immutable and corrected by
a new version.

## PackageArtifact

- `name`, `version`, `registry`, `integrity`, `tarballSize`
- `runtimeFiles`: normalized allowlisted paths
- `dependencies`, `peerDependencies`, `engineRange`
- `license`, `repository`, `sourceDirectory`
- `provenanceReference`: optional public attestation
- `supportStatus`: `primary | supported | experimental | internal | deprecated`

Identity is `(registry, name, version)`. Integrity and contents cannot change
after publication.

## InitializerPlan

- `schemaVersion`, `initializerVersion`
- `surface`: `express | next-route | hono | mcp`
- `targetDirectory`, `packageManager`
- `network`: fixed to devnet in this phase
- `files`: normalized relative paths with content fingerprints
- `dependencies`: exact generated dependency set
- `environmentKeys`: names and descriptions only, never values
- `warnings`: bounded diagnostic codes

State: `validated → planned → written → verified`; invalid or unsafe targets are
`rejected` before any write. A plan is deterministic for identical normalized
input and initializer version.

## DocumentationPage

- `locale`: `en | es`
- `slug`: locale-relative canonical path
- `title`, `description`, `section`, `order`
- `contentFingerprint`, `lastReviewedAt`
- `productVersionRange`, `surface`, `maturity`
- `claimKeys`: stable identifiers for security/compatibility assertions

Identity is `(locale, slug)`. Every maintained English page with technical
claims has a Spanish peer or an explicitly documented locale-neutral reference.

## AgentAuthorizationView

- `authorizationAddress`, `program`, `network`, `kind`
- `owner`, `delegate`, `assetMint`, `recipientScope`, `resourceScopes`
- `perRequestLimitAtomic`, `aggregateLimitAtomic`, `spentAtomic`
- `startsAt`, `expiresAt`, `status`
- `creationTransaction`, `revocationTransaction`
- `observedCommitment`, `observedAt`

Status: `pending | active | exhausted | expired | revocation_pending | revoked |
unknown | failed`. Onchain state is authoritative; the hosted view is
reconcilable metadata and never grants authority.

## BenchmarkRun

- `schemaVersion`, `runId`, `sourceCommit`, `startedAt`, `duration`
- `environment`: runtime, CPU, memory, operating system and dependency endpoints
- `workload`: scenario, concurrency, request count, warmup and timeout
- `latency`: p50, p95, p99 split into local and external measurements
- `outcomes`: accepted, rejected, unknown, failed, replayed
- `protectedExecutions`, `duplicateExecutions`
- `limitations`, `artifacts`

Identity is `runId`; a published result is append-only and reproducible from its
workload and exact source revision.

## DeveloperActivation

- `activationId`: random non-wallet-correlating identifier
- `consent`: explicit scope and timestamp
- `surface`, `packageVersion`, `startedAt`
- `stages`: challenge, settlement, receipt, replay and repeated-use timestamps
- `assistance`: `none | documentation | diagnostic | implementation`
- `frictionCodes`: bounded taxonomy
- `usefulnessRating`: optional integer from 1 through 5, collected only with
  explicit consent after the onboarding or recovery journey
- `evidenceReferences`: minimized public or participant-approved references
- `retentionDecision`: consented retention scope

Internal owner-controlled integrations use a separate evidence class and cannot
be converted into external activations.

## UpstreamContribution

- `upstream`, `proposalUrl`, `problem`, `scope`, `submittedAt`
- `status`: `draft | proposed | changes_requested | accepted | declined |
withdrawn`
- `meterkitDependency`: must be `none` for protocol-level contributions
- `evidenceUpdatedAt`

Status is derived from public upstream state and must never be reported as
accepted before merge evidence exists.

## BrandAssessment

- `candidate`, `assessedAt`
- `domain`, `package`, `repository`, `social`, `search`, `trademark` findings
- `confusionRisk`, `migrationCost`, `continuityValue`
- `decision`: `retain | reserve | migrate | reject`
- `evidenceReferences`, `limitations`

A `migrate` decision requires a compatibility plan for existing public package
and repository identities.
