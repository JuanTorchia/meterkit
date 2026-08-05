# Internal synthetic validation

> **Internal automation — zero external users represented.**

MeterKit may run agent personas with disposable devnet wallets to reproduce the
paid request independently of external testers. These runs improve protocol,
security and presentation evidence; they do not demonstrate adoption,
willingness to pay or product-market fit.

Each accepted run must prove:

- Solana devnet and the configured test-USDC mint;
- an independent disposable payer wallet;
- exact amount and provider recipient;
- finalized transaction with no onchain error;
- exact provider balance increase;
- protected response after settlement;
- receipt indexed as finalized;
- replay rejected;
- no private key, payment header or session token in the published report.

Published evidence contains public wallet addresses and Explorer transactions.
Keypairs remain outside the repository with file mode `0600`.

## Campaign — 2026-08-04

Three independently generated devnet wallets executed the same bounded 0.01
test-USDC purchase against the public deployment. The x402 facilitator sponsored
gas, so the agents did not require SOL.

| Persona | Public payer | Provider balance delta | Replay | Finalized transaction |
|---|---|---:|---:|---|
| `api-builder` | `7kXGw6v1rty7nLnENYHCLNaXkWDuk2V2TTSoaPeThFdv` | +10,000 atomic | HTTP 402 | [`3GqzMp…Li3bq`](https://explorer.solana.com/tx/3GqzMpPZb4LmAutC2fUv7cEUkZfQPCqB1jzRbp2GszNc7vaLX66yRohf8KStdPwm2JVpogMDA5wZDKM6HBwLi3bq?cluster=devnet) |
| `mcp-builder` | `21ciqy3LSsGWXaKCg7ziqWq9LvGzXWypxJWc9rNTtWAh` | +10,000 atomic | HTTP 402 | [`xhQuJn…cuTifq`](https://explorer.solana.com/tx/xhQuJn5sLF2e5qqkrTofY72iMyk1EbBTh68tq8KYrq1jcAfAvAHaBSkmApwPLhsBwCF3NVmSWSvJJA7R6cuTifq?cluster=devnet) |
| `latam-builder` | `GxdPzmJtr7qqcnS3speYQaRFsq83hPk9nWkvMFPioPnx` | +10,000 atomic | HTTP 402 | [`9EQSGT…AwU7X`](https://explorer.solana.com/tx/9EQSGTgeXsia5JJ2GAjuh6tjVsUnvBbNWnYhAS74HvBG4u1kewwxgbo3dXmwtPTdwtekuksZkimjivDwwTAwU7X?cluster=devnet) |

Aggregate assertions:

- provider test-USDC balance: 60,000 → 90,000 atomic units;
- three unique payer wallets and three unique finalized signatures;
- three protected responses returned after settlement;
- three finalized PostgreSQL receipt records;
- three attempted proof reuses rejected;
- maximum spend per agent: 10,000 atomic units;
- external users represented: zero.

An ephemeral Chromium profile then verified the public dashboard: four finalized
receipt rows, four Explorer links, English default, no console errors and no
horizontal overflow. Capture:
[`artifacts/internal-synthetic-dashboard.png`](../../artifacts/internal-synthetic-dashboard.png).

## Closeout run — 2026-08-05

The disposable `grant-closeout-agent` payer completed one additional public
devnet purchase. The provider balance increased from 90,000 to 100,000 atomic
test-USDC units, the protected response returned, replay was rejected with HTTP
402 and the PostgreSQL receipt reached `finalized`.

Transaction:
[`3622LW…NUCm8v`](https://explorer.solana.com/tx/3622LWHPD3gbURBVbXiq1TfUC7AiZ5jwb1Hr7PfSkq8XqR4SLmxEYEf9BXFVoNCLiUuwGpwWuVsNWVpZGVNUCm8v?cluster=devnet).

The browser verification then found five finalized rows and five Explorer links,
with no console errors or horizontal overflow. This remains internal synthetic
protocol evidence and represents zero external users.
