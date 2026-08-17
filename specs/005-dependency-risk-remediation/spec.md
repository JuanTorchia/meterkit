# Feature Specification: Dependency Risk Remediation

**Feature Branch**: `[005-dependency-risk-remediation]`

**Created**: 2026-08-17

**Status**: Draft

**Input**: User description: "Several dependencies are reporting problems. Create a separate specification to identify what is actually affected, remediate security and compatibility risk without breaking MeterKit, and continue the self-service work safely."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Establish a Trustworthy Risk Inventory (Priority: P1)

The maintainer can see every reported dependency problem in one normalized
inventory, including whether it affects runtime, development, generated
projects, published packages or deployment artifacts. Each finding identifies
the affected path, severity, available fix, current exposure and evidence
source instead of treating every update notification as equally exploitable.

**Why this priority**: Updating packages before knowing which artifact and
behavior are affected can hide the original vulnerability, introduce a payment
regression or waste time on unreachable development-only findings.

**Independent Test**: Provide all current advisory, update and lockfile reports.
The maintainer can trace every finding to an exact dependency path and shipped
artifact, distinguish confirmed exposure from unknown/unreachable cases, and
account for every source record without duplicates or omissions.

**Acceptance Scenarios**:

1. **Given** multiple tools report the same advisory through different dependency paths, **When** the inventory is produced, **Then** the advisory is deduplicated while each affected path and artifact remains visible.
2. **Given** a problem affects only tests or local tooling, **When** it is classified, **Then** it remains visible but is not represented as a production-runtime vulnerability.
3. **Given** no open alert is visible in one provider, **When** another source or the maintainer reports a problem, **Then** the finding remains unknown or under investigation rather than being dismissed.
4. **Given** a vulnerable transitive dependency, **When** no direct manifest entry exists, **Then** the inventory identifies the introducing parent and every relevant lockfile path.

---

### User Story 2 - Remediate Without Breaking Payment Guarantees (Priority: P2)

The maintainer can apply the smallest compatible upgrade or replacement for
each actionable risk while preserving non-custodial settlement, exact policy
validation, finality, replay rejection and existing public contracts.

**Why this priority**: A clean vulnerability report is not a valid outcome if
the change weakens payment verification, silently changes protocol semantics or
breaks generated projects.

**Independent Test**: For each fixable critical or high runtime finding, apply
the proposed remediation in isolation and demonstrate that the finding is gone,
the dependency path is intentional, and all affected security and compatibility
acceptance checks still pass.

**Acceptance Scenarios**:

1. **Given** a patched compatible release exists, **When** remediation is applied, **Then** only the required dependency cohort and lockfile paths change.
2. **Given** a direct upgrade would cross an incompatible protocol cohort, **When** the finding is remediated, **Then** the cohorts remain explicitly separated or the migration includes contract evidence for every affected consumer.
3. **Given** a global resolution can silence an advisory, **When** it would force an unsupported transitive version, **Then** it is rejected in favor of a supported upgrade, replacement or bounded exception.
4. **Given** no safe fix exists, **When** the risk is accepted temporarily, **Then** the exception records exposure, compensating controls, owner, expiry and a review trigger.

---

### User Story 3 - Prove the Released Artifacts Remain Safe (Priority: P3)

Before promotion, the maintainer can verify the exact dependency graph and
public artifacts on the high-memory server, including generated projects and
the complete payment/replay lifecycle, without relying on a developer's WSL
environment.

**Why this priority**: Source-tree tests can pass while public packages contain
different dependencies or generated applications fail after installation.

**Independent Test**: From a clean server environment, build and inspect the
candidate artifacts, install every supported generated-project combination,
exercise the security-critical payment lifecycle, and produce an immutable
report tied to the exact candidate revision and dependency graph.

**Acceptance Scenarios**:

1. **Given** a remediated candidate, **When** server validation runs, **Then** supported generated projects install from candidate artifacts without workspace-only resolution.
2. **Given** a payment-boundary dependency changed, **When** regression validation runs, **Then** wrong network, mint, amount, recipient, resource, finality and replay cases remain rejected.
3. **Given** an exact candidate passes locally but not from its distributable artifact, **When** results are compared, **Then** release promotion is blocked and the difference is recorded.
4. **Given** validation is too expensive or resource-intensive for WSL, **When** the maintainer prepares the change, **Then** local work remains limited to editing and bounded unit checks while the required heavy evidence is produced on the designated server.

---

