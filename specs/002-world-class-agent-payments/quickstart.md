# Validation Quickstart: World-Class Agent Payments

This guide defines acceptance evidence; it does not claim that future external
pilots or upstream acceptance already exist.

## Prerequisites

- Node.js 22+ (Node.js 24 for release/staged-publish validation), pnpm 11+,
  Docker and a clean temporary directory.
- Disposable Solana devnet payer/provider wallets with test SOL and test USDC
  only for signed scenarios.
- No mainnet configuration, real funds, private keys in the repository, or
  long-lived registry token.

## Scenario A: registry and release trust

1. Query registry metadata for every declared public package and reconcile it
   with repository versions and release history.
2. Pack each release candidate and inspect its allowlisted files, dependencies,
   license, repository URL, integrity and clean-project import.
3. Generate and validate the release manifest, compatibility report and SBOM.
4. Execute the release workflow in dry-run, then stage through OIDC only after
   the owner has configured the npm trusted publisher.

Expected: no workspace dependency leaks, no secret token is required, 0.1.0
history remains factual, and a staged candidate is traceable to one CI-green
commit. Publication requires explicit human 2FA approval.

## Scenario B: five-minute initializer

1. Pack the initializer and primary packages.
2. From an empty temporary project, run dry-run JSON for each surface.
3. Generate Express, Next route, Hono and MCP projects without maintainer edits.
4. Run diagnostics and request the protected operation without payment.

Expected: deterministic safe files, devnet-only configuration, no signing
secret handling and a correct HTTP/MCP payment challenge in under five minutes.
Traversal, symlink escape, non-empty target and mainnet inputs fail before write.

## Scenario C: full paid parity

For every maintained surface, execute challenge, 0.01 test-USDC settlement,
retry, protected result, durable finalized receipt, Explorer navigation and
proof replay.

Expected: provider balance increases directly by the declared amount; all
surfaces expose equivalent terms/receipt semantics; replay is rejected without
duplicate protected execution. Evidence is internal validation, not a pilot.

### Executed baseline — 2026-08-10 UTC

`pnpm quickstart:clean` packed core, SDK and `create-meterkit`, installed the
initializer outside the monorepo and generated all 16 combinations of Express,
Next route, Hono and MCP with pnpm, npm, Yarn and Bun. Every generated surface
installed successfully and returned its expected unpaid HTTP/MCP 402 contract.

`pnpm initializer:devnet` then generated a fresh Express provider from the
packed initializer, installed only packed candidate artifacts, challenged a
disposable internal agent, settled 10,000 atomic test-USDC directly to provider
wallet `9a4xvgAdtPxJf7eifkCTpUwwqd8Q8u8L6QJzwCCeaiR5`, returned the protected
HTTP 200 result and rejected reuse with HTTP 402. Provider balance changed from
190,000 to 200,000 atomic units. The transaction reached confirmed settlement
through the generated middleware; its sanitized fingerprint is
`11cc347efe88610e`. The ignored mode-0600 evidence artifact contains the exact
devnet Explorer URL for local review without putting a complete signature in
repository logs. This is internal synthetic validation, not external adoption.

## Scenario D: searchable bilingual documentation

Build and run the production documentation site. Test keyboard and mobile
navigation, search, version labels, broken links, claim-key parity, loading,
empty/error recovery, contrast, console output and reduced motion.

Expected: recommended integration, compatibility and troubleshooting are each
reachable in at most three actions; maintained English and Spanish pages make
equivalent technical/security claims.

## Scenario E: bounded agent authorization

Create a devnet allowance with owner, delegate, exact test-USDC mint, resource
scope, per-request cap, aggregate cap and expiry. Inspect it, spend within
bounds, race concurrent over-budget attempts, revoke it and retry.

Expected: accepted spend never exceeds the aggregate cap; wrong/revoked/
expired/out-of-scope attempts fail before protected execution; receipt and
Explorer evidence remain inspectable; owner retains protocol-native revocation.

### Executed allowance lifecycle — 2026-08-10 UTC

`pnpm --filter @usemeterkit/subscriptions-client
verify:agent-budget:devnet` used disposable internal wallets and the official
Solana Subscriptions program on devnet. Owner
`8SJE3aVLPpPgh5qsYJppsgdXdWusYUmJy3gfGKDEPsqS` authorized delegate
`9a4xvgAdtPxJf7eifkCTpUwwqd8Q8u8L6QJzwCCeaiR5` for at most 15,000 atomic
test-USDC. Two distinct 10,000-atomic delegated transfers raced: exactly one
finalized and one was rejected, so the receiver balance changed from 210,000
to 220,000 atomic units without exceeding the authorization.

