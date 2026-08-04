# MeterKit design-partner pilot

Status: recruiting; **no external pilot is claimed until a developer completes
the checklist below**.

## Offer

Three to five API or MCP developers receive a free 45-minute integration session
and direct support for a devnet proof. MeterKit does not request seed phrases,
private keys, mainnet funds, exclusivity, or permission to publish their name.
The participant keeps the middleware in their service and chooses whether a
short anonymized result may be used in the grant evidence.

## Ideal pilot

- Owns a TypeScript API, MCP server, or agent data tool.
- Can expose one non-sensitive test endpoint.
- Is willing to run Solana devnet and a disposable wallet.
- Can report integration time, errors, and whether the payment model is useful.

## 30-minute acceptance checklist

1. Run `pnpm pilot:check` and confirm the public demo is ready.
2. Install the packed SDK or workspace example.
3. Configure devnet, USDC mint, recipient wallet, price, and facilitator.
4. Receive an HTTP 402 from the protected endpoint.
5. Complete one devnet payment and receive the protected JSON response.
6. Confirm direct settlement and Explorer receipt.
7. Replay the proof and confirm rejection.
8. Submit the structured GitHub pilot report.
9. Remove the integration or keep it for further testing.

Self-service instructions: [`docs/pilot-quickstart.md`](pilot-quickstart.md).

## Success metrics

Primary pilot KPI: **at least three external developers complete a devnet
settlement through their own endpoint**.

Supporting measurements:

- median time from clone/install to first 402;
- median time to first settled request;
- number of support interventions;
- payment and replay failures;
- SDK lines added to the host service;
- willingness to test a hosted paid plan.

The evidence table must contain only consented facts:

| Pilot | Project category | First 402 | First settlement | Integration minutes | Consent to cite |
|---|---|---:|---:|---:|---|
| Not recruited | — | — | — | — | — |

## Outreach — English

> I am testing MeterKit, an Apache-2.0 TypeScript middleware that charges USDC
> on Solana for an API or MCP tool using x402. I am looking for 3–5 design
> partners to integrate one devnet endpoint. The session is free, takes about
> 30–45 minutes, uses only test assets, and never shares wallet keys. You keep
> the integration and can remain anonymous. Would you like to test it with me?

## Outreach — Español

> Estoy probando MeterKit, un middleware TypeScript Apache-2.0 que permite cobrar
> USDC en Solana por una API o herramienta MCP usando x402. Busco entre 3 y 5
> design partners para integrar un endpoint en devnet. La sesión es gratuita,
> dura aproximadamente 30–45 minutos, usa sólo activos de prueba y nunca requiere
> compartir claves. La integración queda en tu proyecto y puedes participar de
> forma anónima. ¿Te gustaría probarlo conmigo?

## Feedback questions

1. What did you integrate?
2. How long did the first successful request take?
3. Where did you get stuck?
4. Did the spending and recipient checks feel sufficient?
5. Would you prefer self-hosted, hosted analytics, or paid integration support?
6. May MeterKit cite the result anonymously or publicly?
