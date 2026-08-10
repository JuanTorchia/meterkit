# @usemeterkit/pilot

Read-only verifier for an x402 endpoint. It checks HTTP 402, decodes
`PAYMENT-REQUIRED`, and requires an explicit network, mint, maximum amount and
recipient policy before a report can pass. It accepts only the `exact` payment
scheme. It never signs or submits a transaction.

From the MeterKit repository:

```bash
pnpm pilot:init -- http://localhost:3000/premium
pnpm pilot:verify -- --config meterkit-pilot.json --out pilot-report.json
```

Only verify endpoints you control or explicitly trust. Public endpoints must
use HTTPS. Private, loopback, link-local and metadata endpoints are blocked by default.
`init` enables `policy.allowLocalhost` only when it creates the default
localhost development config. Do not enable that flag for untrusted configs.

`pilot-report.json` is readiness evidence only. A completed external pilot also
requires a devnet settlement, Explorer receipt and replay rejection.
