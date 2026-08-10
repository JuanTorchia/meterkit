# Research: World-Class Agent Payments

**Consulted**: 2026-08-10 UTC. Technical decisions use official project,
registry or vendor documentation and current repository evidence.

## Decision 1: Treat npm 0.1.0 as a baseline release, not an unpublished project

**Decision**: Preserve `@usemeterkit/core@0.1.0` and
`@usemeterkit/sdk@0.1.0` as historical releases. Verify their registry tarballs
and document that they were published on 2026-08-10. Move future releases to
GitHub-hosted OIDC trusted publishing, initially stage-only with human 2FA
approval. Do not rewrite or imply provenance for 0.1.0 when registry metadata
does not expose an attestation.

**Rationale**: Registry inspection confirms both packages exist publicly. npm's
current official guidance prefers trusted publishing over long-lived tokens,
automatically creates provenance for public GitHub packages, and supports staged
publishing as an additional review gate. Staging requires npm CLI 11.15+ and
Node 22.14+; the repository can validate on Node 24 while retaining Node 22 as
the consumer floor.

**Alternatives considered**: Delete/reissue 0.1.0 (immutable registry history
makes this misleading); token-based automation (persistent credential risk);
direct automatic publish (weaker first-release review).

**Sources**: <https://docs.npmjs.com/trusted-publishers/>,
<https://docs.npmjs.com/staged-publishing/>,
<https://docs.npmjs.com/generating-provenance-statements/>, npm registry metadata
for `@usemeterkit/core@0.1.0` and `@usemeterkit/sdk@0.1.0`.

## Decision 2: Publish a deliberately small package graph

**Decision**: Core and SDK remain the primary public pair. Assess subscriptions,
pilot CLI and optional Webacy adapter for later publication only after clean
consumer tests and ownership configuration. Keep the PostgreSQL package internal
until a documented self-hosted use case requires a stable public API. Introduce
`create-meterkit` as a leaf package only after its name is claimed and tarball
fixtures pass.

**Rationale**: A smaller supported graph reduces release blast radius and gives
developers one recommended path. Current package metadata marks six packages as
publishable, while the release workflow publishes four and npm currently shows
only core/SDK; the mismatch must be resolved explicitly.

**Alternatives considered**: Publish every workspace package immediately
(unsupported contracts); bundle all behavior into the SDK (larger dependency
and security surface); publish the gateway (confuses hosted runtime with SDK).

## Decision 3: Upgrade x402 only behind a compatibility matrix

**Decision**: Evaluate the official x402 2.21.0 packages as one coordinated
upgrade from the pinned 2.20.0 set. Keep protocol packages version-aligned and
require existing Express, Next and MCP journeys plus the new Hono journey to
pass before adoption. Preserve MeterKit's value in policy, exact scope, durable
receipts, finality and bounded spending rather than forking wire semantics.

**Rationale**: Registry evidence on 2026-08-10 reports 2.21.0 for core, Express,
SVM, MCP and Hono, all from the x402 Foundation Apache-2.0 repository. Version
alignment reduces subtle scheme/transport drift.

**Alternatives considered**: Remain indefinitely on 2.20.0 (misses supported
fixes); loose independent ranges (untested combinations); custom protocol fork
(violates interoperability).

**Sources**: <https://github.com/x402-foundation/x402>,
<https://solana.com/developers/guides/getstarted/intro-to-x402>, npm registry
metadata for the official `@x402/*` packages.

## Decision 4: Keep official Solana Subscriptions & Allowances as the agent-budget foundation

**Decision**: Continue using `@solana/subscriptions@0.4.0` and its shared Solana
program. Keep its required Solana Kit 6.x dependency isolated in the
subscriptions package while x402 surfaces remain on their independently tested
Kit version. Present one MeterKit authorization view across fixed allowances,
recurring allowances and subscription plans without hiding the underlying
onchain owner/delegate/revocation semantics.

**Rationale**: Solana Foundation describes the shared program as audited,
open-source and live, with fixed allowances, recurring allowances and
subscription plans explicitly intended for API billing and bounded agent spend.
The package declares a Kit 6.x peer dependency; forcing a monorepo-wide major
upgrade would create unrelated payment risk.

