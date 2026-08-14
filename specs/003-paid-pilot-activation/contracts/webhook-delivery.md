# Contract: Signed Settlement Notifications

This contract becomes implementable only after one external pilot completes or
a participant explicitly identifies notifications as blocking continued use.

## Subscription lifecycle

Provider-authenticated operations create, inspect, rotate and disable a
subscription. Creation accepts selected settlement event types and one HTTPS
destination. The destination becomes active only after a challenge sent through
the production-safe transport proves control.

Accepted destinations use HTTPS port 443, contain no credentials, fragment or
query string, and resolve exclusively to public addresses. Every attempt
re-resolves and pins a validated address while preserving hostname for TLS.
Redirects and environment proxies are disabled.

The generated `whsec_...` secret is returned exactly once. Later responses show
only a fingerprint. Rotation creates a new secret and signs with new and retiring
keys during a maximum 24-hour overlap. Disablement stops future claims/retries.

## Event envelope

```json
{
  "schemaVersion": 1,
  "id": "evt_<opaque>",
  "type": "settlement.finalized",
  "occurredAt": "2026-08-14T12:00:00.000Z",
  "data": {
    "receiptId": "00000000-0000-4000-8000-000000000000",
    "productId": "weather",
    "settlement": "finalized",
    "amountAtomic": "10000",
    "assetMint": "<devnet mint>",
    "network": "<devnet network>",
    "verification": {
      "signatureFingerprint": "sha256:<fingerprint>",
      "explorerUrl": "https://explorer.solana.com/..."
    }
  }
}
```

The exact serialized body is immutable. It excludes payer wallet, full
transaction signature, payment proof, authorization material and secrets.

## Signature

```text
webhook-id: evt_...
webhook-timestamp: <unix seconds>
webhook-signature: v1,<base64 HMAC>[ v1,<second rotation HMAC>]
content-type: application/json
```

Signed bytes are:

```text
<webhook-id>.<webhook-timestamp>.<exact raw body>
```

Receivers verify HMAC-SHA256 in constant time, accept an active/overlap
signature, enforce a default five-minute timestamp tolerance and deduplicate by
`webhook-id`. They must not parse and reserialize before verification.

## Delivery semantics

- Event creation is atomic with the accepted settlement transition.
- Delivery is at-least-once; event ID remains stable across all attempts.
- Suggested attempts: immediate, 30 seconds, 2 minutes, 10 minutes, 30 minutes.
- `2xx` succeeds. Network errors/timeouts, `408`, `425`, `429`, and `5xx` retry.
  Other `4xx` and all `3xx` are terminal.
- `Retry-After` is honored only when valid and clamped to the delivery deadline.
- Request duration, response bytes, global concurrency and per-subscription
  concurrency are bounded.
- Manual redelivery creates another attempt for the same event, never a new event.
- Settlement processing never waits for notification I/O.
