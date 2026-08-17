# Implementation Plan: Dependency Risk Remediation

**Branch**: `005-dependency-risk-remediation` | **Date**: 2026-08-17 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/005-dependency-risk-remediation/spec.md`

## Summary

Build one reproducible dependency-risk inventory from manifests, lockfile,
advisory/update sources, software inventory and release artifacts; classify each
path by exposure and affected artifact; then remediate findings in small,
cohort-aware changes. Editing and bounded parser/unit checks remain local. The
24 GB server runs full graph collection, audit, package/build/container matrices
and payment regression evidence. Release promotion fails on unclassified or
unexcepted reachable high/critical risk, stale exceptions, unexplained lockfile
movement or unsupported compatibility drift.

## Technical Context

**Language/Version**: TypeScript 5.9 and Node.js 22 LTS, strict ESM; JSON/Markdown evidence

**Primary Dependencies**: Existing Node standard library, Zod contracts from `@usemeterkit/core`, package-manager audit/lockfile data, GitHub advisory/update metadata, existing SBOM and compatibility tooling; no new runtime dependency

**Storage**: Versioned JSON input snapshots and immutable sanitized evidence artifacts tied to commit/lockfile hashes; reviewed Markdown summary; no database required

**Testing**: Node/Vitest parser and classification fixtures locally; package-manager audit, dependency graph, build/typecheck/unit/E2E, clean package/template matrix, container scan and payment regression on the designated server/CI

**Target Platform**: Local WSL for edits and bounded tests; Linux server with 24 GB RAM and GitHub Actions for heavy/release validation

**Project Type**: Security/release tooling and policy for a TypeScript monorepo with public packages, deployed apps, examples and generated templates

**Performance Goals**: Normalize a current report in under 10 minutes; deterministically process the complete lockfile in one bounded run; avoid adding material time to ordinary local editing

**Constraints**: Preserve dirty user changes; no broad upgrades; no mainnet activity; no secrets in evidence; provider silence is unknown, not clean; heavy commands never run in WSL; exact candidate artifacts—not workspace substitutes—gate release

**Scale/Scope**: 17 workspace projects, public npm artifacts, apps, examples and generated templates; multiple intentional Solana/x402 compatibility cohorts; current plus future advisories/exceptions

## Constitution Check

_GATE: Passed before research and re-checked after design._

- **I. Non-Custodial by Construction — PASS**: remediation cannot weaken direct settlement or introduce secret collection; evidence is sanitized.
- **II. Protocol-Native Interoperability — PASS**: x402/Solana cohorts move only with official compatibility evidence and consumer contract tests.
- **III. Security and Evidence First — PASS**: each reachable finding maps to adversarial payment, concurrency, recovery and replay evidence where applicable; unknown stays unknown.
- **IV. AAA Developer Experience — PASS**: generated projects and public examples are first-class affected artifacts, not incidental source files.
- **V. Activation Before Expansion — PASS**: dependency risk is a prerequisite to safely completing self-service activation; no new product surface is added.
- **VI. Observable and Reproducible Operations — PASS**: inventories bind sources, commit, lockfile, artifacts, environment and outcomes; timeouts and source failures are explicit.
- **VII. Open Source Integrity and Truthful Claims — PASS**: license, maintenance, semantic-version, changelog, vulnerability state and public claims are separately evidenced.

**Post-design re-check**: PASS. No constitution exception is needed. The plan
adds no runtime dependency and does not reinterpret a quiet scanner as safety.

## Project Structure

### Documentation (this feature)

```text
specs/005-dependency-risk-remediation/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
└── tasks.md
```

### Source Code (repository root)

```text
packages/core/src/dependency-risk.ts
scripts/dependency-risk/
├── collect.mjs
├── normalize.mjs
├── verify.mjs
└── fixtures/
scripts/verify-compatibility.mjs
scripts/verify-package-contents.mjs
scripts/generate-release-manifest.mjs
docs/dependencies.md
docs/licenses.md
docs/security/dependency-status.md
.github/workflows/dependency-review.yml
.github/workflows/release.yml
```

**Structure Decision**: Extend existing core schemas and release/security
scripts. Collection remains adapter-based and source snapshots remain separate
from normalization so unavailable external providers do not make fixtures or
historical evidence nondeterministic. Heavy orchestration is invoked on the
server/CI, never as an implicit local pretest.

## Complexity Tracking

No constitution violations require justification.
