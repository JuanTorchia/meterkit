# Releasing MeterKit packages

MeterKit stages releases from the GitHub-hosted `Stage npm packages` workflow.
CI receives only a short-lived npm OIDC identity; it does not receive a
long-lived publish token. Staging never makes a version public. A maintainer
must inspect each staged tarball and approve it with npm 2FA.

## One-time npm owner setup

For `@usemeterkit/core`, `@usemeterkit/sdk`, and `create-meterkit`, configure the
trusted publisher in npm package settings with these exact values:

- GitHub owner/repository: `JuanTorchia/meterkit`
- workflow: `release.yml`
- environment: `npm-stage`
- allowed action: `npm stage publish` only

Create the protected `npm-stage` GitHub environment and require Juan's approval.
After one successful staging run, set npm publishing access to **require 2FA and
disallow tokens**, then revoke obsolete automation tokens. A brand-new package
cannot use staged publishing until its name has been claimed once.
`create-meterkit` is in the verified release allowlist, but the owner must claim
it manually before the first staged release; repository automation does not
represent that owner gate as complete.

## Release procedure

1. Merge a version-aligned change only after required CI succeeds.
2. Create a signed `vMAJOR.MINOR.PATCH` release pointing to that exact commit.
3. Approve the `npm-stage` GitHub environment after comparing the commit.
4. Download and inspect the SBOM and staged tarballs.
5. In npm's **Staged Packages** UI, approve each intended artifact with 2FA.
6. Verify registry integrity, provenance and the clean-consumer smoke test.
7. Generate the immutable release manifest and attach it to the release.

The workflow intentionally stages core, SDK and the initializer. Pilot,
subscriptions, database and policy packages remain outside the public allowlist
until their support contracts and ownership are approved.

## Emergency recovery

Do not overwrite or silently replace a published version. Reject an unapproved
stage. If a bad version was approved, deprecate it with a factual warning,
publish a reviewed patch from an approved commit, rotate/revoke any affected
credential and record the incident and rollback in the release manifest.

## Historical limitation

The public 0.1.0 core and SDK artifacts predate this workflow. npm did not expose
provenance attestations when checked on 2026-08-10, so MeterKit does not claim
provenance for them. See `docs/releases/0.1.0.md` for the immutable record.