### User Story 4 - Prevent Dependency Drift From Returning (Priority: P4)

The maintainer receives actionable, low-noise dependency signals and cannot
promote a release with an unclassified severe risk, undocumented exception,
unsupported version drift or stale security evidence.

**Why this priority**: A one-time cleanup will decay quickly in a monorepo with
apps, libraries, examples and generated templates unless ownership and release
gates remain synchronized.

**Independent Test**: Introduce a fixture representing a new severe advisory,
an unsupported cohort change, a stale exception and a manifest/template drift.
Each condition is detected, assigned an actionable result and blocks only the
appropriate release path.

**Acceptance Scenarios**:

1. **Given** a new severe runtime advisory, **When** dependency monitoring runs, **Then** it creates one actionable record with affected artifacts and release impact.
2. **Given** a dependency version differs between a maintained example and its generated template, **When** drift validation runs, **Then** the inconsistency is reported before release.
3. **Given** a temporary exception reaches its expiry, **When** the release gate runs, **Then** promotion is blocked until the risk is remediated or explicitly reviewed again.
4. **Given** a development-only low-severity update exists, **When** it is reported, **Then** it remains scheduled and visible without interrupting unrelated emergency remediation.

### Edge Cases

- One advisory affects multiple versions of the same dependency in the lockfile.
- A package is vulnerable only when an optional feature or platform is enabled.
- A patched version exists but violates a peer-dependency or protocol contract.
- A transitive dependency is bundled into a public artifact even though it is
  absent from the consumer-facing manifest.
- An advisory is withdrawn, disputed, superseded or has no published patch.
- A lockfile regeneration changes unrelated packages or crosses a compatibility
  cohort unintentionally.
- An override removes the scanner warning but leaves runtime code incompatible.
- Generated templates pin a version different from maintained examples or apps.
- Registry, advisory database or source repository is unavailable during triage.
- The same name refers to different package ecosystems or scopes.
- A dependency is abandoned, changes license or transfers ownership without a
  known vulnerability identifier.
- A fix requires a breaking public-contract or data migration.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The project MUST maintain one normalized inventory of dependency findings from advisory providers, update automation, lockfile analysis, release scans and maintainer reports.
- **FR-002**: Every finding MUST record its source, observation time, advisory identity when available, severity, affected version range, patched version when available and current triage state.
- **FR-003**: Every finding MUST identify all affected direct or transitive paths and classify each path as runtime, development, build, generated-project or deployment exposure.
- **FR-004**: Duplicate reports MUST be correlated without discarding distinct dependency paths, affected artifacts or conflicting source assessments.
- **FR-005**: Missing, unavailable or contradictory advisory data MUST remain unknown or disputed and MUST NOT be converted into a clean result.
- **FR-006**: Findings MUST be prioritized by reachable impact on shipped artifacts and payment/security boundaries in addition to reported severity.
- **FR-007**: Fixable critical and high runtime findings MUST block release promotion until remediated or covered by an approved time-bounded exception.
- **FR-008**: Remediation MUST prefer the smallest supported upgrade or replacement and MUST NOT use an unsupported global resolution solely to silence a scanner.
- **FR-009**: Dependencies that participate in distinct compatibility or protocol cohorts MUST remain separately identified and validated; alignment MUST NOT be forced without consumer-level evidence.
- **FR-010**: Any dependency change affecting payment behavior MUST preserve validation of network, asset, amount, recipient, resource, expiry, finality and replay state.
- **FR-011**: Public package, application, maintained example and generated-template versions MUST be checked for intentional consistency or an explicitly documented difference.
- **FR-012**: Lockfile changes MUST be attributable to the intended remediation and unrelated dependency movement MUST be rejected or separately reviewed.
- **FR-013**: Every added or upgraded runtime dependency MUST have documented purpose, maintenance status, license, ownership risk and compatibility evidence.
- **FR-014**: A temporary risk exception MUST record affected artifacts, exploitability assessment, compensating controls, owner, approval, expiry and review trigger.
- **FR-015**: Withdrawn, expired or superseded findings and exceptions MUST retain an auditable history rather than disappearing from evidence.
- **FR-016**: Heavy full-graph, build, packaging, container and end-to-end validation MUST run on the designated high-memory server; WSL MUST remain limited to editing, inspection and bounded checks.
- **FR-017**: Candidate validation MUST inspect distributable artifacts and clean generated projects rather than relying only on workspace resolution.
- **FR-018**: Security regression evidence MUST cover successful payment plus wrong-policy, failed-finality, concurrency, duplicate-use and restart-replay cases whenever affected dependencies touch those boundaries.
- **FR-019**: Release evidence MUST bind the dependency inventory, lockfile, candidate revision, artifacts, validation environment and outcomes to one reviewable record.
- **FR-020**: Monitoring MUST detect new severe findings, stale exceptions, unsupported cohort drift and maintained-example/generated-template version drift.
- **FR-021**: Dependency reports MUST distinguish detected, classified, affected, reachable, remediated, accepted, disputed and verified states.
- **FR-022**: Public security claims MUST describe only the exact artifact and observation time verified; absence of one provider's alert MUST NOT be presented as absence of vulnerability.
- **FR-023**: Emergency remediation MUST be separable from unrelated feature, formatting and broad-version-update changes so it remains reviewable and reversible.
- **FR-024**: The dependency remediation work MUST NOT introduce custody, secret collection, mainnet expenditure or weakened fail-closed behavior.

