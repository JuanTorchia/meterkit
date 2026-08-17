# Research: Self-Service Activation

## Initializer boundary

**Decision**: Keep `create-meterkit` solely as a scaffolder. In a TTY, the bare
command asks for directory, supported surface, detected package manager, public
devnet recipient and whether to install. Non-interactive use requires complete
flags; `--yes` applies documented defaults and performs installation.

**Rationale**: The current documented bare command fails, parsed flags do not
affect output, and generated instructions disagree with the selected package
manager. One atomic generation model can make every invocation truthful.

**Alternatives considered**: Leaving it non-interactive keeps the advertised
path broken. Turning it into an all-purpose operational CLI couples project
creation to payment operations and their security lifecycle.

## Public operational tooling

**Decision**: Publish `@usemeterkit/cli` with bin `meterkit` and bounded commands
`check`, `doctor`, `verify`, and `pay --replay`. Reuse the strict verifier and
existing example payer logic, but do not make `@usemeterkit/pilot` part of setup.

**Rationale**: Settlement and replay currently require monorepo-only scripts.
Separating operations from scaffolding gives generated projects pinned local
commands and a stable public interface.

**Alternatives considered**: Publishing the pilot package conflates activation
evidence with provider operations. A programmatic client package is premature.

## Golden-path scope

**Decision**: Optimize create → configure → run → check a valid 402 without
funds, Docker or PostgreSQL. Present disposable payment, protected response and
replay as an explicit second lane.

**Rationale**: Faucet, ATA, RPC and finality add external failure modes. A first
402 isolates distribution/onboarding quality while the second lane proves the
payment lifecycle.

**Alternatives considered**: One end-to-end promise is simpler marketing but
makes failures uninterpretable and cannot honestly promise ten minutes.

## Durable replay protection

**Decision**: Preserve `PaymentStore` and add a standalone PostgreSQL adapter to
`@usemeterkit/database`. Store a one-way signature replay key unique by network
with bounded sanitized metadata. The unique insert is the concurrency authority
and duplicates normalize to `PAYMENT_REPLAYED`.

**Rationale**: Hosted `PostgresStore` requires a registered product and gateway
schema, so it is not standalone. Atomic uniqueness prevents concurrent requests
or restart from executing the protected handler twice.

**Alternatives considered**: Memory loses replay state. File/JSON is unsafe
across crashes and replicas. The hosted schema invents tenant data. A future
`consume(record)` API is cleaner but unnecessary for this compatible slice.

## Durability modes

**Decision**: Generated projects declare `memory` or `postgres`. Memory prints a
non-durable demo warning. PostgreSQL requires `DATABASE_URL`, runs or checks its
narrow idempotent migration, and fails closed when unavailable.

**Rationale**: First 402 stays infrastructure-free while paid serving survives
restart. Silent inference or fallback would create a security regression.

**Alternatives considered**: PostgreSQL by default harms activation. Inferring
from `NODE_ENV` or silently falling back is ambiguous and unsafe.

## Secrets and replay sessions

**Decision**: Payment uses a local keypair path, displays and enforces exact
terms before signing, and never accepts key material or payment headers through
argv. Prefer pay and replay in one process; if a session must persist, use an
explicit permission-restricted file with minimum data and immediate deletion.

**Rationale**: Shell history, process listings, logs and uploaded evidence are
common leakage paths. The CLI can prove replay without exposing the proof.

**Alternatives considered**: Passing headers or private keys as flags is easy to
script but violates the security boundary.

## Supported compatibility matrix

**Decision**: Beta HTTP support is Node 22, Express/Next/Hono, npm and pnpm, on
Linux/macOS/Windows. Express is canonical. MCP stdio remains experimental until
its native payment handshake has a dedicated check contract; it must not be
reported as HTTP activation. PR checks use Ubuntu/pnpm/all supported surfaces;
release candidates use Ubuntu/npm+pnpm/all supported surfaces; post-publish
repeats the six registry cells. macOS/Windows run npm anchors for Express and
Next. Yarn/Bun are experimental.

**Rationale**: Surface variation is mainly dependency/runtime risk; OS variation
is mainly path/process risk. MCP's stdio transport is materially different from
an HTTP URL, so claiming the same check would be false evidence. This matrix
catches supported risks without conflating transports.

**Alternatives considered**: Claiming every parsed manager is dishonest. A full
matrix each PR is costly and flaky for one maintainer.

## Evidence and commercial positioning

**Decision**: Maintain separate synthetic registry-verification and external
activation ledgers. The primary CTA is a bounded five-person free devnet beta,
with neither charge nor tester compensation. USD 100 is a separate optional
done-for-you service and becomes primary only after the spec gate.

**Rationale**: Downloads, stars, CI and maintainer transactions do not establish
adoption. External completion diagnoses onboarding; paid scope diagnoses WTP.

**Alternatives considered**: Asking USD 100 first mixes trust, activation and
price risk. Paying testers measures compensated labor, not product pull.

## Brand and domain

**Decision**: Fix contradictions, maintainer/support identity and factual trust
surfaces now. Treat a dedicated domain and visual identity as follow-up.

**Rationale**: A domain improves perception but cannot repair a failing command
or absent third-party proof.

**Alternatives considered**: Rebranding first does not identify whether the
blocker is discovery, setup, settlement or retained value.
