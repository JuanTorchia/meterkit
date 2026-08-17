# `@usemeterkit/database`

PostgreSQL persistence for MeterKit. Generated standalone providers should use
the narrow replay adapter; the broader `PostgresStore` belongs to the hosted
gateway and is not required for self-service apps.

```bash
pnpm add @usemeterkit/database pg
```

```ts
import { StandalonePostgresPaymentStore } from "@usemeterkit/database";

const store = StandalonePostgresPaymentStore.connect(process.env.DATABASE_URL!);
await store.migrate(); // idempotent and serialized with an advisory lock
```

`save()` is the atomic replay-consumption boundary. PostgreSQL error `23505` is
normalized to `PAYMENT_REPLAYED`; `has()` is only an early check. The standalone
table retains a one-way SHA-256 replay key and bounded product, amount,
recipient, timestamp and fingerprint metadata. It does not retain payer or the
full transaction signature. `list()` intentionally returns no reconstructed
payment records because minimized rows cannot truthfully recreate them.

Use one store/pool per process, call `close()` during conventional-server
shutdown, and fail startup if migration or connectivity fails. Never fall back
from PostgreSQL to memory. This provides restart and shared-replica replay
protection; it cannot make arbitrary protected-handler side effects exactly
once after a process crash.

MeterKit is currently devnet only. Read the
[architecture](https://github.com/JuanTorchia/meterkit/blob/main/docs/architecture.md)
and [retention policy](https://github.com/JuanTorchia/meterkit/blob/main/docs/security.md)
before operating the store.

Apache-2.0.
