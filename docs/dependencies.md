# Dependencias técnicas verificadas

Consulta y lockfile: **2026-08-10**.

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

| Área                      | Selección fijada                   | Motivo                                                           |
| ------------------------- | ---------------------------------- | ---------------------------------------------------------------- |
| x402                      | `@x402/*` 2.21.0                   | Adoptado tras pasar fixtures coordinadas en cuatro superficies   |
| Solana para x402          | `@solana/kit` 5.5.1                | combinación compatible con los paquetes SPL usados por x402 2.21 |
| Subscriptions             | `@solana/subscriptions` 0.4.0      | SDK oficial del programa canónico                                |
| Solana para subscriptions | `@solana/kit` 6.10.0               | peer requerido por Subscriptions 0.4                             |
| Wallet                    | Wallet Standard React 1.0.3        | discovery, conexión, firma de mensajes y envío                   |
| Dashboard                 | Next.js 16.2.12 / React 19.2.8     | App Router, build estático y cliente Wallet Standard             |
| Gateway                   | Express 5.1                        | middleware HTTP portable y fácil de autohospedar                 |
| Metadata                  | PostgreSQL 17                      | constraints atómicos, idempotencia y consultas de recibos        |
| Docs                      | Fumadocs Core 16.14.3 / MDX 15.2.3 | MIT; contenido estático, búsqueda local y paridad bilingüe       |
| Hono                      | Hono 4.13 / `@x402/hono` 2.21      | superficie mantenida tras superar la misma aceptación x402       |
| Tests                     | Vitest 3.2 / Playwright 1.54       | unidad, integración DB/MCP y navegador                           |

Kit 5 y Kit 6 no se fuerzan dentro de una única instancia: viven en los paquetes
consumidores correspondientes. `@solana-program/token-2022@0.9.0`, incorporado
por Subscriptions 0.4, declara simultáneamente Kit 6 y `@solana/sysvars` 5. El
cliente y paquete de subscriptions declaran ambos peers explícitamente para que
`pnpm peers check` pueda validar cada contexto. La regla pnpm raíz permite
únicamente el par `token-2022 > sysvars` entre majors 5 y 6 mientras upstream
alinea ese rango; no silencia ningún otro peer. Esta separación evita fingir
compatibilidad entre el stack SPL de x402 y el SDK más nuevo de Subscriptions.

Fumadocs Core y Fumadocs MDX usan líneas de versión distintas y compatibles;
no se igualan artificialmente. Las exclusiones de edad mínima en pnpm sólo
permiten estas versiones exactas ya verificadas por build, E2E y auditoría, sin
abrir rangos para publicaciones nuevas.

## Clasificación de paquetes MeterKit

| Paquete                      | Estado                 | Publicación                                                                  |
| ---------------------------- | ---------------------- | ---------------------------------------------------------------------------- |
| `@usemeterkit/core`          | Primario               | 0.1.0 público; próxima versión por OIDC staged publishing                    |
| `@usemeterkit/sdk`           | Primario               | 0.1.0 público; próxima versión por OIDC staged publishing                    |
| `create-meterkit`            | Experimental           | No publicado ni reservado; requiere pruebas limpias y acción del propietario |
| `@usemeterkit/subscriptions` | Experimental           | No publicado; requiere evidencia devnet nueva                                |
| `@usemeterkit/pilot`         | Soportado internamente | No publicado; evaluar después del initializer                                |
| `@usemeterkit/policy-webacy` | Adaptador opcional     | No publicado; nunca requisito del core                                       |
| `@usemeterkit/database`      | Interno                | No publicar hasta estabilizar un contrato de autohospedaje                   |

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
