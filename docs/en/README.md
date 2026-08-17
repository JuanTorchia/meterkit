# MeterKit documentation in English

MeterKit is devnet-only software for non-custodial USDC payments to API and MCP
providers. This page is the maintained English entry point; Spanish remains a
first-class documentation path for Latin American builders.

The 0.3.0 release candidate adds the public CLI and standalone database adapter
to core, SDK and initializer. It becomes the recommended registry baseline only
after its post-publish smoke gate passes.

## Start here

1. [Get the first HTTP 402](../sdk-quickstart.md) without cloning the monorepo.
2. [Run the complete local stack](../../README.md#english-quickstart).
3. Read the [architecture](architecture.md) and [security model](security.md).
4. Follow the [external pilot quickstart](../pilot-quickstart.md) for a real,
   participant-controlled devnet integration.
5. Read [CONTRIBUTING.md](../../CONTRIBUTING.md) before changing the project.

Express `protect()` is canonical. Next.js App Router, Hono and MCP share the
versioned receipt contract; Hono remains experimental pending external use.
Join the [free five-person devnet beta](../pilots/README.md). Participants are
not charged or compensated; the separate USD 100 done-for-you setup is optional
and never required to use the open-source software. Verified external
integrations currently reported: **0**. Internal and synthetic tests do not
count as external traction.

For an existing service, install `@usemeterkit/sdk@0.3.0`. For a generated
project, use the fully specified `npm create meterkit@0.3.0 -- meterkit-app
--surface express --package-manager npm --recipient <DEVNET_PUBLIC_WALLET>
--yes` command.

## Language structure

- English-only or already bilingual operational documents remain directly under
  `docs/` so existing links do not break.
- Full English counterparts of Spanish-first technical documents live in
  `docs/en/` with the same base filename.
- Spanish-first originals remain under `docs/` and are never replaced by a
  machine-translated English version.
- A behavior or security change must update both language paths in the same PR,
  or explicitly mark the missing translation as blocking follow-up work.

The English and Spanish documents describe the same software. If they conflict,
the implementation and automated tests define behavior; open a documentation
issue rather than relying on the more permissive wording.

## Dependency updates

Dependabot proposes grouped minor and patch updates every week and continues to
report security alerts. Major versions are deliberate migration work: maintainers
review official release notes, upgrade coupled packages together and run the full
CI matrix. This keeps incompatible majors out of automatic PR churn without
hiding vulnerabilities.

Production updates are split by risk surface: x402, web/Wallet Standard, gateway
runtime and a residual group. A regression in one surface therefore cannot hide
inside an unrelated dependency bundle.