The owner then revoked delegation
`8BR9z7xkHbuArN5HLyCzNvqB9ebDLAqzkAqq3CYuSNBm`; its account closed, a later
delegated transfer failed, and the subscription authority was closed. All five
successful lifecycle transactions reached finalized commitment. Their
sanitized fingerprints are `ff9e43410c72b94b` (init),
`db67cbfa36d490ce` (create), `905a1562fd732230` (spend),
`f1dcd0f007cecdba` (revoke) and `5e9e690cd5451b03` (authority close). Exact
Explorer URLs are retained only in the ignored mode-0600 evidence artifact
`artifacts/world-class-evidence/agent-budget-devnet.json`, preventing complete
signatures from entering repository logs. This is internal devnet validation,
not external adoption or revenue.

### Executed paid MCP lifecycle — 2026-08-10 UTC

`pnpm --filter @usemeterkit/mcp-scout pay:devnet anza-xyz/kit` used the
disposable internal buyer `HjZRrfm6G9C7RdzbzQ7u98jp6iQuE4SYgfqkuRHUiQdb`.
The official x402 MCP client accepted only the exact devnet network, test-USDC
mint, `20,000` atomic amount, recipient
`9a4xvgAdtPxJf7eifkCTpUwwqd8Q8u8L6QJzwCCeaiR5` and
`mcp://tool/scout_project` resource within a 20,000-atomic session cap. The
payment finalized at slot `482690211`, returned the sourced `anza-xyz/kit`
report, and reuse of the identical payment payload was rejected. Its sanitized
transaction fingerprint is `ca99a195271236a5`. The complete signature remains
only in ignored mode-0600 artifact
`artifacts/world-class-evidence/mcp-devnet.json`. This is internal devnet
validation, not a pilot, customer or revenue claim.

## Scenario F: performance and resilience

Run unpaid/policy workloads at three levels and paid-retry validation at the
declared concurrency. Induce RPC, facilitator and persistence outages. Validate
benchmark evidence against its schema.

Expected: local and external latency are separated; zero duplicate protected
executions; recoverable unknown states are not converted to definitive failure;
environment and uncertainty are recorded.

## Scenario G: independent evidence

Only after A–F pass, invite external developers through the public pilot path.
Record consent, package version, assistance, activation stages, finalized
payment to their own provider wallet, replay outcome and seven-day repeated use.

Expected: three genuine integrations, two without implementation assistance,
and one with ten valid payments in seven days. Until then these outcomes remain
open. Submit one bounded upstream proposal and report its public status exactly.

## Mandatory gates

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
DATABASE_TEST_URL=postgresql://meterkit:meterkit@localhost:5432/meterkit pnpm test
pnpm build
pnpm test:e2e
pnpm audit --prod
pnpm quickstart:clean
pnpm compatibility:verify
pnpm world-class:evidence
```

CI additionally performs dependency review, CodeQL, secret scanning, container
scanning, SBOM generation, packed-artifact verification and release-manifest
validation. Signed devnet commands must accept only ignored disposable keypair
paths and sanitize operational logs.

### Local release-gate result — 2026-08-10 UTC

Formatting, lint, typecheck, 182 Vitest tests plus 15 Node tests, production
build, 16 clean initializer/package-manager combinations, documentation parity,
compatibility, benchmarks, 10 Playwright E2E tests and production dependency
audit passed. `@hono/node-server` was upgraded to 2.1.0 after the audit exposed
the patched path-traversal advisory; the repeated production audit reported no
known vulnerabilities. Gateway and web images built successfully and Trivy
reported zero high/critical findings for both. Source and image SPDX SBOMs were
generated locally. Dependency Review and CodeQL remain CI checks for the exact
committed candidate and must not be reported as executed for this dirty working
tree.

The evidence runner also inspected the landing at 1440×1000 and 390×844 with
reduced motion: HTTP 200, one H1, keyboard focus, no horizontal overflow and no
page/console errors. Separate axe checks on landing and docs returned zero WCAG
A/AA violations; gradient-backed text and decorative glyphs remained manual
contrast review items rather than being promoted to automated passes.
