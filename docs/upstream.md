# Upstream contribution policy

MeterKit should contribute standards-compatible improvements upstream when they
solve a general Solana, x402 or MCP problem without requiring a MeterKit fork.

A proposal is ready only when it:

- reproduces a bounded problem against a currently supported upstream version;
- benefits users outside MeterKit;
- preserves the upstream protocol and public API semantics;
- includes tests or evidence acceptable to the upstream project;
- follows that project's contribution and disclosure rules;
- contains no wallet secrets, private endpoints, fabricated adoption or
  mainnet-fund requirement.

Maintainers first open or identify an upstream issue unless the project asks for
direct pull requests. Public status must be one of `candidate`, `proposed`,
`under review`, `accepted`, `declined` or `withdrawn`, with a link and date.
`Proposed` is not described as accepted and an internal patch is not an upstream
contribution.

## Current factual status

No upstream proposal has been submitted for this feature as of 2026-08-10.
The selected candidate is
[x402 issue #3110](https://github.com/x402-foundation/x402/issues/3110), which
tracks examples that log complete payment payloads. MeterKit can contribute a
bounded documentation/example patch that replaces redeemable payload output in
TypeScript and Python examples with safe fields or a non-redeemable digest,
adds an explicit warning, and preserves protocol behavior. The candidate is
relevant beyond MeterKit and matches the fingerprint-only logging already used
by this repository.

Status: `candidate` — reviewed locally on 2026-08-10, not yet proposed by the
MeterKit maintainer. No pull request, acceptance or ecosystem endorsement is
claimed. Before changing the public status to `proposed`, the maintainer must
approve the exact upstream diff and its public submission.
