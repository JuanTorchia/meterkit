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

[x402 PR #3118](https://github.com/x402-foundation/x402/pull/3118) was opened as
a draft on 2026-08-11 for
[issue #3110](https://github.com/x402-foundation/x402/issues/3110). The bounded
documentation patch replaces complete payment-payload logging in the TypeScript
and Python lifecycle examples with explicitly selected requirement fields and
adds a warning about redeemable signatures and authorizations. It does not
change protocol behavior or introduce a MeterKit dependency.

Status: `proposed` — public draft awaiting the contributor's final human review
before requesting upstream maintainer review. It is not accepted or endorsed by
x402, and no merge outcome is claimed.
