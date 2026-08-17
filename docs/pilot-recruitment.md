# Seven-day pilot recruitment campaign

Goal: recruit five independent builders for a **free, uncompensated devnet
beta** and observe the self-service path before intervening. Participants are
not charged and MeterKit does not pay or compensate them. An optional USD 100
done-for-you setup remains a separate customer-requested service. Automated
health checks, interest and unpaid starts are not customers.

## Funnel

| Stage                  | Target | Evidence                                        |
| ---------------------- | -----: | ----------------------------------------------- |
| Qualified contacts     |     15 | dated private outreach register                 |
| Positive replies       |      5 | consented conversation record                   |
| Pilot calls            |      3 | scheduled session                               |
| Accepted USD 100 offer |      1 | explicit acceptance of disclosed scope/price    |
| Payment received       |      1 | private commercial payment evidence             |
| Completed integration  |      1 | consented devnet settlement and replay evidence |

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

> I built MeterKit, non-custodial TypeScript middleware that lets an API or MCP
> tool charge test USDC per request on Solana using x402. I am offering one
> USD 100 assisted integration service, paid by the customer to MeterKit: we
> integrate and verify one endpoint you control,
> including a readiness review, up to 45 minutes together, settlement/protected
> response/replay evidence, and a closing report. You provide a non-sensitive
> test endpoint and about 60–90 minutes. It is devnet-only and I never request
> wallet keys, mainnet funds, private URLs or public attribution. Details:
> https://meterkit.juanchi.dev/pilots

## One public post — Spanish

> Construí MeterKit, middleware TypeScript no custodial para que una API o
> herramienta MCP cobre USDC de prueba por solicitud en Solana usando x402.
> Ofrezco un servicio de integración asistida por USD 100, pagados por el
> cliente a MeterKit: integramos y verificamos un endpoint
> bajo tu control, con revisión previa, hasta 45 minutos juntos, evidencia de
> settlement/respuesta protegida/replay y reporte de cierre. Tú aportas un
> endpoint no sensible y unos 60–90 minutos. Es sólo devnet y nunca solicito
> claves, fondos mainnet, URLs privadas ni atribución pública. Detalles:
> https://meterkit.juanchi.dev/pilots

## Operating cadence

- Day 1: publish one language-appropriate post and contact five qualified people;
  save URLs and private outcomes without copying personal data into Git.
- Day 2: answer questions and offer two integration time slots.
- Day 3: contact five more qualified people and share the public readiness path.
- Day 4–5: support started pilots; turn repeated friction into documentation.
- Day 6: contact the final five candidates and send at most one respectful
  follow-up to people who previously engaged.
- Day 7: close the campaign with factual funnel totals, including zero sales if
  nobody accepted or paid.

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
