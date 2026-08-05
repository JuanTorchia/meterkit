# `@meterkit/database`

PostgreSQL persistence for MeterKit products, wallet challenges, receipts,
idempotency keys and atomic payment-proof consumption.

```bash
pnpm add @meterkit/database pg
```

Run the versioned migrations before starting the gateway. The package stores
public payment metadata and short-lived authentication state; it must never be
used to store private keys, seed phrases or complete sensitive request headers.

MeterKit is currently devnet only. Read the
[architecture](https://github.com/JuanTorchia/meterkit/blob/main/docs/architecture.md)
and [retention policy](https://github.com/JuanTorchia/meterkit/blob/main/docs/security.md)
before operating the store.

Apache-2.0.
