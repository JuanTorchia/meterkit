# Auditoría de estado del MVP

Fecha de última revisión: **2026-08-10**. Este documento distingue
implementación, prueba determinista y evidencia onchain.

## Cierre P1/P2

- Scope del agente exacto por defecto y 13 pruebas adversariales.
- Challenge durable PostgreSQL, consumo atómico y límite por wallet.
- Finality sin falsos `failed` por ausencia RPC y fallback opcional.
- UUID interno y slug acotado por owner; rutas nuevas identifican el tenant y la
  compatibilidad por slug rechaza resultados ambiguos.
- Creación, listado, Explorer y revocación de allowances desde el dashboard.
- Actions por SHA, Dependabot, CodeQL, SBOM y Trivy.
- Imágenes por digest; escaneo local sin HIGH/CRITICAL corregibles.
- Baseline posterior: **92/92 tests**, lint, typecheck, build y Playwright verdes.

## Revisión de preparación de producto — 2026-08-10

- Quickstart Express independiente, sin clonar el monorepo ni levantar Docker,
  para obtener el primer challenge HTTP 402.
- Release workflow fijado por SHA, validación tag/manifests y provenance OIDC. Los
  paquetes están listos para publicar; npm continúa pendiente de configurar el
  trusted publisher y confirmar la publicación pública.
- Licencia Apache-2.0 completa, no sólo el encabezado abreviado.
- Navegación por teclado, foco visible, contraste y semántica revisados en desktop
  y mobile: axe no informó violaciones automáticas.
- Las superficies públicas distinguen explícitamente evidencia interna/sintética
  de pilotos, usuarios e ingresos externos.
- Playwright cubre landing, dashboard, demo, contrato 402, auth y CORS.
- Resultado actual: **97/97 tests en 14 archivos y 6/6 E2E**, además de lint,
  typecheck y build verdes. Estos conteos son evidencia local del commit de esta
  revisión; CI debe volver a validarlos en el PR.

Esta es evidencia interna; no representa pilotos, usuarios ni ingresos.

