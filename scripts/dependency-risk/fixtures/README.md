# Dependency-risk fixtures

Fixtures are sanitized, deterministic representations of provider and lockfile
conditions. They must never contain repository tokens, private advisory payloads,
full URLs with credentials, environment variables or raw server logs.

Required fixture families:

- provider with zero records versus unavailable/unauthorized provider;
- duplicate advisory from multiple providers and paths;
- direct and transitive runtime/development/build/template/deployment paths;
- conflicting severity or affected-range assessments;
- multiple resolved vulnerable versions in one lockfile;
- unsupported cross-cohort upgrade or global override;
- active, expired, superseded and revoked risk exceptions;
- workspace versus packed-artifact drift;
- payment-boundary impact requiring adversarial regression.

Each fixture includes a schema version, synthetic observation timestamp and
expected stable result codes. Real provider snapshots remain under the ignored
private evidence directory and are never copied here verbatim.
