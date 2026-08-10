# Validation Quickstart: AAA Developer Adoption

## Verification record — 2026-08-10 UTC

- clean packed SDK import: passed without workspace resolution;
- HTTP challenge: Express and gateway contract tests passed;
- Next.js route: production build and contract test passed;
- MCP: tool advertisement and unpaid x402 challenge passed;
- PostgreSQL receipt replay/concurrency/finality transitions: passed;
- complete suite: 128/128 unit/integration tests and 7/7 browser E2E passed;
- npm production audit: no known vulnerabilities;
- Trivy gateway/web: 0 HIGH or CRITICAL fixed vulnerabilities.

Two fresh internal journeys were completed with disposable wallets and test-only
assets. No mainnet assets or real funds were used, and neither journey is counted
as an external pilot or revenue:

- HTTP x402: 0.01 test USDC (10,000 atomic units) moved directly from payer
  `8SJE...EPsqS` to provider `9a4x...eaiR5`; the provider balance increased from
  150,000 to 160,000 atomic units, PostgreSQL indexed the receipt as `finalized`,
  and reuse of the same proof returned HTTP 402. [Explorer evidence](https://explorer.solana.com/tx/3Hpch7aaRzKdMuN3dC1s3tnaWNhZttwkG9BRgiPJL6i9yJBt9T6SM7CoQy9pEeVmzYJQS2eXzhSNZzLHZpjQPXqD?cluster=devnet).
- Solana Project Scout MCP: 0.02 test USDC (20,000 atomic units) settled for
  `anza-xyz/kit`; the protected tool returned a dated report sourced from the
  GitHub public API and repository. [Explorer evidence](https://explorer.solana.com/tx/2WCHimyCsaT6eMoaUzhoz9cFSwohxwmWuRbS3pzggtUrBMbetKEZmedq1ji6PpWVRa7a2w97xAvxEWV4k1Gtjzns?cluster=devnet).

The HTTP run is the replay/finality evidence for this feature. MCP preview and
receipt reuse remain covered by durable restart/replay tests; the fresh paid MCP
run proves live settlement and protected output against devnet.

This guide validates the feature; it is not the eventual public onboarding copy.

## Prerequisites

- Node.js 22+, pnpm 11+, Docker, and a disposable Solana devnet wallet address.
- Test USDC and enough devnet SOL for the client signer. Never use mainnet assets.
- Repository dependencies installed with `pnpm install --frozen-lockfile`.

## Scenario A: clean challenge

1. Build the published-package candidate: `pnpm build:packages`.
2. Start the Express quickstart with a provider devnet address.
3. Run `meterkit-pilot diagnose` against its config.
4. Request the protected route without payment.

Expected: diagnostics pass, response is HTTP 402, and the challenge matches the
configured network, mint, maximum amount, recipient, and exact resource.

## Scenario B: paid response and replay

1. Use the disposable client signer outside MeterKit to pay the challenge.
2. Retry the exact request with the resulting x402 payment payload.
3. Save the sanitized public receipt and protected response.
4. Retry the proof again and run `meterkit-pilot evidence`.

Expected: first paid retry returns the resource, receipt reaches confirmed or
finalized, Explorer points to devnet, and replay is rejected without executing
the protected handler twice. No output includes secret material or full signature.

## Scenario C: maintained surface parity

Run the equivalent validation commands for Express, Next.js route handler, and
the MCP Scout paid tool from clean installs.

Expected: all surfaces use the documented public packages and yield equivalent
challenge, settlement, receipt, and rejection outcomes.

## Scenario D: optional risk policy

Run adapter contract fixtures for allow, warn, deny, timeout, rate limit, invalid
schema, oversized response, and unavailable provider. Then remove the optional
package/configuration and repeat Scenario A.

Expected: decisions match configured policy, secrets are absent from evidence,
and the unconfigured core path is unchanged.

## Mandatory repository gates

```bash
pnpm lint
pnpm typecheck
DATABASE_TEST_URL=postgresql://meterkit:meterkit@localhost:5432/meterkit pnpm test
pnpm build
pnpm test:e2e
pnpm audit --prod
```

Run the clean-package, compatibility, supply-chain, visual, and devnet evidence
commands added by the implementation tasks. Deployment remains forbidden until
all applicable gates pass and the exact CI-green commit is selected.
