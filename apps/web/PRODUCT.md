# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary — the API/MCP provider.** A developer who already runs an HTTP API or an MCP tool and wants to charge per request without building billing. Their situation: they have a working endpoint and no payment rail, and the alternatives require an account, a merchant relationship, and a platform that holds their money. Their job on this site is to decide whether to route real revenue through third-party middleware — so the decision is about trust and verifiability before it is about features.

**Secondary — the agent developer.** Someone building an autonomous client that must pay for APIs and MCP tools on its own. Their job is to give that agent a bounded, revocable USDC budget over standard HTTP, without handing it custody of a wallet or a card. This audience gets a clear secondary lane, not the hero.

## Product Purpose

MeterKit turns a single API call into a settled USDC payment. A provider sets a price, adds TypeScript middleware to a route, and the customer pays the provider's wallet directly; MeterKit never takes custody of funds and never stores user private keys. Success is a provider going from an unpriced endpoint to a verified on-chain settlement in minutes, and being able to prove that settlement to a third party without trusting MeterKit.

## Positioning

MeterKit is an implementation of the open x402 standard on Solana — not an alternative to it. The differentiators a neighboring product could not truthfully copy in combination: Solana settlement, non-custodial by construction (no funds held, no keys stored), TypeScript middleware that drops into an existing stack, and Apache-2.0 open source. The product leans on x402's traction rather than competing with it.

## Operating Context

The evaluation scene is a developer with a terminal and an editor open, reading docs in one tab and a public dashboard in another. Adoption path: read the quickstart, install the SDK, protect one route, watch a request return HTTP 402, let a client pay, see the receipt finalize on Solana. The provider workspace is then used for recurring operation — publishing endpoints, setting prices, and watching settlements land. Documentation is consumed in both English and Spanish.

## Capabilities and Constraints

- Per-request pricing on HTTP APIs and MCP tools via the x402 flow: request → HTTP 402 with price → client validates policy → pays exact USDC → retries → protected result returned after settlement.
- Bounded, revocable allowances give autonomous clients a spending budget.
- Non-custodial: MeterKit does not hold funds and does not store user private keys.
- **Devnet only.** Real value must never be implied. The README's warning — _do not send mainnet assets_ — is a product fact the interface must carry, not hide.
- **Release status is uneven and must be stated accurately.** `@usemeterkit/core@0.1.0` and `@usemeterkit/sdk@0.1.0` are published to npm. `create-meterkit`, subscriptions and the pilot CLI are workspace candidates and must not be described as npm releases.
- Trilingual EN / ES / pt-BR across the site is a standing requirement, not a feature (`app/locale.ts`); documentation currently ships EN and ES. Every layout must survive Spanish and Portuguese string lengths, which run longest.
- Stack is fixed: Next.js App Router, Fumadocs for documentation, deployed alongside a Node gateway.
- Terminology to keep exact: x402, HTTP 402, USDC, settlement, receipt, allowance, provider, gateway, non-custodial. "Settlement" and "receipt" are literal on-chain events, never metaphors.

## Brand Commitments

The name is **MeterKit** — metering is in the product's own name and in what it does: counting discrete units of consumption and issuing a record for each one. No logo, wordmark, or typeface is currently committed; the existing visual treatment is explicitly anti-reference, not a constraint. Voice is plain and technical: it states what happens, does not sell, and does not apologize.

## Evidence on Hand

Real and usable:

- **Live devnet counter** — settled requests and accumulated USDC readable from the public gateway (`meterkit-api.juanchi.dev/health`) and the public dashboard (`meterkit.juanchi.dev`).
- **On-chain receipts** — Solana signatures anyone can verify in an explorer without trusting MeterKit.
- **Open-source signals** — CI and CodeQL workflow badges, Apache-2.0 license, the two published npm packages.

Explicit absences future work must not fabricate: no partner or customer logos, no named companies, no funding, no testimonials, no case studies, no mainnet volume, no revenue figures, no user counts. The three-developer external pilot exists but was deliberately excluded from site proof — it must not be presented as traction.

## Product Principles

1. **Verifiability outranks persuasion.** Every claim on the site should be checkable by the reader — a link to an explorer, a badge, a package on npm. Where a claim cannot be verified, it does not appear.
2. **Custody is the product.** Non-custodial is not a feature bullet; it is the reason to choose MeterKit. It belongs in the structure of the page, not in a list.
3. **State the limits in the same breath as the capability.** Devnet-only and uneven release status are stated plainly and early. Hiding them would destroy the trust the rest of the design is built to earn.
4. **The provider decides in minutes or not at all.** The path from landing to a working 402 is the primary conversion, so working code outranks description.
5. **Three languages, one layout.** No composition may depend on English string lengths.

## Accessibility & Inclusion

Keyboard focus must remain visible, reduced-motion preferences respected, and contrast sufficient for reading dense numeric data. The existing skip link is a baseline to preserve, not a ceiling.
