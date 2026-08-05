# MeterKit governance

MeterKit uses a lightweight maintainer-led governance model while the project is
early. The goal is to make decisions transparent without creating process that
the contributor base does not yet need.

## Roles

### Contributors

Anyone who submits a useful issue, review, test, documentation change, design or
code contribution.

### Maintainers

People trusted to triage issues, review and merge changes, manage releases,
handle security reports and enforce project policies. Current maintainers are
listed in [MAINTAINERS.md](MAINTAINERS.md).

## Decision process

- Small fixes and documentation changes are decided through pull-request review.
- New public APIs, payment behavior, dependencies, data-retention changes and
  security-model changes require a proposal issue before implementation.
- Maintainers seek rough consensus and document the decision in the issue or
  pull request.
- When consensus is not possible, the maintainer responsible for the affected
  area decides and records the reasoning.

No governance decision may introduce custody, conceal fees, weaken secret
handling or present synthetic activity as external adoption.

## Becoming a maintainer

A contributor may be invited after sustained, high-quality participation that
demonstrates:

- sound technical judgment;
- respectful and reliable review;
- understanding of non-custodial and Solana security boundaries;
- care for documentation, tests and backward compatibility.

There is no contribution-count threshold. Maintainer access follows least
privilege and may be removed after prolonged inactivity, policy violations or at
the maintainer's request.

## Releases

MeterKit follows semantic versioning after `1.0.0`. Before then, minor versions
may contain breaking changes, which must be called out in release notes and the
changelog. Releases are cut from protected, reviewed commits with passing CI.

## Commercial activity

The Apache-2.0 project remains usable independently of the hosted service.
Commercial integrations, hosting and support do not grant ownership of community
contributions or permit private changes to the public security record.
