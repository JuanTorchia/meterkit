# Seven-day pilot recruitment campaign

Goal: obtain three completed external devnet integrations without pretending that
automated health checks are users.

## Funnel

| Stage | Target | Evidence |
|---|---:|---|
| Public post views | 200 | platform analytics or screenshot |
| Repository visits | 30 | GitHub traffic snapshot |
| Readiness checks | 10 | voluntary pasted result or support conversation |
| Started integrations | 5 | GitHub pilot issue marked “started” |
| Completed settlements | 3 | devnet Explorer URL and pilot form |

## Where to recruit

Use communities intended for developer collaboration:

1. Solana Engineering Discord from <https://solana.com/community>.
2. The Superteam Argentina or relevant Superteam builder community used for the
   grant application.
3. A personal LinkedIn/X post from the founder account.
4. Existing GitHub followers and professional contacts, contacted individually
   only where there is a real relationship.

Do not advertise MeterKit in MCP contributor channels: their official community
guidance discourages product marketing. Do not open unsolicited issues on other
projects. No bots, scraped emails or mass direct messages.

## One public post — English

> I built a non-custodial TypeScript middleware that lets an API or MCP tool
> charge test USDC per request on Solana using x402. I need three developers to
> test one endpoint on devnet. The public readiness check takes about two minutes;
> the complete test takes 20–30 minutes, uses faucet assets only, and never shares
> wallet keys. In return I will help with the integration and credit the tester
> if desired. Repository: https://github.com/JuanTorchia/meterkit — Quickstart:
> https://github.com/JuanTorchia/meterkit/blob/main/docs/pilot-quickstart.md

## One public post — Spanish

> Construí un middleware TypeScript no custodial para que una API o herramienta
> MCP cobre USDC de prueba por solicitud en Solana usando x402. Busco tres
> desarrolladores para probar un endpoint en devnet. El chequeo público tarda
> unos dos minutos; la prueba completa, entre 20 y 30 minutos, usa solamente
> activos de faucet y nunca requiere compartir claves. Ayudo personalmente con
> la integración y doy crédito al tester si lo desea. Repositorio:
> https://github.com/JuanTorchia/meterkit — Guía:
> https://github.com/JuanTorchia/meterkit/blob/main/docs/pilot-quickstart.md

## Operating cadence

- Day 1: publish one English and one Spanish post; save their URLs.
- Day 2: answer questions and offer two integration time slots.
- Day 3: share one public readiness result and the Explorer proof already
  recorded by MeterKit.
- Day 4–5: support started pilots; turn repeated friction into documentation.
- Day 6: one respectful follow-up on the original posts, not individual spam.
- Day 7: close the campaign with factual totals, including zero if nobody
  completed it.

## What is automated

- GitHub runs the public readiness check every six hours.
- Failed checks are visible in Actions.
- Every run preserves a machine-readable artifact for 30 days.
- The issue form enforces required evidence and safety acknowledgements.
- CI verifies the codebase independently.

## What remains human

- Publishing from the founder’s accounts.
- Answering integration questions.
- Verifying that each Explorer URL is a relevant devnet settlement.
- Obtaining consent before quoting a tester.
- Deciding whether a report qualifies as a completed pilot.
