# Contract: Payment Policy Adapter

```ts
interface PaymentPolicyEvaluator {
  readonly id: string;
  evaluate(input: PolicyEvaluationInput, signal: AbortSignal): Promise<PolicyDecision>;
}
```

The SDK validates both input and result schemas, applies a per-policy timeout,
limits provider output before parsing, and maps thrown/invalid/timeout results to
`error`. Configuration determines whether that error allows or denies payment.

## Webacy adapter

The optional adapter accepts a base URL, API credential supplied by the consumer,
chain identifier fixed to Solana, endpoint selection, timeout, fail behavior, and
injectable fetch implementation. Credentials are sent only to the configured
HTTPS Webacy origin, never returned, persisted, or logged.

The adapter maps documented provider risk levels/reason factors to:

- low/acceptable -> `allow`;
- configured intermediate level -> `warn`;
- configured high/critical level or explicit malicious/sanctions signal -> `deny`;
- timeout, rate limit, invalid schema, or unavailable provider -> `error`.

Mapping thresholds are explicit configuration, included in documentation, and
covered by fixtures; MeterKit does not claim the provider guarantees safety.
