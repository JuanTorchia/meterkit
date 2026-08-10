# MeterKit threat model

Last synchronized with the Spanish path: 2026-08-10.

## Assets and trust boundaries

MeterKit never custodies USDC, seed phrases or private keys. Protected assets are
signed authorizations, product configuration, receipts and gateway availability.
Trust boundaries are the browser/wallet, gateway, facilitator, RPC providers,
PostgreSQL and the native subscriptions program.

## Threats and controls

| Threat                             | Control                                                                                   |
| ---------------------------------- | ----------------------------------------------------------------------------------------- |
| Reused payment                     | Atomic unique signature storage and conflict response                                     |
| Wrong amount, mint or recipient    | Exact x402 requirements plus independent RPC token-balance validation                     |
| Wrong network                      | Devnet CAIP-2 identifier is the only accepted MVP network                                 |
| Expired authorization              | Five-minute payment timeout and recent blockhash validation                               |
| Concurrent double execution        | Database unique constraint and transactional claim                                        |
| Duplicate product creation         | Idempotency key bound to request hash and stored response                                 |
| Foreign wallet or challenge replay | Domain-, route-, body- and wallet-bound Ed25519 challenge, consumed once                  |
| MCP receipt reuse after restart    | Durable SHA-256 claim plus independent RPC validation                                     |
| Missing RPC response               | `unknown`/recoverable state and optional secondary RPC; only explicit onchain errors fail |
| Facilitator compromise             | Revalidate transaction error, payer, recipient, mint and balances over RPC                |
| Excessive allowance                | Required maximum amount, expiry, risk copy and explicit revocation                        |
| Cross-tenant access                | Hashed session token, expiry, owner-filtered SQL and UUID product identity                |
| Product collision                  | Unique `(owner_wallet, slug)` and rejection of ambiguous legacy routes                    |
| Hosted proxy SSRF                  | HTTPS allowlist, no IP/credentials/ports/redirects, DNS checks and response cap           |
| Agent resource escape              | Normalized protocol, origin, port and path; exact route by default                        |
| Sensitive logs                     | Never log secrets, full signatures, payment headers or environment contents               |

## Subscriptions and allowances

A delegate revocation alone does not necessarily terminate a subscription. MeterKit
uses the specific `revokeDelegation`, `cancelSubscription` or
`revokeSubscriptionAuthority` instruction and does not retain signed control
transactions. An active subscription also does not prove available funds; a service
must verify each period's payment before granting access.

The dashboard builds the transaction locally and hands it to Wallet Standard via
`signAndSendTransaction`. The private key never leaves the wallet. PostgreSQL stores
only public metadata, status and receipt information.

## Operations

- Devnet and any future mainnet deployment require separate variables, databases
  and infrastructure. Mainnet is disabled until explicit authorization and review.
- Secrets live only in environment variables or a secret manager.
- `confirmed` is the minimum accepted settlement state; `finalized` requires RPC
  reconciliation. An absent signature is never marked failed by inference.
- Challenges, sessions and expired idempotency keys are cleaned hourly. Payments
  and receipts remain as provider evidence.
- npm releases use GitHub OIDC trusted publishing and provenance; no long-lived npm
  token belongs in the repository.

## Residual MVP risks

- Finality availability depends on the configured RPC providers.
- Memory-backed authentication is development-only; hosted operation requires
  PostgreSQL and supports multiple replicas.
- The recipient needs a devnet USDC associated token account before settlement.
- DNS validation and the later HTTPS connection are separate operations; the pilot
  CLI must only verify developer-selected endpoints.
- Devnet verification with disposable wallets is not evidence of mainnet readiness,
  external adoption, revenue or a completed third-party audit.

Report vulnerabilities privately through [SECURITY.md](../../SECURITY.md).
Spanish: [Modelo de amenazas](../security.md).
