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

Schemas carry `schemaVersion`. Consumers must ignore unknown optional fields and
reject unsupported major schema versions. A breaking change requires a major
package version, migration guide and compatibility fixtures.
