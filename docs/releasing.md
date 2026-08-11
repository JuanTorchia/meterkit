# Releasing MeterKit packages

MeterKit stages releases from the GitHub-hosted `Stage npm packages` workflow.
CI receives only a short-lived npm OIDC identity; it does not receive a
long-lived publish token. Staging never makes a version public. A maintainer
must inspect each staged tarball and approve it with npm 2FA.

## Source of truth and verification rules

Do not infer npm owner or trusted-publisher state from `npm whoami` on a
developer machine. That command only reports the current local interactive
session; npm explicitly states that it does not report OIDC authentication.
Likewise, a successful `workflow_dispatch` dry run verifies CI, packaging and
SBOM generation, but it intentionally skips `npm stage publish` and therefore
does not prove that npm accepted the OIDC identity.

Use these independent checks instead:

| Question                          | Authoritative evidence                                                                                     |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Is a version public?              | `npm view <package> version --json` and registry metadata                                                  |
| Who owns the existing package?    | Registry `maintainers` plus the authenticated npm package settings                                         |
| Is Trusted Publishing configured? | npm package **Settings → Trusted publishing**; this is not exposed by the public registry metadata         |
| Did OIDC work?                    | A non-dry-run GitHub Actions log where `npm stage publish` succeeds, followed by the staged-package record |
| Did the release become public?    | Maintainer 2FA approval, public registry version, provenance attestation and clean external installation   |

Verified on 2026-08-11 UTC: `jtorchia` owns the public
`@usemeterkit/core@0.1.0` and `@usemeterkit/sdk@0.1.0` packages. The unscoped
`create-meterkit@0.0.0` package was claimed at `2026-08-11T15:35:44.621Z` as a
non-executable bootstrap ownership record containing only `package.json` and
`README.md`. Its SHA-1 is `b80ebb801f555cc867f5401753ccda1a13620a73` and its
SHA-512 integrity is
`sha512-lto3E2wblXyQ1/J2EHxJ8E4x1eTeHv+xDMjrse3xmRFEZmbdOEJzsmSNLsOmZdTH9xgjHUdiljB6Km7T0M6Nng==`.
GitHub stores no npm publishing secret; this is expected for the tokenless OIDC
workflow. Run `31461094565` is a successful dry run, not an OIDC publication.

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
The bootstrap claim is complete. The npm settings for all three packages were
then verified with repository `JuanTorchia/meterkit`, workflow `release.yml`,
environment `npm-stage`, and only the `npm stage publish` permission enabled.

## Release procedure

1. Merge a version-aligned change only after required CI succeeds.
2. Create a signed `vMAJOR.MINOR.PATCH` release pointing to that exact commit.
3. Approve the `npm-stage` GitHub environment after comparing the commit.
4. Download and inspect the SBOM and staged tarballs.
5. In npm's **Staged Packages** UI, approve each intended artifact with 2FA.
6. Verify registry integrity, provenance and the clean-consumer smoke test.
7. Generate the immutable release manifest and attach it to the release.

## Initial `create-meterkit` and 0.2.0 checklist

The owner-gated sequence and its current status are deliberately explicit:

1. **Complete (2026-08-11):** publish an initial, reviewed `create-meterkit`
   version through an
   authenticated npm owner session, because npm cannot stage or configure trust
   for a package that does not exist. Record its exact version and integrity.
2. **Complete (2026-08-11):** in npm, confirm the existing core and SDK Trusted
   Publisher settings and add
   the same configuration to `create-meterkit`: repository
   `JuanTorchia/meterkit`, workflow `release.yml`, environment `npm-stage`, and
   permission `npm stage publish` only.
3. **Complete (2026-08-11):** create the `v0.2.0` GitHub release from the exact CI-green `main`
   commit. Approve the protected GitHub environment only after comparing the
   SHA. The workflow stages all three reviewed tarballs through OIDC.
4. **Complete (2026-08-11):** inspect the staged artifacts, approve each with npm 2FA, then verify public
   versions, provenance, integrity, version-matched documentation and clean
   installation before marking T079 complete.

The final release commit is `23bfc3aa5808efa99b0df40147e5134e5f44c54e`;
CI run `31514965332` and staged-publication run `31515787660` succeeded. The tag
is not GPG-signed because no signing key was configured; npm provenance binds
each artifact to the GitHub Actions source and build instead. See
`docs/releases/0.2.0.md` for immutable registry facts.

Never mark steps 1–4 complete merely because the packages were packed locally,
because a dry run passed, or because a local npm token once existed.

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
