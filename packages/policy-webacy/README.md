# `@usemeterkit/policy-webacy`

Optional, server-only Webacy risk policy for MeterKit. It screens a known payer
on Solana before payment and maps Webacy's `overallRisk` to `allow`, `warn`, or
`deny`. MeterKit remains non-custodial and Webacy never receives a key, signed
transaction, requested resource, amount, or recipient from this adapter.

```ts
import { createWebacyPolicy } from "@usemeterkit/policy-webacy";

const evaluator = createWebacyPolicy({
  id: "payer-risk",
  apiKey: process.env.WEBACY_API_KEY!,
  warnAt: 25,
  denyAt: 70,
});
```

The API key is sent only in Webacy's documented `x-api-key` header. The adapter
accepts only the official HTTPS production/development origins, bounds response
size, honors cancellation, and never includes credentials in decisions or
errors. Choose `onError: "deny"` for fail-closed enforcement or `"allow"` for
availability-first operation. Risk scores are third-party signals, not proof of
malice or investment advice.

Remove this package and the corresponding `policies` entry to disable it; core
x402 settlement and receipt behavior is unchanged.
