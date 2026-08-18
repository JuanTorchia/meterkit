# Dependency-risk operations

## Execution boundary

WSL is limited to editing, inspection, syntax checks and individually named
schema/parser tests. Do not run full install, audit, recursive build/test,
containers, Playwright, quickstart matrices, package matrices or payment E2E in
WSL.

Heavy commands run only on the designated 24 GB Linux server. They require both
`--ack-server-only` and `METERKIT_SERVER_MARKER` pointing to a local JSON marker:

```json
{
  "schemaVersion": 1,
  "role": "dependency-evidence-server",
  "environmentId": "meterkit-evidence-linux"
}
```

The marker contains no credential and is not sufficient authorization for
mainnet operations. Collection remains read-only except for its dedicated
evidence directory.

## Source behavior

- Each provider has a bounded timeout and at most two retries with backoff.
- Authentication/permission failure is `unauthorized`; transport exhaustion is
  `unavailable`; truncated responses are `partial`.
- An available response with zero records is recorded as zero, not unavailable.
- Maintainer-reported problems are an explicit independent source.
- No required unavailable source may produce a passing gate.

## Evidence handling

Raw provider snapshots and server logs remain under `.dependency-risk/private/`
with owner-only permissions. Sanitized evidence records contain stable IDs,
counts, hashes, affected artifacts and bounded failure codes. They exclude
tokens, authorization headers, credential URLs and private advisory payloads.

Retain the sanitized record for every reviewed candidate and release. Raw
snapshots follow provider disclosure restrictions and are deleted only after
their retention period, with the evidence hash and lifecycle result preserved.

## Failure and retry

A collector failure is fail-closed for release but does not destroy previous
evidence. Retry only the failed source. Never rerun all upgrades or regenerate a
lockfile merely because an advisory provider is unavailable. Server collection
and candidate verification remain separate commands so a mutable source cannot
change midway through a deterministic review.

## Ownership and cadence

- The maintainer reviews Dependabot alerts and failed dependency workflows each
  Monday; critical/high alerts interrupt the weekly cadence immediately.
- SDK owns x402/Solana Kit 5, Subscriptions owns Kit 6, Web owns Next/React,
  Gateway owns HTTP middleware, and Tooling owns build/test dependencies.
- One candidate changes one compatibility cohort. Emergency isolation uses a
  dedicated branch and never carries feature work or unrelated lockfile drift.
- Exceptions require a different approver, concrete compensating controls, an
  expiry and an append-only lifecycle. Expired exceptions block release.
- Review triggers are a new exploit path, upstream fix, changed reachability,
  artifact promotion, or expiry—whichever occurs first.
- Release staging consumes a sanitized release asset produced on the designated
  server for the exact commit and lockfile; a missing asset, unavailable source
  or digest mismatch fails closed.
