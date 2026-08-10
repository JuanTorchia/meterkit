# Research: AAA Developer Adoption

## Decision 1: Build on official x402 instead of replacing it

**Decision**: Keep `@x402/core`, `@x402/express`, and `@x402/svm` as the protocol
implementation. MeterKit adds policy enforcement, durable receipts, developer
workflow, and operational evidence.

**Rationale**: The official project already supports multiple server frameworks
and MCP. Solana's official guide also lists Corbits, MCPay, PayAI, and the
reference SDK, so protocol reimplementation is not a defensible wedge.

**Alternatives considered**: Custom x402 wire implementation (rejected: drift and
security burden); generic hosted proxy (rejected: pay.sh/MCPay compete directly
and self-hosting is a MeterKit advantage).

**Sources**: <https://github.com/x402-foundation/x402>,
<https://solana.com/developers/guides/getstarted/intro-to-x402>

## Decision 2: One canonical API with compatibility wrappers

**Decision**: Add `protect(options)` as the recommended Express entry point. Keep
existing exports in 0.1 with deprecation documentation rather than deleting them.

**Rationale**: A new developer needs one obvious path, while existing consumers
need a migration window. `protect()` can validate configuration before returning
the upstream protocol-native middleware.

**Alternatives considered**: Rename existing functions only (rejected: breaking);
publish a second full SDK (rejected: fragments documentation and maintenance).

## Decision 3: Activation means settlement, not only HTTP 402

**Decision**: The default quickstart and CLI distinguish `diagnose`, `challenge`,
and `settlement` stages. A passed activation requires a protected response,
sanitized receipt, finality evidence, and rejected replay.

**Rationale**: The current verifier proves readiness but explicitly not payment.
The product's value is the paid result, so challenge-only evidence is insufficient.

**Alternatives considered**: Keep challenge as primary success (rejected: false
activation); automate wallet custody (rejected: violates non-custodial design).

## Decision 4: Stable receipt and event contracts

**Decision**: Introduce a versioned public receipt view separate from the internal
database row, plus an optional sanitized event sink. Signatures are represented
by an irreversible short fingerprint and an Explorer URL may be emitted only when
the caller explicitly requests it from the full signature in-process.

**Rationale**: Database records and public evidence have different sensitivity and
evolution needs. A versioned view allows telemetry and CLI output without leaking
complete signatures.

**Alternatives considered**: Return database rows directly (rejected: leakage and
tight coupling); suppress all identifiers (rejected: prevents correlation).

## Decision 5: Generic policy interface, Webacy leaf adapter

**Decision**: Core defines an asynchronous `PaymentPolicyEvaluator`; the SDK
orchestrates ordered evaluators; `@usemeterkit/policy-webacy` maps Webacy results to
allow/warn/deny/error. No core package imports or references Webacy.

**Rationale**: Webacy documents full Solana support and risk intelligence for
wallets, transactions, URLs, and AI policy engines. The grant provides API credits,
not confirmed cash, and must not create vendor lock-in.

**Alternatives considered**: Embed Webacy in core (rejected: proprietary mandatory
dependency); create a generic compliance platform (rejected: scope expansion);
omit partnership (rejected: loses useful differentiation and distribution).

**Sources**: <https://docs.webacy.com/introduction>,
<https://docs.webacy.com/supported-blockchains>,
<https://superteam.fun/earn/grants/startup-accelerator-grant>

## Decision 6: Explicit external dependency failure semantics

**Decision**: Each policy declares timeout, fail mode, maximum response bytes, and
cache freshness. The default is fail-closed for deny-capable pre-payment safety
policies; deployments may explicitly select fail-open and receipts must record it.

**Rationale**: Silent fallback makes policy claims misleading. Bounded and visible
failure behavior protects latency, availability, and operator expectations.

**Alternatives considered**: Infinite retry (rejected: request exhaustion); global
fail-open (rejected: bypasses intended safety); global fail-closed (rejected: can
make optional providers operationally mandatory).

## Decision 7: Opt-in pilot evidence instead of tracking SDK users

**Decision**: The CLI writes local evidence and exports a minimized pilot report
only when the participant requests it. No hidden SDK telemetry is added.

**Rationale**: This preserves developer trust and makes assistance level and proof
quality explicit. GitHub/npm vanity metrics remain secondary diagnostics.

**Alternatives considered**: Mandatory analytics (rejected: privacy and OSS trust);
manual claims without evidence (rejected: unverifiable).

## Decision 8: No broad framework abstraction in this cycle

**Decision**: Express is the supported SDK integration; Next.js and MCP are
maintained examples/adapters that prove contract parity. General Fastify/Hono and
multi-chain work remain out of scope.

**Rationale**: Three validated journeys are enough to learn from pilots; additional
adapters would reduce completion quality and delay activation.

**Alternatives considered**: Implement every x402-supported framework (rejected:
duplicated upstream surface and insufficient demand evidence).