**Alternatives considered**: Custom allowance program (audit and ecosystem
burden); offchain database budgets alone (not owner-sovereign); force one Kit
major everywhere (unnecessary coupling).

**Sources**: <https://solana.com/news/subscriptions-and-allowances>,
<https://github.com/solana-foundation/subscriptions>, npm registry metadata for
`@solana/subscriptions@0.4.0`.

## Decision 5: Build documentation as a product inside the existing web app

**Decision**: Add Fumadocs 16 to the existing Next.js App Router application,
use versioned local content and local search, and maintain English and Spanish
technical paths with automated heading/claim parity. Keep the landing and
dashboard visually distinct from reference documentation but within one domain.

**Rationale**: The current website already uses the current App Router and owns
security/accessibility deployment. Fumadocs provides purpose-built navigation,
source handling, search and documented internationalization while remaining
MIT-licensed. Local search avoids a hosted search dependency during early
adoption.

**Alternatives considered**: Hand-build documentation UI (high maintenance);
separate docs repository/deployment (split release truth); hosted proprietary
search (premature operational dependency).

**Sources**: <https://nextjs.org/docs/app>,
<https://www.fumadocs.dev/docs/internationalization>, npm registry metadata for
`fumadocs-core@16.14.3`, `fumadocs-ui@16.14.3` and Orama.

## Decision 6: Make the initializer deterministic, offline-testable and secretless

**Decision**: Create a small initializer with explicit Express, Next route,
Hono and MCP templates. It validates inputs before writing, never generates or
requests a private key, defaults to devnet placeholders, refuses non-empty
targets unless explicitly safe, and supports a dry-run machine-readable plan.
Templates are versioned with the CLI and tested from packed artifacts using
multiple package managers where practical.

**Rationale**: The initializer is the shortest path to the five-minute KPI, but
scaffolding is a supply-chain and destructive-write boundary. Deterministic
plans and fixture tests make generated output reviewable.

**Alternatives considered**: Documentation-only copying (more transcription
errors); remote templates (mutable supply-chain dependency); interactive wallet
creation (unsafe responsibility).

## Decision 7: Add Hono as the only new framework surface in this phase

**Decision**: Maintain Express, Next route handlers and MCP, and add Hono through
the official x402 adapter. Defer Fastify, Nest, edge-specific variants and other
chains until observed requests justify them.

**Rationale**: Hono is a common lightweight agent/API surface and the official
x402 package exists at the coordinated version. One bounded addition tests that
MeterKit's canonical contracts are genuinely adapter-neutral without turning
the phase into framework collection.

**Alternatives considered**: No new framework (less competitive coverage); many
frameworks at once (maintenance dilution); custom adapter protocol (unnecessary).

## Decision 8: Benchmark supported behavior, not vanity throughput

**Decision**: Publish a reproducible harness with three workload levels,
separating local MeterKit overhead from external RPC/facilitator latency. Record
environment, exact commit, workload, percentiles, errors, unknown states,
replays, protected executions and duplicates. Initial acceptance is correctness
at 100 concurrent unpaid/policy requests and 25 concurrent paid-retry
verifications; results define the supported envelope rather than claiming
universal production capacity.

**Rationale**: Early infrastructure needs credible limits and recovery evidence.
Public devnet variability makes a single transactions-per-second number
misleading.

**Alternatives considered**: Publish only peak throughput (not representative);
omit benchmarks until mainnet (delays operational trust); include third-party
latency as MeterKit overhead (false attribution).

## Decision 9: Distribution evidence outranks a speculative rebrand

**Decision**: Keep MeterKit during implementation. Evaluate domain, package,
repository, search, social and trademark conflicts in a scored brand assessment
after the onboarding language and pilot feedback stabilize. Rename only if the
evidence shows material confusion or availability risk and a compatibility
migration is ready.

**Rationale**: The `@usemeterkit` namespace and public 0.1.0 history now carry
real continuity. An aesthetic rename would spend reputation without proving
adoption.

**Alternatives considered**: Immediate rename (breaks fresh distribution);
never assess the brand (ignores long-term conflict); buy a domain before product
language stabilizes (premature cost).
