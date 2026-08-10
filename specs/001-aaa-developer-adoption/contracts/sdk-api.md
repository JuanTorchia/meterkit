# Contract: Canonical SDK API

## Recommended export

```ts
protect(options: ProtectOptions): RequestHandler
```

`ProtectOptions` requires a validated product and payment store. It accepts an
optional facilitator client/URL, RPC validator configuration, ordered policy
evaluators, and sanitized event callback.

## Contract guarantees

- Configuration is validated synchronously before middleware is returned.
- The protected route is derived from the normalized product resource.
- Official x402 middleware remains the protocol implementation.
- Policies run before payment creation when the required subject is available.
- A deny decision does not call the facilitator or protected handler.
- Settlement validation and unique persistence occur before protected execution.
- Event callbacks receive only versioned sanitized events and cannot change the
  payment decision.
- Existing `createX402Middleware` remains compatible in the 0.1 line and delegates
  to the same implementation; legacy/custom middleware is documented as advanced.

## Stable error codes

`CONFIG_INVALID`, `POLICY_DENIED`, `POLICY_UNAVAILABLE`, `PAYMENT_INVALID`,
`PAYMENT_REPLAYED`, `SETTLEMENT_UNKNOWN`, `SETTLEMENT_FAILED`,
`SETTLEMENT_TRANSFER_MISMATCH`, `RESOURCE_SCOPE_INVALID`, `STORE_UNAVAILABLE`.

Raw provider response bodies, authorization headers, proofs, and full signatures
MUST NOT appear in an error message or event.
