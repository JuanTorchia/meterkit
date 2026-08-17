# Data Model: Dependency Risk Remediation

## SourceSnapshot

- stable source type and optional provider account/repository identity
- observation timestamp and collector version
- availability: `available | unavailable | unauthorized | partial | unknown`
- content hash and private evidence reference
- bounded failure reason when unavailable

A missing snapshot never implies an empty result. An available snapshot may
truthfully contain zero source records.

## DependencyFinding

- stable finding ID
- ecosystem, package and advisory identity when available
- title, reported severity and affected/patched ranges
- lifecycle: `detected | classified | affected | reachable | remediated |
accepted | disputed | verified | withdrawn`
- first/last observed timestamps and contributing source IDs
- assessment, owner and next action

Findings are deduplicated, but their source assessments and paths remain
append-only. Withdrawal does not delete history.

## DependencyPath

- finding ID and root consumer/artifact
- ordered direct/transitive package chain with exact resolved versions
- scope: `runtime | development | build | generated_project | deployment`
- reachability: `confirmed | likely | unreachable | unknown`
- reachability evidence and observation time
- compatibility cohort

## AffectedArtifact

- kind: public package, deployed app, example, generated template, container or
  development tool
- name/version and source manifest
- distributable digest when built
- exposure and release impact

## CompatibilityCohort

- stable cohort ID, purpose and owners
- consumers and coordinated package constraints
- official compatibility references
- required contract/regression checks

Membership changes require explicit review; common package names do not imply
that two cohorts can be merged.

## RemediationCandidate

- finding/path IDs and action: `upgrade | replace | remove | constrain`
- from/to versions and intended lockfile delta
- semantic/public migration impact
- required checks, result and rollback
- state: `proposed | testing | failed | verified | released | rolled_back`

## RiskException

- finding/path/artifact scope
- rationale and exploitability assessment
- compensating controls
- owner, approver, created/expiry dates and review trigger
- status: `active | expired | superseded | revoked | closed`

An expired exception never satisfies a release gate.

## DependencyEvidenceRecord

- schema/tool versions and generated timestamp
- commit and lockfile digests
- source snapshot IDs and inventory digest
- server environment identity without credentials
- artifact digests and validation outcomes
- overall gate: `passed | failed | incomplete`

`incomplete` is mandatory when a required source or validation is unavailable.
