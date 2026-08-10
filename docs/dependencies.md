# Dependencias técnicas verificadas

Consulta y lockfile: **2026-08-03**.

## Política de actualizaciones

Dependabot agrupa actualizaciones minor y patch semanalmente y continúa creando
alertas de seguridad sin importar esta política. Los saltos major se ignoran en
los PR automáticos: se evalúan como migraciones explícitas desde documentación
oficial, con paquetes acoplados en una sola rama y toda la matriz CI. Esto evita
PRs incompatibles como `@solana/kit` 7 separado de `@solana/sysvars` 7 y no
equivale a ignorar vulnerabilidades.

Las actualizaciones productivas tampoco se mezclan indiscriminadamente. x402,
runtime web/Wallet Standard y runtime del gateway forman grupos independientes;
el resto usa un grupo residual. Así, un fallo de Next/React no bloquea ni oculta
una actualización de x402, y cada cambio conserva una superficie de regresión
revisable.

Cadencia: revisar alertas de seguridad de inmediato y revisar versiones major al
menos una vez por mes o cuando una dependencia soportada anuncie fin de vida.

| Área                      | Selección fijada               | Motivo                                                           |
| ------------------------- | ------------------------------ | ---------------------------------------------------------------- |
| x402                      | `@x402/*` 2.20.0               | API v2 oficial, Express, fetch, SVM y MCP                        |
| Solana para x402          | `@solana/kit` 5.5.1            | combinación compatible con los paquetes SPL usados por x402 2.20 |
| Subscriptions             | `@solana/subscriptions` 0.4.0  | SDK oficial del programa canónico                                |
| Solana para subscriptions | `@solana/kit` 6.10.0           | peer requerido por Subscriptions 0.4                             |
| Wallet                    | Wallet Standard React 1.0.3    | discovery, conexión, firma de mensajes y envío                   |
| Dashboard                 | Next.js 16.2.12 / React 19.1.1 | App Router, build estático y cliente Wallet Standard             |
| Gateway                   | Express 5.1                    | middleware HTTP portable y fácil de autohospedar                 |
| Metadata                  | PostgreSQL 17                  | constraints atómicos, idempotencia y consultas de recibos        |
| Tests                     | Vitest 3.2 / Playwright 1.54   | unidad, integración DB/MCP y navegador                           |

Kit 5 y Kit 6 no se fuerzan dentro de una única instancia: viven en los paquetes consumidores correspondientes. `pnpm peers check` pasa sin incidencias. Esta separación evita fingir compatibilidad entre el stack SPL de x402 y el SDK más nuevo de Subscriptions.

Fuentes oficiales:

- [Solana Kit](https://solana.com/docs/clients/javascript)
- [x402](https://docs.cdp.coinbase.com/x402/welcome)
- [Solana Subscriptions](https://solana.com/docs/payments/subscriptions/overview)
- [Wallet Standard](https://github.com/wallet-standard/wallet-standard)
- [USDC contract addresses](https://developers.circle.com/stablecoins/usdc-contract-addresses)
- [Model Context Protocol TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [Next.js](https://nextjs.org/docs)
- [Express](https://expressjs.com/)
- [PostgreSQL](https://www.postgresql.org/docs/17/)
- [Vitest](https://vitest.dev/guide/)
- [Playwright](https://playwright.dev/docs/intro)
