# External pilot program

Goal: three independent developers integrate the public SDK and each complete a
finalized devnet x402 payment to their own provider wallet.

Participation is voluntary. Before sharing an activation report, the developer
must explicitly consent and select assistance as `none`, `docs_only` or
`maintainer_guided`. Reports contain stage names, durations and pass/fail only;
do not include email, IP, wallet, full signature, private key, token or business
data. Friction categories are install, configuration, challenge, funding,
settlement, receipt, replay and documentation.

The disclosed assisted service costs USD 100, paid by the customer to MeterKit;
MeterKit does not pay or compensate participants. It includes one supported
endpoint, one
readiness review, up to 45 minutes of guided integration, the settlement/replay
evidence pass and a closing report. Expected participant time is 60–90 minutes.
Self-service remains available; neither path authorizes custody, mainnet funds or
public attribution.

Choose one factual installation path:

- Existing service: install the public immutable
  `@usemeterkit/sdk@0.2.0` package from npm and protect a participant-controlled
  route.
- Generated project: run `npm create meterkit@0.2.0 -- <directory> --surface
<express|next-route|hono|mcp> --package-manager pnpm --yes`.

`create-meterkit` is a public provenance-backed `0.2.0` release and
`@usemeterkit/pilot` remains a candidate workspace package as of 2026-08-11.
The generated-project path is registry adoption; the pilot CLI is not.

Read `docs/sdk-quickstart.md`, run the workspace pilot verifier, complete the
devnet journey, then export sanitized evidence. A readiness check is not a
completed pilot. Maintainers verify Explorer finality privately and publish
only consented, minimized facts.

Create a v2 local evidence file with:

```bash
node packages/pilot/dist/cli.js engagement-init \
  --surface express \
  --participant-class external_independent \
  --assistance docs_only \
  --out engagement.json
```

Record consent and each observed stage into a new output file. A completed pilot
requires passing challenge, policy, payment, finalized settlement, protected
response, replay rejection and completion review plus granted technical
participation and private-evidence retention. Public attribution and day-seven
follow-up remain separate permissions.

Current external evidence: **zero completed pilots** until a participant supplies
the required consented chain. Internal and synthetic validation remain excluded.
