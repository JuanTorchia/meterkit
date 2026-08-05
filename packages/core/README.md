# `@meterkit/core`

Strict shared contracts for MeterKit products, x402 payment requirements,
receipts and validation.

This package contains no wallet and does not custody or sign funds. It is used by
the SDK, PostgreSQL store and subscription builders to keep network, mint,
amount, recipient and status handling consistent.

```bash
pnpm add @meterkit/core
```

MeterKit is currently devnet only. See the
[repository README](https://github.com/JuanTorchia/meterkit) and
[security policy](https://github.com/JuanTorchia/meterkit/security/policy)
before integrating payment behavior.

Apache-2.0.
