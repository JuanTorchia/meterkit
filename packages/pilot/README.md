# @meterkit/pilot

Read-only verifier for an x402 endpoint. It checks HTTP 402, decodes
`PAYMENT-REQUIRED`, and optionally enforces network, mint, maximum amount and
recipient. It never signs or submits a transaction.

From the MeterKit repository:

```bash
pnpm pilot:init -- http://localhost:3000/premium
pnpm pilot:verify -- --config meterkit-pilot.json --out pilot-report.json
```

`pilot-report.json` is readiness evidence only. A completed external pilot also
requires a devnet settlement, Explorer receipt and replay rejection.
