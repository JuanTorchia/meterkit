# Research: Dependency Risk Remediation

## One normalized inventory, multiple independent sources

**Decision**: Collect source snapshots independently from GitHub security
alerts, update PR metadata, package-manager production/development audits,
manifests/lockfile, generated templates, SBOM and maintainer reports. Normalize
only after recording source availability and observation time.

**Rationale**: The authenticated alert query returned no open results while the
maintainer observed several problems. A provider can be quiet because of timing,
permissions, ecosystem coverage or because the signal is an update rather than
an alert. Silence cannot erase another source.

**Alternatives considered**: Treating one audit command or Dependabot as the
authority is simpler but creates false-clean states and misses artifact drift.

## Stable finding identity and path preservation

**Decision**: Deduplicate by ecosystem, package and advisory identity when one
exists; otherwise use a deterministic source/type/range key. Preserve every
dependency path and affected artifact underneath the finding.

**Rationale**: The same advisory may arrive from multiple providers and through
several direct/transitive paths. Collapsing paths loses exposure; counting every
source as a vulnerability inflates risk.

**Alternatives considered**: Keying only by package/version incorrectly merges
different advisories and cannot retain disputed provider assessments.

## Exposure and reachability

**Decision**: Classify paths as runtime, development, build, generated-project
or deployment, then classify reachability as confirmed, likely, unreachable or
unknown with evidence. Unknown is prioritized conservatively at payment and
release boundaries.

**Rationale**: Severity alone cannot distinguish an unreachable test tool from a
runtime parser used on hostile payment input. Automated reachability is useful
but not proof of absence.

**Alternatives considered**: Ignoring dev dependencies misses supply-chain build
risk; treating all findings as production blocks work without improving safety.

## Cohort-aware remediation

**Decision**: Remediate one compatibility cohort/finding group per change. Keep
x402/Solana Kit 5 and Subscriptions/Kit 6 intentionally separate unless official
contracts plus all consumer tests prove a migration. Lockfile movement outside
the declared cohort is a review failure.

**Rationale**: The repository already documents legitimate incompatible peers.
Forced uniformity or blanket overrides can silence scanners while breaking
runtime semantics.

**Alternatives considered**: Updating everything to latest maximizes churn and
makes causality, rollback and payment regression diagnosis impractical.

## Overrides and exceptions

**Decision**: An override is acceptable only when upstream declares the forced
version compatible and artifact-level tests prove it. Otherwise use supported
upgrade/replacement or a time-bounded exception with controls, owner and expiry.

**Rationale**: A resolution changes installation, not upstream compatibility.
Exceptions make unfixable risk visible without manufacturing a green report.

**Alternatives considered**: Permanent ignores conceal debt; automatic forced
resolutions can create a security or availability regression.

## Server execution boundary

**Decision**: WSL performs edits, schema/parser fixtures, syntax checks and
small targeted unit tests only. The designated 24 GB Linux server performs full
install/audit, workspace build/test, clean quickstarts, packaging, SBOM/container
scans and devnet/local payment regression.

**Rationale**: The local environment stalls under heavy work. Reproducibility
improves when resource-intensive evidence comes from one recorded environment.

**Alternatives considered**: Best-effort local execution risks hangs, partial
evidence and untracked environmental differences.

## Release policy

**Decision**: Block promotion for reachable or unknown runtime high/critical
findings without a valid exception; any unclassified severe report; stale
exceptions; unexplained lockfile/artifact drift; or failed payment-boundary
regression. Low/development findings remain visible and scheduled.

**Rationale**: The gate is risk-based without allowing uncertainty at critical
boundaries to become success.

**Alternatives considered**: Blocking on every low advisory creates noise;
blocking only on scanner severity ignores reachability and evidence quality.

## Evidence and disclosure

**Decision**: Keep raw private provider snapshots access-controlled; publish
only sanitized status by artifact, observation time and verified outcome.
Evidence records include hashes for commit, lockfile and distributable artifact.

**Rationale**: Reports may expose private repository/security metadata, while
public claims still need precise reproducible scope.

**Alternatives considered**: Publishing raw alerts may leak details; reporting
only “audit passed” cannot be independently interpreted.