| Criterio                                | Estado                                           | Evidencia                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| --------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Challenge x402 v2 de 0,01 USDC          | Implementado y probado                           | `packages/sdk/src/index.test.ts`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Red, mint, monto y destinatario exactos | Implementado y probado                           | requisitos x402 + balances onchain pre/post                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Settlement directo al proveedor         | Verificado en devnet                             | 0,01 USDC llegó directamente a `9a4x…aiR5`; firma `61NPoR…Hsqsf`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Replay imposible                        | Implementado                                     | `UNIQUE(network, signature)` y tests memoria/DB                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| Productos y pagos persistentes          | Implementado                                     | migración y test PostgreSQL                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Wallet Standard                         | Implementado                                     | conexión, challenge Ed25519, expiración y consumo único                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Dashboard y Explorer                    | Implementado y E2E                               | Playwright escritorio/móvil                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Cliente con límites de agente           | Implementado                                     | máximo por solicitud y sesión                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| Subscriptions & Allowances              | Builders y transacciones firmables probados      | fixed, recurring, monthly, subscribe, tres revocaciones y wire v0                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Allowance onchain                       | Verificada en devnet                             | límite 1 USDC, vencimiento, revocación y cierre con rent recuperado                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Plan de 30 días onchain                 | Verificado en devnet                             | create plan, subscribe, pull de 0,01 USDC, cancel, cierre de autoridad y recuperación de la suscripción                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Botón de revocación                     | Implementado                                     | prepara blockhash devnet y usa `solana:signAndSendTransaction`; falta firma con wallet real                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| MCP Scout cobrado                       | Verificado en devnet                             | reporte `anza-xyz/kit`, 0,02 USDC directos y firma `4ZkuVW…pM5wg`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Finalidad RPC                           | Verificada en devnet                             | el reconciliador promovió la operación real a `finalized`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Idempotencia HTTP                       | Implementada y probada                           | key+hash+respuesta en PostgreSQL                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| SDK publicable                          | Empaquetado y probado; publicación npm pendiente | tarball limpio instalado/importado fuera del monorepo y workflow OIDC                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Pago real USDC devnet                   | Completado 2026-08-03                            | [`61NPoR…Hsqsf`](https://explorer.solana.com/tx/61NPoRT92dwGZby6q4qAoFP9CG9UAUKBM3PZtW1BbwHTWvB3udMKgmcEfUPMCqvjjUjKEpakgmFomVwWVpjHsqsf?cluster=devnet)                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Pago público alojado                    | Completado 2026-08-04                            | [`4tijLr…Tk2hnV`](https://explorer.solana.com/tx/4tijLrtrdHXHSitFPH99zR2kFFhaLwrcPo1zKzDmNdUu2T7rmis1Lddjg5YftrTUvZsVzUFngFXwQfdHNsTk2hnV?cluster=devnet), respuesta protegida, replay 402 y dashboard `finalized`                                                                                                                                                                                                                                                                                                                                                                                                       |
| Pago MCP real devnet                    | Completado 2026-08-04                            | [`4ZkuVW…pM5wg`](https://explorer.solana.com/tx/4ZkuVWNuEZLJkYxvU485YUWqNq6pgyQG54mVcCYpSgyXAHEWtCqKMsfLVKiNbuQuAPnymYzwS732cvPXzU7pM5wg?cluster=devnet)                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Allowance real devnet                   | Completada 2026-08-04                            | [`53Y9wj…9h4mi`](https://explorer.solana.com/tx/53Y9wj86BDMKB2Xs1LUBX1VDm6xejNpb5P1JUDi5Nr8wBYKXtZ21kq21VGKFCdtTLq8DZAmmLBVgJLHYSNy9h4mi?cluster=devnet), revocada en [`2Ccw1b…XqzoU`](https://explorer.solana.com/tx/2Ccw1bA19qKkHdoRHJ1vBa9tG32Dm8eDE9hHc8fH1RsWaoo3iehkWauYkHrfZaGKYLsg8RntJi95AAfFr9rXqzoU?cluster=devnet)                                                                                                                                                                                                                                                                                           |
| Suscripción real devnet                 | Completada 2026-08-04                            | [plan](https://explorer.solana.com/tx/43Pahib7rdLYov3V28iRfbsWVbm56RkeQfPbjPVtzTNBM5Yi8yHDKCAxp8GYxVHDh7p93uxZ3Jzxut2W7SSYszA?cluster=devnet), [subscribe](https://explorer.solana.com/tx/3PJXJQyCmhQTPNbokEWw4EK2GBefJBsic1HwsvuXg78KvmH1JHTh8CiHTS3r2rpzB414caroHjiGMKm2yNybFdBe?cluster=devnet), [pull](https://explorer.solana.com/tx/2pbvy5PC9BmRodop2AfcL1tv6mgssb5fAQr6fR2NdQQCSA4bs7xGSCVAP3QZq4b2u44iydkUXEwwzN3DUyQA32KG?cluster=devnet) y [cancel](https://explorer.solana.com/tx/2nHxkGEM5bJoFDDBXqcfXH2cBEAgieQdnNjTgi6mauvEmMZ749UPP3NJabVuQspBdjNgmq1rUgAbU7QQ1ktcuidf?cluster=devnet), todos finalizados |
| Verificador devnet                      | Ejecutado                                        | saldo proveedor `0 → 10000`, replay HTTP 402, registro PostgreSQL `finalized`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| Cierre x402 actualizado                 | Completado 2026-08-05                            | saldo proveedor `90000 → 100000`, replay HTTP 402, recibo `3622LW…NUCm8v` finalizado                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |

## Comandos ejecutados

```bash
pnpm lint
pnpm typecheck
DATABASE_TEST_URL=postgresql://meterkit:meterkit@localhost:5432/meterkit pnpm test
pnpm build
pnpm test:e2e
```

Resultado actual: la batería completa pasa con PostgreSQL, carrera concurrente,
contrato MCP stdio, transacciones onchain serializadas y Playwright E2E. La
ejecución del 2026-08-05 pasó **92/92 tests en 14 archivos** y **1/1 E2E**. La
inspección visual no mostró overflow, errores de consola, respuestas HTTP fallidas
ni overlays en 1440×1000 y 390×844.

## Preparación de despliegue — 2026-08-04

- La batería ampliada pasa completa; el conteo exacto queda registrado por CI para
  cada commit, evitando mantener una cifra obsoleta en documentación.
- `Dockerfile.gateway` y `Dockerfile.web` construyen imágenes reproducibles sin
  incluir `.env`, wallets ni artefactos locales.
- El dashboard respondió HTTP 200 desde su imagen de producción.
- El gateway respondió health y HTTP 402 desde su imagen de producción.
- Simulando un reverse proxy de un salto, el challenge publicó
  `https://gateway.example.invalid/v1/weather/premium`, red devnet, monto
  `10000` y el destinatario esperado.
- Web pública: `https://meterkit.juanchi.dev`, inspeccionada visualmente en
  navegador real.
- Gateway público: `https://meterkit-api.juanchi.dev`; `/health` responde 200
  con `custody:false`, persistencia PostgreSQL y Solana devnet.
- `/v1/weather/premium` responde 402 con x402 v2, esquema `exact`, monto
  `10000`, mint USDC devnet y pago directo a `9a4x…aiR5`.
- El flujo alojado completo liquidó e indexó `4tijLr…Tk2hnV`; el dashboard
  público muestra la venta y omite payer, receptor y mint para no publicar un
  índice de relaciones entre wallets.
- CORS permite exclusivamente el origen público del dashboard.
- Web y gateway están `running:healthy` en Coolify detrás de Cloudflare Tunnel;
  PostgreSQL no expone un puerto público.
- La base está incluida en monitoreo, backup cifrado y restauración aislada:
  el ensayo restauró sus **4 tablas** y los 10 dumps del host.
- No se habilitó mainnet ni se usaron fondos reales.

## Condición para cerrar el MVP

El flujo se ejecutó con wallets desechables de devnet. El facilitador patrocinó la transacción, el proveedor recibió 10 000 unidades atómicas de USDC, el mismo payload fue rechazado al repetirse y PostgreSQL mostró el recibo finalizado. La creación previa del ATA del proveedor quedó identificada como requisito operativo.

## Auditoría de entregables

| Entregable solicitado     | Evidencia                                            | Estado                                   |
| ------------------------- | ---------------------------------------------------- | ---------------------------------------- |
| Aplicación funcional      | `apps/web`, `apps/gateway`, PostgreSQL               | Público en devnet                        |
| SDK/middleware publicable | `packages/sdk`, tarball instalado externamente       | Verificado                               |
| Servidor MCP útil         | `examples/mcp-scout`, fuentes GitHub y recibo devnet | Verificado                               |
| Landing y dashboard       | Next.js + capturas desktop/móvil/live                | Verificado local y público               |
| README reproducible       | `README.md`, `.env.example`, Compose                 | Verificado localmente                    |
| Arquitectura              | `docs/architecture.md`                               | Listo                                    |
| Modelo de negocio         | `docs/business-model.md`                             | Listo                                    |
| Competencia               | `docs/competition.md`                                | Listo                                    |
| Financiación vigente      | `docs/funding.md`                                    | Listo; enviar requiere identidad/KYC     |
| Modelo de amenazas        | `docs/security.md`                                   | Listo                                    |
| One-pager                 | `docs/one-pager.md`                                  | Listo                                    |
| Deck de 10 diapositivas   | `docs/pitch-deck.md`                                 | Listo                                    |
| Demo de 90 segundos       | `docs/demo-90s.md`                                   | Guion listo con pagos devnet verificados |
| Grant Agentic             | `docs/grant-agentic-draft.md`                        | Borrador listo                           |
| Grant Argentina           | `docs/grant-argentina-draft.md`                      | Borrador listo                           |
| Colosseum Eternal         | `docs/colosseum-eternal-draft.md`                    | Borrador listo                           |
| Backlog y roadmap         | `docs/roadmap.md`                                    | Listo                                    |

## Auditoría del recorrido numerado

1. Conexión de proveedor: implementada con Wallet Standard.
2. “Premium Weather API”: sembrada en PostgreSQL.
3. Precio 0,01 USDC: `10000` unidades atómicas.
4. Endpoint protegido: `/v1/weather/premium` y proxy dinámico por producto.
   5–9. Challenge, firma, pago, settle y respuesta: completados con USDC devnet.
   10–11. Dashboard y Explorer: implementados; la fila sólo aparece tras persistir settlement.
   12–14. Allowance y revocación: ciclo devnet completo con límite de 1 USDC,
   vencimiento de siete días, cuatro transacciones finalizadas, PDA eliminada y
   rent recuperado. El plan nativo usa 720 horas: es un período fijo de 30 días,
   no un mes calendario.
5. MCP cobrado: liquidado y finalizado por 0,02 USDC devnet; reporte factual
   de `anza-xyz/kit` con fuentes y fecha.
