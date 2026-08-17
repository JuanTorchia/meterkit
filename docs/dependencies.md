# Dependencias técnicas verificadas

Consulta y lockfile: **2026-08-17**.

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

| Área                      | Selección fijada                   | Motivo                                                         |
| ------------------------- | ---------------------------------- | -------------------------------------------------------------- |
| x402                      | `@x402/*` 2.22.0                   | Candidato coordinado en cuatro superficies; Apache-2.0         |
| Solana para x402          | `@solana/kit` 5.5.1                | cohorte fijada y separada del runtime de Subscriptions         |
| Subscriptions             | `@solana/subscriptions` 0.4.0      | SDK oficial del programa canónico                              |
| Solana para subscriptions | `@solana/kit` 6.10.0               | peer requerido por Subscriptions 0.4                           |
| Wallet                    | Wallet Standard React 1.0.3        | discovery, conexión, firma de mensajes y envío                 |
| Dashboard                 | Next.js 16.3.1 / React 19.2.8      | App Router, build estático y cliente Wallet Standard; MIT      |
| Gateway                   | Express 5.1                        | middleware HTTP portable y fácil de autohospedar               |
| Metadata                  | PostgreSQL 17                      | constraints atómicos, idempotencia y consultas de recibos      |
| Docs                      | Fumadocs Core 16.14.3 / MDX 15.2.3 | MIT; contenido estático, búsqueda local y paridad bilingüe     |
| Hono                      | Hono 4.13 / `@x402/hono` 2.22      | superficie mantenida dentro de la cohorte x402; MIT/Apache-2.0 |
| Tests                     | Vitest 3.2 / Playwright 1.54       | unidad, integración DB/MCP y navegador                         |

Kit 5 y Kit 6 no se fuerzan dentro de una única instancia: viven en los paquetes
consumidores correspondientes. `@solana-program/token-2022@0.9.0`, incorporado
por Subscriptions 0.4, declara simultáneamente Kit 6 y `@solana/sysvars` 5. El
cliente y paquete de subscriptions declaran ambos peers explícitamente para que
`pnpm peers check` pueda validar cada contexto. La regla pnpm raíz permite
únicamente el par `token-2022 > sysvars` entre majors 5 y 6 mientras upstream
alinea ese rango; no silencia ningún otro peer. Esta separación evita fingir
compatibilidad entre el stack SPL de x402 y el SDK más nuevo de Subscriptions.

Los cambios de este ciclo mantienen los mismos roles: x402 implementa el
protocolo de cobro (Apache-2.0), Next/React sirven el dashboard (MIT),
`express-rate-limit` limita abuso del gateway (MIT), y `tsx` más
`typescript-eslint` son herramientas de desarrollo (MIT). No se añadió una
dependencia runtime ni cambió la propiedad: los dueños siguen siendo SDK,
Web/Gateway y Tooling. La vigencia se revisa semanalmente con Dependabot y ante
avisos del proveedor.

Fumadocs Core y Fumadocs MDX usan líneas de versión distintas y compatibles;
no se igualan artificialmente. Las exclusiones de edad mínima en pnpm sólo
permiten estas versiones exactas ya verificadas por build, E2E y auditoría, sin
abrir rangos para publicaciones nuevas.

`scripts/verify-compatibility.mjs` hace cumplir esta tabla en CI y ya no depende
de que alguien recuerde leerla. Recorre todos los manifests del workspace y
falla con `SOLANA_KIT_DRIFT` si un paquete se sale de la versión fijada para su
cohorte, `SOLANA_RANGE_NOT_PINNED` si aparece un rango flotante en `@solana/*`,
`SOLANA_SUBSCRIPTIONS_COHORT` si Subscriptions se declara fuera de Kit 6, y
`SOLANA_MANIFEST_UNGUARDED` si un paquete nuevo incorpora Kit sin que se le
asigne una cohorte de forma deliberada. Las cohortes se mantienen separadas a
propósito: unificarlas fingiría una compatibilidad que upstream no ofrece.

### CLI de autoservicio

`@usemeterkit/cli` usa `@solana/kit` 5.5.1 con versión exacta para validar claves
públicas y, en fases posteriores, construir el pago devnet sin implementar una
variante propietaria del protocolo. Kit tiene licencia MIT, mantenimiento activo
y ya forma parte de la cohorte verificada del SDK. `zod` valida los límites y la
salida estructurada. No se incorpora una biblioteca de prompts: la interacción
se implementa con APIs estándar de Node para reducir superficie de supply chain.

## Clasificación de paquetes MeterKit

| Paquete                      | Estado                 | Publicación                                                |
| ---------------------------- | ---------------------- | ---------------------------------------------------------- |
| `@usemeterkit/core`          | Primario               | 0.2.0 público con provenance OIDC                          |
| `@usemeterkit/sdk`           | Primario               | 0.2.0 público con provenance OIDC                          |
| `create-meterkit`            | Primario               | 0.2.0 público con provenance OIDC                          |
| `@usemeterkit/subscriptions` | Experimental           | No publicado; requiere evidencia devnet nueva              |
| `@usemeterkit/pilot`         | Soportado internamente | No publicado; evaluar después del initializer              |
| `@usemeterkit/policy-webacy` | Adaptador opcional     | No publicado; nunca requisito del core                     |
| `@usemeterkit/database`      | Interno                | No publicar hasta estabilizar un contrato de autohospedaje |

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
