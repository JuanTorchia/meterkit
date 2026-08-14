# MeterKit design-partner pilot

Status: recruiting. **No external pilot is claimed until an external developer
completes the acceptance and evidence requirements below.**

## Disclosed assisted offer

The initial service is **USD 100 paid by the customer to MeterKit for one
assisted devnet integration**. MeterKit does not pay or compensate participants
to test it. It
includes one Express, Next.js, Hono or MCP endpoint, readiness review, one guided
session of up to 45 minutes, settlement/protected-response/replay evidence and a
closing report. The participant supplies a non-sensitive endpoint it controls
and approximately 60–90 minutes. Continued hosting is optional and priced only
after the pilot.

Three to five API or MCP developers can instead choose the same evidence journey
through:

- self-service using the public quickstart;
- self-service with asynchronous maintainer support.

MeterKit does not request seed phrases, private keys, mainnet funds,
exclusivity, private endpoint URLs or permission to publish a participant's
name. The participant keeps or removes the integration after the proof. A pilot
start, willingness-to-pay response, accepted proposal, invoice, paid integration
and commercial cash receipt are separate facts.

GitHub pilot reports are public and expose the participant's GitHub handle.
“Aggregate only” controls later citation; it does not make a public issue
anonymous. A participant who cannot use a public issue must not be represented
as publicly attributable evidence.

## Ideal pilot

- Owns a TypeScript API, MCP server, agent tool or data service.
- Can protect one non-sensitive endpoint it controls.
- Can use a disposable wallet and test assets on Solana devnet.
- Can report integration time, support interventions, errors and product fit.

## Acceptance checklist

1. Open a public `pilot-start` issue immediately before adding MeterKit to the
   host project; its creation time is the common start timestamp.
2. Install a pinned SDK package or workspace commit.
3. Protect one participant-controlled endpoint.
4. Configure devnet, USDC mint, recipient, maximum amount, price, facilitator
   and RPC.
5. Run `pilot:verify` against that endpoint with all four policy constraints
   enforced.
6. Receive an unpaid HTTP 402 and fingerprint its decoded challenge.
7. Complete one devnet payment and receive the protected response.
8. Correlate challenge, transaction and response with a non-secret request or
   receipt ID.
9. Confirm direct settlement in Explorer and at the configured recipient.
10. Reuse the same proof and confirm rejection without a second handler
    execution or balance increase.
11. Submit the structured public pilot report with safe evidence.
12. If permitted, record whether the integration remains in use after seven
    days.

The v2 local evidence file records participant class, offer version and price,
append-only activation events, interventions and consent scopes. A historical v1
activation report remains `legacy_unverified`; it is never silently upgraded to
a completed v2 pilot.

## Consent scopes

Consent is collected independently for technical participation, private evidence
retention, day-seven follow-up, aggregate reporting, public attribution,
testimonial quotation and a case study. Technical participation does not grant
any other scope. A participant may deny or withdraw a scope without converting
unknown evidence into failure or deleting unrelated consent choices.

Local v2 evidence can be deleted with `engagement-delete`, which leaves only an
opaque deletion receipt. MeterKit can remove hosted metadata it controls, but it
cannot erase a Solana transaction, an already-public GitHub issue or a copy held
by the participant. The CLI and documentation state this boundary before export.

Self-service instructions: [`pilot-quickstart.md`](pilot-quickstart.md).
Evidence and privacy rules: [`pilot-evidence.md`](pilot-evidence.md).

## Counting rules

The north-star KPI is:

> Number of external, participant-controlled endpoints with a correlated devnet
> settlement, protected response and rejected replay.

A pilot counts once only when all acceptance conditions are met. Multiple
transactions from the same integration do not create additional pilots.

The following never count as external pilots:

- `pnpm pilot:check` or a readiness report by itself;
- verification of MeterKit's own hosted endpoint;
- automated runs using MeterKit-controlled wallets;
- an Explorer link without endpoint/challenge/receipt correlation;
- a self-attestation missing the required policy or replay evidence;
- a started or abandoned integration.

