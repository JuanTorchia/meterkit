# MeterKit design-partner pilot

Status: recruiting. **No external pilot is claimed until an external developer
completes the acceptance and evidence requirements below.**

## Offer and modalities

Three to five API or MCP developers can choose:

- self-service using the public quickstart;
- one free guided integration session of up to 45 minutes;
- self-service with asynchronous maintainer support.

MeterKit does not request seed phrases, private keys, mainnet funds,
exclusivity, private endpoint URLs or permission to publish a participant's
name. The participant keeps or removes the integration after the proof.

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

> I am testing MeterKit, Apache-2.0 TypeScript middleware for charging devnet
> USDC from an API or MCP tool using x402. I am looking for 3–5 design partners
> to integrate one test endpoint they control. You can use the self-service
> guide or a free 45-minute session. The pilot uses only test assets and never
> requires sharing wallet keys or private endpoint URLs. The GitHub evidence
> form is public; you choose whether MeterKit may cite it elsewhere. Would you
> like to test it?

## Outreach — Español

> Estoy probando MeterKit, middleware TypeScript Apache-2.0 para cobrar USDC de
> prueba desde una API o herramienta MCP mediante x402. Busco entre 3 y 5 design
> partners que integren un endpoint de prueba bajo su control. Puedes usar la
> guía autoservicio o una sesión gratuita de 45 minutos. El piloto sólo usa
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
