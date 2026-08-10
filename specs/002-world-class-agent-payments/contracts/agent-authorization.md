# Contract: Agent Spending Authorization

## Create

Input must bind owner wallet, delegate, devnet, test-USDC mint, authorization
kind, recipient/resource scope, per-request cap, aggregate cap and expiry.
Wallet approval creates the official onchain authorization directly; MeterKit
stores only reconcilable public metadata.

## Inspect

Return an `AgentAuthorizationView` with current onchain status, remaining
capacity, expiry, delegate, scopes and public creation/revocation evidence.
Unknown RPC state remains `unknown` and is retried safely.

## Spend

Before approving an x402 purchase, validate payment requirement and current
authorization together. Reserve/consume capacity atomically for concurrent
attempts. A successful receipt links authorization fingerprint, payment
fingerprint and public transaction while excluding the full payment payload.

## Revoke

Revocation always requires the owner's wallet and calls the official Solana
primitive. UI success is shown only after observed chain confirmation; pending
or unknown results remain recoverable. Once revocation is observed, all later
spend attempts fail before protected execution.

## Invariants

- `spentAtomic <= aggregateLimitAtomic` for accepted operations.
- No payment can consume the same capacity or proof twice.
- Hosted service failure cannot transfer ownership or prevent protocol-native
  wallet revocation.
- Devnet/test-USDC values cannot be silently converted to mainnet values.
