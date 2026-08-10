# Public API lifecycle

MeterKit uses semantic versioning once packages are published. During `0.x`, a
minor release may change advanced APIs, but the canonical `protect()` contract,
public receipt schema version and documented migration path remain explicit.

- `protect()` is the recommended Express entry point.
- `createMeterKitResourceServer()` is the framework adapter building block.
- `createX402Middleware()` remains compatible for advanced callers and is not
  removed without a deprecation release and changelog entry.
- `createMeterKitMiddleware()` is legacy test/facilitator glue; new code should
  not use it.

World-class evidence contracts are additive in the next compatible release:

- `publicReleaseSchema` and `packageArtifactSchema`: supported release and
  registry evidence contracts; schema version 1.
- `benchmarkRunSchema`: supported reproducible performance evidence contract;
  schema version 1.
- `initializerPlanSchema`: supported deterministic `create-meterkit` dry-run
  contract; schema version 1. The initializer itself remains experimental until
  all declared generated projects pass clean-artifact validation.
- `documentationPageSchema` and `compareDocumentationClaims()`: supported build-
  time documentation contracts; they are not runtime payment dependencies.
- `agentAuthorizationViewSchema`: experimental until fresh official Solana
  allowance create/spend/revoke evidence passes. Its status names must not be
  interpreted as authority over onchain state.

Schemas carry `schemaVersion`. Consumers must ignore unknown optional fields and
reject unsupported major schema versions. A breaking change requires a major
package version, migration guide and compatibility fixtures.

During `0.x`, removal or incompatible renaming of a documented public export
requires at least one prior minor release carrying a deprecation notice unless a
security issue makes continued exposure unsafe. Security removals still require
a migration note and corrected release rather than mutating a published
artifact.
