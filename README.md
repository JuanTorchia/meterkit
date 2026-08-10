# MeterKit

Open-source, non-custodial USDC payments for APIs and MCP tools on Solana.

[![CI](https://github.com/JuanTorchia/meterkit/actions/workflows/ci.yml/badge.svg)](https://github.com/JuanTorchia/meterkit/actions/workflows/ci.yml)
[![Public devnet smoke](https://github.com/JuanTorchia/meterkit/actions/workflows/public-demo-smoke.yml/badge.svg)](https://github.com/JuanTorchia/meterkit/actions/workflows/public-demo-smoke.yml)
[![CodeQL](https://github.com/JuanTorchia/meterkit/actions/workflows/codeql.yml/badge.svg)](https://github.com/JuanTorchia/meterkit/actions/workflows/codeql.yml)
[![License: Apache-2.0](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)

**Devnet only — do not send mainnet assets.**

MeterKit lets an API or MCP provider set a USDC price, add TypeScript middleware
and receive payments directly from the client through x402. MeterKit does not
custody funds or store user private keys.

Its primary agentic use case is giving autonomous clients a bounded, revocable
USDC budget for paid APIs and MCP tools over standard HTTP.

- [Public devnet dashboard](https://meterkit.juanchi.dev)
- [Gateway health](https://meterkit-api.juanchi.dev/health)
- Documentation: **[English](docs/en/README.md)** · **[Español](docs/es/README.md)**
- [Contributor guide](CONTRIBUTING.md)
- [Community plan](docs/community.md)
- [External pilot quickstart](docs/pilot-quickstart.md)
- [SDK quickstart — first HTTP 402](docs/sdk-quickstart.md)
- [Release procedure](docs/releasing.md)
- [Security policy](SECURITY.md)
- [Roadmap](docs/roadmap.md)

## English quickstart

Requirements: Node.js 22+, pnpm 11+ and Docker.

```bash
git clone https://github.com/JuanTorchia/meterkit.git
cd meterkit
corepack enable
pnpm install --frozen-lockfile
docker compose up -d
cp .env.example .env
pnpm typecheck
DATABASE_TEST_URL=postgresql://meterkit:meterkit@localhost:5432/meterkit pnpm test
pnpm dev
```

An unpaid protected request:

```bash
curl -i http://localhost:3402/v1/weather/premium
```

returns an x402 v2 HTTP 402 challenge containing the exact devnet network, USDC
mint, amount and provider recipient.

The repository includes the SDK and middleware, PostgreSQL receipt index,
Next.js dashboard, paying example client, Solana Project Scout paid MCP tool,
native allowance/subscription builders and reproducible security evidence.

Read [CONTRIBUTING.md](CONTRIBUTING.md) before proposing a change. Use
[GitHub Discussions](https://github.com/JuanTorchia/meterkit/discussions) for
questions and [private vulnerability reporting](SECURITY.md) for security
issues.

---

## Guía detallada en español

> Estado: **MVP funcional, sólo devnet**. Los flujos x402 HTTP y MCP fueron
> liquidados y finalizados en devnet. Una allowance limitada fue creada,
> verificada, revocada y cerrada onchain. Un plan nativo de 30 días completó
> alta, suscripción, cobro, cancelación y revocación en devnet.

Demo pública devnet: [meterkit.juanchi.dev](https://meterkit.juanchi.dev) ·
[health del gateway](https://meterkit-api.juanchi.dev/health). No envíe fondos
mainnet: este entorno acepta únicamente activos de prueba.

## Qué incluye

- x402 v2 `exact` para Solana devnet.
- Middleware oficial x402 para Express con requisitos estrictos y revalidación RPC de balances token.
- replay protection atómico en PostgreSQL, idempotencia, rate limit, challenge reciente y recibos.
- Premium Weather API a 0,01 USDC.
- dashboard Next.js con Wallet Standard, alta autorizada por firma y enlaces Explorer.
- inglés por defecto con selector español, sesiones firmadas y aislamiento de
  productos/pagos por wallet.
- proxy alojado real con allowlist HTTPS y defensas SSRF; el middleware directo
  continúa siendo la integración recomendada.
- builders y transacciones Wallet Standard de `@solana/subscriptions` para
  fixed/recurring/plans; el dashboard crea, lista y revoca fixed allowances
  conservando el control en la wallet.
- MCP “Solana Project Scout” con preview gratuito, fuentes GitHub públicas y cobro oficial x402/MCP.

MeterKit no recibe fondos, no conoce seed phrases y no firma por usuarios.

## Prueba pública sin wallet

Compruebe salud, descubrimiento de productos, desafío x402 y aislamiento privado:

```bash
pnpm pilot:check
```

El chequeo no usa claves ni fondos y no se presenta como un piloto completado.
Para integrar un endpoint y aportar evidencia externa, siga
[`docs/pilot-quickstart.md`](docs/pilot-quickstart.md).

## Requisitos

Node 22+, pnpm 11+, Docker. Para el pago real devnet: wallet con SOL devnet y USDC de faucet; nunca use fondos mainnet.

```bash
cp .env.example .env
# Defina MERCHANT_WALLET con una dirección pública; mantenga devnet.
pnpm install
docker compose up -d
pnpm typecheck
DATABASE_TEST_URL=postgresql://meterkit:meterkit@localhost:5432/meterkit pnpm test
pnpm dev
```

- Web: http://localhost:3000
- Gateway: http://localhost:3402
- Challenge: `curl -i http://localhost:3402/v1/weather/premium`

## Integración

```ts
app.get(
  "/premium",
  createX402Middleware({
    product,
    store,
    facilitatorUrl: "https://x402.org/facilitator",
    rpcUrl: "https://api.devnet.solana.com",
  }),
  (_req, res) => res.json({ protected: true }),
);
```

El cliente x402 debe registrar el esquema SVM con su signer local y envolver `fetch` mediante `@x402/fetch`. Nunca coloque una clave privada en código o dashboard. Vea `examples/client`.

## Verificación

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
pnpm audit --prod
```

La CI fija Actions por SHA, ejecuta CodeQL, genera SBOM y bloquea imágenes con
vulnerabilidades HIGH/CRITICAL corregibles. Las imágenes usan una base Node
fijada por digest y runtime sin npm.

Para producir un reporte sanitizado y reproducible de cierre:

```bash
DATABASE_TEST_URL=postgresql://meterkit:meterkit@localhost:5432/meterkit \
pnpm evidence:grant
```

Sin una keypair desechable controlada por el solicitante, los pagos vivos quedan
marcados `skipped`; nunca se inventan como evidencia.

## Pago devnet

1. Obtenga SOL devnet y USDC devnet del faucet oficial.
2. Asegúrese de que el proveedor tenga una cuenta asociada (ATA) para el mint USDC devnet. El CLI permite crearla sin conocer la clave del proveedor:
   `spl-token create-account 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU --owner <wallet-proveedor> --fee-payer <keypair-pagador> --url devnet`.
3. Configure la wallet pública del proveedor y reinicie gateway.
4. Use un signer local con `@x402/svm`; llame al endpoint.
5. Conserve la firma, abra `https://explorer.solana.com/tx/<firma>?cluster=devnet`.

Para probar el cobro MCP real con una keypair desechable:

```bash
SOLANA_KEYPAIR_PATH=/ruta/segura/comprador.json \
MERCHANT_WALLET=<wallet-proveedor> \
pnpm --filter @usemeterkit/mcp-scout pay:devnet anza-xyz/kit
```

El cliente sólo aprueba 0,02 USDC devnet, valida red, mint y receptor, y no
comparte la clave con el proceso MCP.

Liquidación MCP verificable de 0,02 USDC:
[`4ZkuVW…pM5wg`](https://explorer.solana.com/tx/4ZkuVWNuEZLJkYxvU485YUWqNq6pgyQG54mVcCYpSgyXAHEWtCqKMsfLVKiNbuQuAPnymYzwS732cvPXzU7pM5wg?cluster=devnet).

Allowance verificable de 1 USDC con vencimiento:
[creación](https://explorer.solana.com/tx/53Y9wj86BDMKB2Xs1LUBX1VDm6xejNpb5P1JUDi5Nr8wBYKXtZ21kq21VGKFCdtTLq8DZAmmLBVgJLHYSNy9h4mi?cluster=devnet) ·
[revocación](https://explorer.solana.com/tx/2Ccw1bA19qKkHdoRHJ1vBa9tG32Dm8eDE9hHc8fH1RsWaoo3iehkWauYkHrfZaGKYLsg8RntJi95AAfFr9rXqzoU?cluster=devnet).

Plan de 30 días: [crear](https://explorer.solana.com/tx/43Pahib7rdLYov3V28iRfbsWVbm56RkeQfPbjPVtzTNBM5Yi8yHDKCAxp8GYxVHDh7p93uxZ3Jzxut2W7SSYszA?cluster=devnet) ·
[suscribir](https://explorer.solana.com/tx/3PJXJQyCmhQTPNbokEWw4EK2GBefJBsic1HwsvuXg78KvmH1JHTh8CiHTS3r2rpzB414caroHjiGMKm2yNybFdBe?cluster=devnet) ·
[cobrar 0,01 USDC](https://explorer.solana.com/tx/2pbvy5PC9BmRodop2AfcL1tv6mgssb5fAQr6fR2NdQQCSA4bs7xGSCVAP3QZq4b2u44iydkUXEwwzN3DUyQA32KG?cluster=devnet) ·
[cancelar](https://explorer.solana.com/tx/2nHxkGEM5bJoFDDBXqcfXH2cBEAgieQdnNjTgi6mauvEmMZ749UPP3NJabVuQspBdjNgmq1rUgAbU7QQ1ktcuidf?cluster=devnet).
El protocolo expresa el período como 720 horas: 30 días fijos, no mes calendario.

6. Repita el mismo comprobante: debe rechazarse y no volver a ejecutar el handler.

El cliente requiere `SOLANA_PRIVATE_KEY` como arreglo JSON de 64 bytes, sólo en el proceso local. El repositorio ignora `.local-wallets/` y nunca debe recibir keypairs en Git. No se cambia a mainnet sin revisión y autorización explícita.

Con gateway y PostgreSQL activos, el verificador automatiza saldo antes/después, replay, indexación, finalidad y Explorer:

```bash
SOLANA_PRIVATE_KEY='[...64 bytes...]' \
MERCHANT_WALLET='<wallet pública del proveedor>' \
pnpm --filter @usemeterkit/example-client verify:devnet
```

El comando sólo imprime evidencia JSON y nunca escribe la clave en disco.

## Estado verificable

La liquidación devnet verificable de 0,01 USDC es
[`61NPoR…Hsqsf`](https://explorer.solana.com/tx/61NPoRT92dwGZby6q4qAoFP9CG9UAUKBM3PZtW1BbwHTWvB3udMKgmcEfUPMCqvjjUjKEpakgmFomVwWVpjHsqsf?cluster=devnet).
Consulte [`docs/audit.md`](docs/audit.md) para ver la evidencia y los pendientes sin maquillar.

## Documentación

Arquitectura, dependencias verificadas, seguridad, auditoría, negocio, competencia, financiación, one-pager, pitch deck, demo, grants y roadmap están en [`docs/`](docs/).

La candidatura al Agentic Engineering Grant dispone de un
[`evidence pack auditable`](docs/agentic-grant-pack/00-READ-ME-FIRST.md) con
especificación, prueba de trabajo, trazabilidad y resultados de verificación.
El runbook de [`despliegue público devnet`](docs/deployment-devnet.md) mantiene
gateway y dashboard sin claves privadas y bloquea configuraciones mainnet.

Apache-2.0.
