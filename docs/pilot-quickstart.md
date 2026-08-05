# External pilot quickstart

This flow lets an API or MCP developer verify the public MeterKit demo before
configuring a disposable wallet. It uses Solana devnet only.

## 1. Readiness check — no wallet required

```bash
git clone https://github.com/JuanTorchia/meterkit.git
cd meterkit
pnpm install --frozen-lockfile
pnpm pilot:init -- https://your-api.test/premium
```

Edit only `meterkit-pilot.json`: set the expected devnet network, USDC mint,
maximum atomic amount and exact recipient. Then run:

```bash
pnpm pilot:verify -- \
  --config meterkit-pilot.json \
  --out pilot-report.json
```

The command checks the developer's endpoint, decodes the unpaid HTTP 402
challenge and fails closed on policy mismatches. It sends no private key,
payment proof or personal data and does not count as a completed pilot.

To check the hosted MeterKit infrastructure itself, run `pnpm pilot:check`.

## 2. Protect one local test endpoint

Install dependencies and use the middleware example from the root README. Keep
the endpoint non-sensitive and use a disposable devnet wallet as recipient.
MeterKit must never receive the wallet key.

Run:

```bash
pnpm install --frozen-lockfile
docker compose up -d
pnpm dev
curl -i http://localhost:3402/v1/weather/premium
```

Acceptance: the unpaid request returns HTTP 402 and `PAYMENT-REQUIRED`.

## 3. Complete a devnet payment

Follow the “Pago devnet” section in the README with only faucet SOL and test
USDC. Confirm:

- the protected JSON is returned;
- the recipient receives test USDC directly;
- the transaction opens in Explorer with `cluster=devnet`;
- replaying the same proof is rejected.

Do not paste private keys, seed phrases, `.env` contents, session tokens or
mainnet transactions into an issue.

## 4. Submit evidence

Open a
[devnet pilot report](https://github.com/JuanTorchia/meterkit/issues/new?template=pilot-report.yml).
The form records integration time, public Explorer evidence, replay behavior,
friction and citation consent.

A pilot is counted only after the devnet settlement and replay check are
complete. Running `pnpm pilot:check` alone is readiness evidence, not traction.

Automated runs made by MeterKit wallets are labeled `internal synthetic
validation`. They demonstrate reproducibility but are never counted as external
pilots, users, customers or traction.
