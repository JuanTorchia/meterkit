# MeterKit Express API — devnet beta

This generated project protects one Express route with x402 on Solana devnet.
It never needs a seed phrase or server-side payer key.

## Start and inspect the challenge

The initializer already writes `.env` with your public disposable recipient.
If installation was skipped or failed, recover with:

```bash
{{INSTALL_COMMAND}}
```

Start the provider:

```bash
{{DEV_COMMAND}}
```

In a second terminal:

```bash
{{CHECK_COMMAND}}
```

Expected: `HTTP 402` followed by x402 version 2, Solana devnet, test-USDC,
amount `10000`, your recipient and `http://localhost:3000/premium`.

Validate the exact policy with `{{VERIFY_COMMAND}}`. Payment is a separate,
state-changing test.
Create a disposable funded devnet keypair at `.local-wallets/payer.json`, keep
the file mode at `0600`, then run `{{PAY_COMMAND}}`. It authorizes at most
`10000` atomic test-USDC for the request and session, pays once, and proves the
same payment is rejected on replay. Never use a mainnet or valuable wallet.

## Important durability boundary

This project currently uses `MemoryPaymentStore`. It is suitable only for local
challenge discovery: restart erases replay history. Do not accept paid requests
or deploy it until the documented PostgreSQL mode is configured and its
restart/replay test passes.

## Troubleshooting and reset

Run `{{DOCTOR_COMMAND}}` while the server is active. It checks configuration,
devnet, token-account, facilitator, endpoint and active durability without
funding, migrating or changing anything.

- Missing wallet: inspect `.env`; it must contain a public devnet address only.
- Port busy: set a different public `PORT` value in `.env` and use that port in
  the check URL.
- RPC/facilitator unavailable: retry later; do not interpret it as settlement.
- Reset: stop the process and remove `node_modules`. Delete the entire generated
  directory only if it contains no work you need.

Never commit `.env`, a keypair, seed phrase, payment header or full proof.
If the reported remediation still fails, open a sanitized report at
https://github.com/JuanTorchia/meterkit/issues (never attach `.env` or keys).
