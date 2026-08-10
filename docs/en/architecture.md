# MeterKit architecture

Decision date: 2026-08-03. Last synchronized with the Spanish path: 2026-08-10.

## Summary

MeterKit is a non-custodial control plane. The client signs; the x402 facilitator
verifies and settles; USDC moves directly to the provider. MeterKit stores only
configuration, indexes and public receipts.

```text
Client/agent ──HTTP──> Gateway + @usemeterkit/sdk ──verify/settle──> x402 facilitator
     │                         │                                      │
     │ local signature         └── metadata/receipts ──> PostgreSQL   │
     └────────────────── Solana devnet USDC ──────────────────────────┘
                                      │
Provider <────────────── direct settlement + Explorer ────────────────┘
```

## Components

- `apps/web`: Next.js landing and dashboard; it never handles wallet secrets.
- `apps/gateway`: Express API, HTTP 402 policy, rate limiting and payment index.
- `packages/sdk`: publishable middleware and x402 facilitator adapter.
- `packages/core`: strict contracts, validation, receipts and storage interface.
- `packages/subscriptions`: isolated `@solana/subscriptions` integration.
- `examples/client`: x402 client with a signer supplied by the user.
- `examples/mcp-scout`: useful paid MCP server with one free preview.

## Core decisions

1. x402 v2 uses the `exact` scheme, Solana devnet CAIP-2 identifier and the
   `PAYMENT-REQUIRED`, `PAYMENT-SIGNATURE` and `PAYMENT-RESPONSE` headers.
2. Circle devnet USDC uses mint `4zMMC...DncDU` and six decimals; 0.01 USDC is
   `10000` atomic units.
3. The public `https://x402.org/facilitator` is testnet-only. Production requires
   an authenticated or self-operated facilitator.
4. Native subscriptions use the canonical `De1eg...R44` program. The UI exposes
   explicit revocation and never treats authority rotation as cancellation.
5. Kora remains optional: gas abstraction improves UX but is not required for
   direct provider settlement.
6. PostgreSQL is the hosted durable store. `MemoryPaymentStore` is only for
   deterministic tests and local evaluation.
7. No hosted fee is hidden. A fee may only be a separate, visible transfer signed
   by the payer; the open-source mode is 0%.
8. Product creation requires a five-minute Ed25519 wallet challenge consumed
   once. `Idempotency-Key` safely prevents duplicate writes.
9. Hosted sessions use random bearer tokens valid for one hour; PostgreSQL stores
   only SHA-256 hashes. Private products and payments are owner-filtered.
10. The hosted proxy accepts only explicitly allowlisted HTTPS origins, with no
    IP literals, credentials, alternate ports or redirects, and caps JSON output
    at 1 MB. Self-hosted middleware is preferred.
11. Wallet challenges are durable and atomically consumed in PostgreSQL.
12. Products use an internal immutable UUID plus a DNS-style slug unique within
    `(owner_wallet, slug)`. New routes include owner and slug; an ambiguous legacy
    slug is rejected.
13. Missing RPC data never becomes a definitive onchain failure; reconciliation
    supports a secondary provider.
14. Runtime images use pinned base digests, a non-root user and minimal files.

## Settlement and finality

The protected handler executes only after facilitator settlement and a second RPC
validation. The validator checks `meta.err`, mint, recipient, payer and exact token
balance deltas. PostgreSQL enforces `UNIQUE(network, signature)` under concurrent
requests. A reconciler promotes successful signatures from `confirmed` to
`finalized`; absent RPC data remains recoverable instead of becoming `failed`.

Payments reference the product UUID. Owner and slug remain readable public
identity without allowing one provider to reserve another provider's slug.

## Technical references

- [x402 network support](https://docs.cdp.coinbase.com/x402/network-support)
- [Solana Subscriptions & Allowances](https://solana.com/docs/payments/subscriptions/overview)
- [Official subscriptions SDK](https://github.com/solana-foundation/subscriptions)
- [USDC contract addresses](https://developers.circle.com/stablecoins/usdc-contract-addresses)
- [Kora fee abstraction](https://solana.com/docs/payments/send-payments/payment-processing/fee-abstraction)
- [MCP TypeScript SDK](https://ts.sdk.modelcontextprotocol.io/server)

Spanish: [Arquitectura de MeterKit](../architecture.md).
