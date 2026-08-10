# MeterKit documentation in English

MeterKit is devnet-only software for non-custodial USDC payments to API and MCP
providers. This page is the maintained English entry point; Spanish remains a
first-class documentation path for Latin American builders.

## Start here

1. [Get the first HTTP 402](../sdk-quickstart.md) without cloning the monorepo.
2. [Run the complete local stack](../../README.md#english-quickstart).
3. Read the [architecture](architecture.md) and [security model](security.md).
4. Follow the [external pilot quickstart](../pilot-quickstart.md) for a real,
   participant-controlled devnet integration.
5. Read [CONTRIBUTING.md](../../CONTRIBUTING.md) before changing the project.

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