### Key Entities

- **Dependency Finding**: A normalized report of a possible security, maintenance, license or compatibility problem with source, severity and lifecycle state.
- **Dependency Path**: The exact direct/transitive chain from an application, package, example or generated template to the affected component.
- **Affected Artifact**: A distributable package, deployed service, generated project, container or development-only tool whose graph contains the dependency path.
- **Compatibility Cohort**: A set of consumers intentionally constrained to mutually compatible protocol and dependency versions.
- **Remediation Candidate**: One bounded upgrade, replacement, removal or configuration change with affected paths and expected evidence.
- **Risk Exception**: A temporary, approved decision to carry a known unresolved risk with compensating controls and expiry.
- **Dependency Evidence Record**: Immutable linkage among candidate revision, lockfile, artifacts, inventory, environment and validation results.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 100% of currently reported dependency problems are represented in the normalized inventory or explicitly recorded as inaccessible source data.
- **SC-002**: 100% of inventory findings have at least one classified dependency path or a documented reason why the path cannot yet be resolved.
- **SC-003**: No known fixable critical or high reachable runtime finding remains in a promoted public or deployed artifact.
- **SC-004**: Every unresolved critical or high finding has a non-expired approved exception with owner, controls and review date.
- **SC-005**: Each remediation candidate changes only its declared dependency cohort and separately accounts for every additional lockfile change.
- **SC-006**: All payment-boundary rejection and replay checks pass with zero duplicate protected executions after applicable dependency remediation.
- **SC-007**: Every supported generated-project combination installs and reaches its expected first payment challenge from clean candidate artifacts on the designated server.
- **SC-008**: The exact distributable dependency graph and the source-workspace graph have no unexplained security-relevant difference.
- **SC-009**: Maintained examples and generated templates have zero unexplained version drift for dependencies included in public support claims.
- **SC-010**: All new or upgraded runtime dependencies have current purpose, maintenance, license and compatibility review evidence before promotion.
- **SC-011**: Severe new findings and expired exceptions are detected before release promotion in every tested fixture case.
- **SC-012**: WSL completes the workflow without running full workspace builds, package-manager matrices, containers or end-to-end payment validation.
- **SC-013**: A maintainer can identify the affected artifacts, proposed action, evidence and release impact of any severe finding in under ten minutes from the normalized report.
- **SC-014**: Public dependency/security status contains no claim based solely on download counts, a single scanner's silence or source-tree-only validation.

## Assumptions

- User-reported dependency problems are treated as real triage inputs even when
  an authenticated provider query currently returns no open alerts.
- Advisory-provider visibility may depend on permissions, timing, ecosystem and
  whether a report is an alert, update request or transitive lockfile finding.
- Critical and high reachable runtime risks take priority over feature work;
  lower-severity development-only updates may be scheduled separately.
- The repository intentionally contains more than one compatibility cohort;
  version uniformity is not automatically safer.
- Existing supply-chain controls, provenance, software inventory, dependency
  review and secret scanning are inputs to this feature, not proof that no
  vulnerability exists.
- The designated server with 24 GB RAM is the execution environment for heavy
  validation. WSL is used only for bounded authoring and inspection.
- Mainnet testing and spending are outside scope. Payment regression evidence
  uses local fixtures or explicitly authorized disposable devnet assets.
- This feature addresses dependency security, compatibility, maintenance and
  license risk. It does not authorize unrelated framework migrations or broad
  refactors.
