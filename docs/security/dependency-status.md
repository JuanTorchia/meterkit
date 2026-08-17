# Dependency risk status

Status as of **2026-08-17 08:47 UTC**: all seven required source classes were
collected independently on the designated 24 GB server. Both pnpm audits and
the authenticated GitHub Dependabot-alert query contain zero vulnerabilities.
The reported problems are six open dependency-update PRs, not security alerts.

## Current gate

- Inventory: `ready` (zero critical/high/moderate/low findings)
- Production graph: 551 dependencies; zero audit vulnerabilities
- Development graph: 689 dependencies; zero audit vulnerabilities
- SBOM: CycloneDX, 691 components
- Workspace roots: 17
- Private source snapshots: 7/7 available
- Advisory reachability: not applicable because no advisory was reported
- Update remediation: required before the update PRs can merge
- Typecheck/build/package verification: passed on the candidate snapshot
- Tests: 234/234 Vitest and 20/20 Node tests passed with PostgreSQL
- Generated projects: npm and pnpm passed for Express, Next and Hono; MCP
  passed separately as experimental stdio evidence
- Payment boundary: wrong-policy, finality, concurrent/duplicate and
  restart-replay checks passed
- Containers: gateway `sha256:b0c3f9f...` and web `sha256:b67bd62...` built;
  Trivy 0.68.2 reported zero fixed critical/high vulnerabilities for both
- Secret scan and bilingual claim parity: passed (2 locales, 25 claims)

## Accounted update problems

| PR  | Cohort           | Result | Classification                                                               |
| --- | ---------------- | ------ | ---------------------------------------------------------------------------- |
| #68 | web runtime      | failed | Portuguese E2E locale assertion; unrelated/flaky evidence, rerun required    |
| #69 | gateway runtime  | passed | reachable update candidate                                                   |
| #70 | production-other | failed | real cohort drift: x402 fixtures were not updated with the grouped manifests |
| #71 | development      | passed | development-only candidate                                                   |
| #72 | CodeQL analyze   | failed | split action update mixed 4.37.7 with init 4.37.6                            |
| #73 | CodeQL init      | failed | split action update mixed 4.37.7 with analyze 4.37.6                         |

The two CodeQL PRs must be treated as one atomic cohort. The #70 group is too
broad to accept as-is: x402 and Solana cohorts require isolated candidates and
an explicit fixture delta. A passing update check is candidate evidence, not
authorization to merge.

## Evidence binding

- Collection run: `2026-08-17T08-47-03-714Z-3e401efe`
- Environment: `bulbasaur-24gb`, Node 22.22.1, pnpm 11.10.0
- Lockfile: `sha256:cb58784f579a7f0d7c1f1b28e07bb0fd4daf73506d2dc4f92a885984e3f94499`
- Private collection digest: `sha256:b632a751e82fe88e4e594db1a93c36a0a82d2a5a1310b96b6a425b5694d75ba6`
- Private SBOM snapshot digest: `sha256:36c9fb4d69111d8483b97f5456919a9cbd317b7df6da8412437b8d750621074d`
- Exact candidate snapshot: `d7a05fb50d67911eacc4401bcb49085e90629397`
- Exact candidate lockfile: `sha256:ae27a692827b4daf9831ffdb297d55bfc1cef237f3641a2cc3d404e2c2299a7c`
- Sanitized gate: [`dependency-evidence.json`](./dependency-evidence.json), `passed`

Only sanitized artifact-scoped results belong in this file. Raw provider
payloads, tokens, private URLs and complete logs remain in the ignored private
evidence location. The candidate checks above are successful cumulative
evidence and its exact-source dependency gate passed. Future feature work must
produce a new exact-commit record; this evidence does not authorize publishing
an unpublished or subsequently modified working tree.
