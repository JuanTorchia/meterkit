# Contract: Standalone PostgreSQL Replay Store

The public adapter implements the SDK `PaymentStore` interface without requiring
gateway products, wallet sessions, OAuth or tenant tables.

## Construction and lifecycle

- Accept a PostgreSQL connection string or an injected compatible pool.
- Expose an idempotent, advisory-lock-protected migration entry point for the
  adapter-owned schema.
- Validate connectivity/schema before serving paid requests.
- Expose bounded pool settings and `close()` for conventional servers/tests.
- Next templates reuse one module/global pool across development reloads.

## Consume semantics

- `has(signature)` is an early optimization only.
- `save(record)` hashes the normalized signature and atomically inserts the
  `(network, signature_hash)` replay key.
- SQLSTATE `23505` for that constraint becomes stable `PAYMENT_REPLAYED`.
- The protected handler runs only after successful save; concurrent losers and
  post-restart replays cannot execute it.

## Security and failure

- Store no private keys, bearer credentials or complete proof.
- Do not log the database URL or full signature.
- Connection/migration failure prevents paid serving and never selects memory.
- The guarantee is at-most-once authorization across processes sharing the DB,
  not exactly-once business fulfillment after a paid-but-no-response crash.
