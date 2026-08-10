# `@usemeterkit/subscriptions`

Wallet-controlled transaction builders for Solana Subscriptions & Allowances.

```bash
pnpm add @usemeterkit/subscriptions
```

The package builds fixed allowances, recurring delegations, subscription plans
and revocations. The user's Wallet Standard wallet remains the signer and can
revoke authorization. MeterKit never receives a seed phrase or private key.

MeterKit is currently devnet only. Validate network, mint, delegate, cap and
expiration in the host application and review the
[security model](https://github.com/JuanTorchia/meterkit/blob/main/docs/security.md).

Apache-2.0.