Internal automated runs are labeled `internal synthetic validation`. They may
demonstrate reproducibility but not users, customers or traction.

## Funnel and KPIs

Measure each unique external participant through:

1. invited, from the maintainer's dated outreach register;
2. integration started, from a unique public `pilot-start` issue;
3. first participant-owned HTTP 402;
4. policy verification passed with all constraints enforced;
5. first correlated devnet settlement and protected response;
6. replay rejected;
7. completed report;
8. integration retained after seven days, when follow-up is permitted.

Report:

- invited → started, started → 402, 402 → settlement and settlement → completed
  conversion;
- median minutes from the common start event to first 402;
- median minutes from that start event to first settlement;
- pilots completed self-service versus guided;
- support interventions per started and completed pilot;
- failures and abandonment by stage;
- SDK version/commit and approximate host-project lines changed;
- immediate keep/remove/limited outcome;
- seven-day retention among participants who allowed follow-up;
- preference for self-hosted, hosted analytics, integration support or no use.
- the exact disclosed-price willingness-to-pay response, kept separate from
  paid integration and received commercial revenue.

Do not turn missing observations into zeroes. Publish the denominator with every
conversion or retention percentage.

Visits are not currently tracked and must not be used as a funnel denominator.
An opened start issue without a matching completed report is retained as an
incomplete or abandoned attempt, with its last known stage recorded by a
maintainer comment. This avoids measuring only successful participants.

For permitted seven-day follow-up, maintainers add one standardized comment to
the original start issue:

```text
Day 7 outcome: retained | removed | unknown
Checked at: YYYY-MM-DD
Participant response: yes | no
```

Retention is reported only over participants who allowed follow-up, with
`unknown` kept separate from `removed`.

The consented evidence table should use stable opaque pilot IDs:

| Pilot ID      | Category | Modality | First 402 | Settlement | Support | Outcome | Day 7 | Citation |
| ------------- | -------- | -------- | --------: | ---------: | ------: | ------- | ----- | -------- |
| Not recruited | —        | —        |         — |          — |       — | —       | —     | —        |

The resulting public issues are structured participant self-reports. Technical
evidence (endpoint fingerprint, challenge fingerprint, SDK version,
transaction and correlation ID) belongs in the corresponding public issue or a
consented evidence record, not in this aggregate table. Do not describe a
pilot as independently verified unless MeterKit later adds a signed completion
bundle or independently validates the correlated receipt.

## Outreach — English

> I built MeterKit, Apache-2.0 TypeScript middleware for charging devnet USDC
> from an API or MCP tool using x402. I offer a USD 100 assisted integration
> service, paid by the customer to MeterKit: one endpoint you control, a
> readiness review, up to 45 minutes together,
> settlement/protected-response/replay evidence and a closing report. You
> provide a non-sensitive test endpoint and about 60–90 minutes. It uses only
> test assets and never requires wallet keys, private URLs or public
> attribution. Interested?

## Outreach — Español

> Construí MeterKit, middleware TypeScript Apache-2.0 para cobrar USDC de prueba
> desde una API o herramienta MCP mediante x402. Ofrezco un servicio de
> integración asistida por USD 100, pagados por el cliente a MeterKit: un
> endpoint bajo tu control, revisión previa, hasta 45 minutos juntos,
> evidencia de settlement/respuesta protegida/replay y reporte de cierre. Tú
> aportas un endpoint no sensible y unos 60–90 minutos. El piloto sólo usa
> activos de prueba y nunca requiere compartir claves ni URLs privadas. El
> formulario de evidencia en GitHub es público; tú decides si MeterKit puede
> citarlo fuera de GitHub. ¿Te gustaría probarlo?

## Feedback questions

1. What did you integrate and which MeterKit version did you use?
2. How long did the first 402 and first settlement take from the common start?
3. Which stage failed or required support?
4. Did the amount, network, mint and recipient checks feel sufficient?
5. Did correlation and replay evidence feel understandable?
6. Did you keep the integration, and may maintainers ask again after seven days?
7. Which product model is useful, if any?
8. How may MeterKit cite the public result elsewhere?
