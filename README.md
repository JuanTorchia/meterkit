# MeterKit

Open-source, non-custodial USDC payments for APIs and MCP tools on Solana.

[![CI](https://github.com/JuanTorchia/meterkit/actions/workflows/ci.yml/badge.svg)](https://github.com/JuanTorchia/meterkit/actions/workflows/ci.yml)

> Estado: **MVP funcional, sólo devnet**. El flujo x402 completo fue liquidado y finalizado en devnet el 2026-08-03; suscripciones y MCP continúan como módulos experimentales.

## Qué incluye

- x402 v2 `exact` para Solana devnet.
- Middleware oficial x402 para Express con requisitos estrictos y revalidación RPC de balances token.
- replay protection atómico en PostgreSQL, idempotencia, rate limit, challenge reciente y recibos.
- Premium Weather API a 0,01 USDC.
- dashboard Next.js con Wallet Standard, alta autorizada por firma y enlaces Explorer.
- builders y transacciones Wallet Standard de `@solana/subscriptions` para fixed/recurring/plans, alta y revocación; el dashboard puede firmar y enviar una revocación en devnet.
- MCP “Solana Project Scout” con preview gratuito, fuentes GitHub públicas y cobro oficial x402/MCP.

MeterKit no recibe fondos, no conoce seed phrases y no firma por usuarios.

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
```

## Pago devnet

1. Obtenga SOL devnet y USDC devnet del faucet oficial.
2. Asegúrese de que el proveedor tenga una cuenta asociada (ATA) para el mint USDC devnet. El CLI permite crearla sin conocer la clave del proveedor:
   `spl-token create-account 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU --owner <wallet-proveedor> --fee-payer <keypair-pagador> --url devnet`.
3. Configure la wallet pública del proveedor y reinicie gateway.
4. Use un signer local con `@x402/svm`; llame al endpoint.
5. Conserve la firma, abra `https://explorer.solana.com/tx/<firma>?cluster=devnet`.
6. Repita el mismo comprobante: debe rechazarse y no volver a ejecutar el handler.

El cliente requiere `SOLANA_PRIVATE_KEY` como arreglo JSON de 64 bytes, sólo en el proceso local. El repositorio ignora `.local-wallets/` y nunca debe recibir keypairs en Git. No se cambia a mainnet sin revisión y autorización explícita.

Con gateway y PostgreSQL activos, el verificador automatiza saldo antes/después, replay, indexación, finalidad y Explorer:

```bash
SOLANA_PRIVATE_KEY='[...64 bytes...]' \
MERCHANT_WALLET='<wallet pública del proveedor>' \
pnpm --filter @meterkit/example-client verify:devnet
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
