# Seven-day pilot recruitment campaign

Goal: recruit five independent builders for a **free, uncompensated devnet
beta** and observe the self-service path before intervening. Participants are
not charged and MeterKit does not pay or compensate them. An optional USD 100
done-for-you setup remains a separate customer-requested service. Automated
health checks, interest and unpaid starts are not customers.

## Funnel

| Stage                 | Target | Evidence                                        |
| --------------------- | -----: | ----------------------------------------------- |
| Qualified contacts    |     15 | dated private outreach register                 |
| Consented starts      |      5 | minimized engagement record                     |
| First valid HTTP 402  |      4 | sanitized policy evidence                       |
| Completed integration |      3 | consented devnet settlement and replay evidence |
| Day-seven eligible    | report | consent and observation state kept distinct     |

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
> tool charge test USDC per request on Solana using x402. I am looking for five
> independent builders to try the free, uncompensated devnet beta using only the
> public quickstart first. Optional support is limited to one 45-minute session.
> Separately, a done-for-you setup is available for USD 100 only if you ask for
> it. I never request wallet keys, mainnet funds, private URLs or public
> attribution. Details:
> https://meterkit.juanchi.dev/pilots

## One public post — Spanish

> Construí MeterKit, middleware TypeScript no custodial para que una API o
> herramienta MCP cobre USDC de prueba por solicitud en Solana usando x402.
> Busco cinco builders independientes para probar gratis y sin compensación la
> beta devnet, intentando primero sólo con el quickstart público. El soporte
> opcional se limita a una sesión de 45 minutos. Por separado, si me pides que
> haga la integración, existe un servicio opcional de USD 100. Nunca solicito
> claves, fondos mainnet, URLs privadas ni atribución pública. Detalles:
> https://meterkit.juanchi.dev/pilots

## Operating cadence

- Day 1: publish one language-appropriate post and contact five qualified people;
  save URLs and private outcomes without copying personal data into Git.
- Day 2: answer questions without intervening in starts already underway.
- Day 3: contact five more qualified people and share the public readiness path.
- Day 4–5: support started pilots; turn repeated friction into documentation.
- Day 6: contact the final five candidates and send at most one respectful
  follow-up to people who previously engaged.
- Day 7: close the campaign with factual activation totals, including unknown
  and abandoned states rather than inferring success.

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
