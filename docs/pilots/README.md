# External pilot program

Goal: invite five independent developers to try the free devnet beta and measure
whether they can reach a valid 402, settlement and replay rejection without
maintainer intervention.

Participation is voluntary. Before sharing an activation report, the developer
must explicitly consent and select assistance as `none`, `docs_only` or
`maintainer_guided`. Reports contain stage names, durations and pass/fail only;
do not include email, IP, wallet, full signature, private key, token or business
data. Friction categories are install, configuration, challenge, funding,
settlement, receipt, replay and documentation.

Beta participants are not charged and MeterKit does not pay or compensate them.
Self-service is the primary path. If a customer separately requests that
MeterKit perform the work, an optional USD 100 setup service covers one endpoint
and up to 45 minutes of support. It is never required for open-source use.
Neither path authorizes custody, mainnet funds or public attribution.

Choose one factual installation path:

- Existing service: install the public immutable
  `@usemeterkit/sdk@0.3.0` package after its registry gate and protect a participant-controlled
  route.
- Generated project: run `npm create meterkit@0.3.0 -- <directory> --surface
<express|next-route|hono|mcp> --package-manager pnpm --recipient
<DEVNET_PUBLIC_WALLET> --yes`.

The 0.3.0 initializer, CLI, SDK and database adapter are release candidates
until the exact registry smoke passes. `@usemeterkit/pilot` remains a workspace
evidence package. Registry verification is synthetic engineering evidence, not
adoption.

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
