# MeterKit Hono API — devnet beta

This generated project protects one Hono route with x402 on Solana devnet.

```bash
{{INSTALL_COMMAND}}
{{DEV_COMMAND}}
```

In a second terminal run:

```bash
{{CHECK_COMMAND}}
```

Expected: `HTTP 402` with x402 v2, Solana devnet, test-USDC, amount `10000`,
your public recipient and `http://localhost:3000/premium`.

Run `{{VERIFY_COMMAND}}` to enforce the exact expected policy. Only when you have a
disposable funded devnet keypair at `.local-wallets/payer.json` with mode `0600`,
run `{{PAY_COMMAND}}`; it caps both request and session at `10000` atomic
test-USDC, pays once, then verifies replay rejection. Never use valuable keys.

The initializer writes `.env`; no shell export is required. The included
`MemoryPaymentStore` loses replay history on restart and is for local discovery
only. Do not accept payments or deploy until PostgreSQL durability and the
restart/replay test are configured.

If setup fails, rerun the install command above. Check `.env` for a public
recipient, change `PORT` if occupied, and treat RPC/facilitator outages as
unavailable—not failed settlement. To reset, stop the server and remove
`node_modules`; remove the project directory only after preserving your work.
Run `{{DOCTOR_COMMAND}}` for a non-mutating, sanitized prerequisite report. If its
remediation does not recover the project, share only that sanitized output at
https://github.com/JuanTorchia/meterkit/issues.

Never commit `.env`, signing material, payment headers or full proofs.
