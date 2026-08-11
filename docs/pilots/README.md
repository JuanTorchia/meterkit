# External pilot program

Goal: three independent developers integrate the public SDK and each complete a
finalized devnet x402 payment to their own provider wallet.

Participation is voluntary. Before sharing an activation report, the developer
must explicitly consent and select assistance as `none`, `docs_only` or
`maintainer_guided`. Reports contain stage names, durations and pass/fail only;
do not include email, IP, wallet, full signature, private key, token or business
data. Friction categories are install, configuration, challenge, funding,
settlement, receipt, replay and documentation.

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
