# Quickstart Validation: Paid Pilot Activation

This guide validates the design end to end after implementation. It does not
authorize mainnet assets, participant impersonation or fabricated adoption.

## Prerequisites

- Node.js 22+, pnpm 11+, Docker and the repository dependencies installed.
- Local PostgreSQL using the documented test URL.
- For live evidence only: a disposable participant-controlled Solana devnet
  wallet with test assets. Never use a mainnet wallet or commit a keypair.
- A public HTTPS test receiver controlled by the tester for notification tests.

## Baseline validation

```bash
docker compose up -d
pnpm lint
pnpm typecheck
DATABASE_TEST_URL=postgresql://meterkit:meterkit@localhost:5432/meterkit pnpm test
pnpm build
```

Expected: migrations apply idempotently; all boundary, tenant, concurrency and
contract tests pass; no new runtime dependency or secret appears unexpectedly.

## Scenario A: independent provider activation

1. Start from the disclosed pilot offer and create a v2 engagement with explicit
   participant classification and scoped consent.
2. Integrate one participant-controlled supported endpoint.
3. Record challenge, policy, payment, finalized settlement, protected response
   and replay rejection events with minimized references.
4. Verify the report derives completion only after all required events.
5. Withdraw public-attribution consent and verify technical evidence remains
   private and the participant cannot appear in a public case study.

Expected: stage durations and support interventions are visible; internal or
synthetic evidence cannot be converted into external completion.

## Scenario B: provider settlement isolation and export

1. Create two wallet-backed provider sessions and products with the same slug.
2. Generate pending, confirmed, finalized, unknown and failed receipt transitions.
3. Query each provider's settlements with time/product/status filters and cursor
   pagination.
4. Export the same frozen selection as JSON and CSV, including an empty result.
5. Attempt cross-provider product, cursor and receipt probes.

Expected: each owner sees only records linked through its product UID; unknown
and pending remain exact; totals match records; JSON and CSV share snapshot;
cross-tenant probes disclose nothing; formula-like CSV fields cannot execute.

## Scenario C: notification security and recovery

Run only after the activation gate in [webhook-delivery.md](contracts/webhook-delivery.md).

1. Reject HTTP, credentialed, redirected, private, loopback, mixed public/private
   DNS and DNS-rebinding destinations.
2. Verify a valid public HTTPS destination and capture the one-time secret.
3. Commit a settlement transition and confirm its event exists atomically.
4. Verify the exact raw-body signature and stable event ID across retries.
5. Exercise transient retry, permanent `4xx`, redirect, timeout, rotation overlap,
   disable-during-retry and two-worker concurrency.

Expected: settlement never waits for delivery; one business event exists for the
transition; retry attempts share the event ID; disabled subscriptions stop
future attempts; clear secrets never appear in responses or logs.

## Scenario D: bounded agent authorization

Use the existing devnet allowance journey to create, inspect, spend within scope,
deny over-limit/wrong-provider/expired attempts and revoke. Verify onchain state
remains authoritative and hosted failure cannot prevent wallet revocation.

## Scenario E: commercial and grant classification

Create fixtures for interest, stated-price yes, invoice, received commercial
payment, refund, grant approval and verified grant tranche receipt.

Expected: only verified net commercial cash produces paid-integration/revenue
metrics. Grant receipt changes funding status only. Day-seven retention remains
unknown until an eligible observation occurs after the due time.

## Full release gate

```bash
pnpm docs:verify
pnpm quickstart:clean
pnpm compatibility:verify
pnpm test:e2e
pnpm audit --prod --audit-level=high
```

Payment-related changes additionally require fresh reproducible local-validator
or devnet evidence, exact-commit CI, health checks and a rollback rehearsal. The
grant submission itself remains an applicant action through the official channel.
