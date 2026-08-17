# MeterKit Next route — devnet beta

The initializer writes the public provider configuration to `.env.local`.

```bash
{{INSTALL_COMMAND}}
{{DEV_COMMAND}}
```

In a second terminal:

```bash
{{CHECK_COMMAND}}
```

Expected: `HTTP 402` with x402 v2, Solana devnet, test-USDC, amount `10000`,
your recipient and `http://localhost:3000/api/premium`.

Run `{{VERIFY_COMMAND}}` to enforce the exact policy. Payment remains an explicit
state-changing step: place only a disposable funded devnet keypair (mode `0600`)
at `.local-wallets/payer.json`, then run `{{PAY_COMMAND}}`. The command caps the
request and session at `10000` atomic test-USDC and checks replay rejection.

This route uses `MemoryPaymentStore`; restart erases replay history. It is a
local discovery example, not a deployment-ready paid endpoint. Configure the
documented PostgreSQL mode and pass restart/replay validation before accepting
payments.

For recovery, rerun the install command, check `.env.local`, and confirm port
3000 is available. External RPC/facilitator outages remain unavailable or
unknown. Reset by stopping Next and removing `.next`/`node_modules`; preserve
your source before removing the generated directory.
Run `{{DOCTOR_COMMAND}}` for the non-mutating diagnostic report. If remediation
still fails, share only sanitized output at
https://github.com/JuanTorchia/meterkit/issues.

Never commit `.env.local`, signing material, payment headers or full proofs.
