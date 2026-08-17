# Dependency remediation plan

Snapshot: `2026-08-17T08-47-03-714Z-3e401efe`. Ordering is severity,
reachability, then smallest isolated graph delta.

| Order | Candidate                  | Scope                                        | Required checks                                                    | Result / rollback                                                                        |
| ----- | -------------------------- | -------------------------------------------- | ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| 0     | critical/high advisory     | none                                         | source completeness                                                | not applicable: all advisory sources reported zero critical/high findings                |
| 1     | CodeQL 4.37.7              | CI action cohort                             | identical immutable SHA for init/analyze, CodeQL workflow          | applied atomically; rollback both uses to `5595cca...`                                   |
| 2     | tooling patches            | development manifests and lockfile           | frozen install, typecheck, affected tests                          | applied (`tsx` 4.23.12, `typescript-eslint` 8.67.0); rollback pins and lockfile together |
| 3     | x402 2.22.0                | Kit 5 payment cohort and generated templates | policy, finality, concurrent/restart replay, packages, quickstarts | applied for server verification; rollback all pins and fixtures to 2.21.0                |
| 4     | Next 16.3.1 / React 19.2.8 | web runtime manifests and lockfile           | build and browser E2E in all locales                               | applied for server verification; rollback Next and example/template React together       |
| 5     | express-rate-limit 8.6.2   | gateway runtime manifest and lockfile        | gateway unit/integration/rate-limit tests                          | applied for server verification; rollback range to `^8.0.1`                              |

The broad #70 proposal is intentionally not copied: PostgreSQL, Fumadocs,
Wallet Standard, Hono and Subscriptions updates remain separate scheduled
candidates. None corresponds to a current security finding.

Every applied candidate remains `testing` until the exact server-generated
lockfile, packed artifacts and mapped regressions pass. An advisory disappearing
would not change that requirement.
