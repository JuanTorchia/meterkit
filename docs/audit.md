# Auditoría de estado del MVP

Fecha: **2026-08-04**. Este documento distingue implementación, prueba determinista y evidencia onchain.

| Criterio | Estado | Evidencia |
|---|---|---|
| Challenge x402 v2 de 0,01 USDC | Implementado y probado | `packages/sdk/src/index.test.ts` |
| Red, mint, monto y destinatario exactos | Implementado y probado | requisitos x402 + balances onchain pre/post |
| Settlement directo al proveedor | Verificado en devnet | 0,01 USDC llegó directamente a `9a4x…aiR5`; firma `61NPoR…Hsqsf` |
| Replay imposible | Implementado | `UNIQUE(network, signature)` y tests memoria/DB |
| Productos y pagos persistentes | Implementado | migración y test PostgreSQL |
| Wallet Standard | Implementado | conexión, challenge Ed25519, expiración y consumo único |
| Dashboard y Explorer | Implementado y E2E | Playwright escritorio/móvil |
| Cliente con límites de agente | Implementado | máximo por solicitud y sesión |
| Subscriptions & Allowances | Builders y transacciones firmables probados | fixed, recurring, monthly, subscribe, tres revocaciones y wire v0 |
| Ciclo subscription onchain | Pendiente | requiere cuentas devnet y envío de instrucciones |
| Botón de revocación | Implementado | prepara blockhash devnet y usa `solana:signAndSendTransaction`; falta firma con wallet real |
| MCP Scout cobrado | Contrato stdio probado | challenge de 0,02 USDC, recurso MCP explícito; falta settlement devnet |
| Finalidad RPC | Verificada en devnet | el reconciliador promovió la operación real a `finalized` |
| Idempotencia HTTP | Implementada y probada | key+hash+respuesta en PostgreSQL |
| SDK publicable | Empaquetado y probado | tarball limpio instalado/importado fuera del monorepo |
| Pago real USDC devnet | Completado 2026-08-03 | [`61NPoR…Hsqsf`](https://explorer.solana.com/tx/61NPoRT92dwGZby6q4qAoFP9CG9UAUKBM3PZtW1BbwHTWvB3udMKgmcEfUPMCqvjjUjKEpakgmFomVwWVpjHsqsf?cluster=devnet) |
| Verificador devnet | Ejecutado | saldo proveedor `0 → 10000`, replay HTTP 402, registro PostgreSQL `finalized` |

## Comandos ejecutados

```bash
pnpm lint
pnpm typecheck
DATABASE_TEST_URL=postgresql://meterkit:meterkit@localhost:5432/meterkit pnpm test
pnpm build
pnpm test:e2e
```

Resultado actual: la batería incluye 27 tests unitarios/de integración, PostgreSQL concurrente, contrato MCP stdio, transacciones onchain serializadas y un E2E. La inspección visual no mostró overflow, errores de consola, respuestas HTTP fallidas ni overlays en 1440×1000 y 390×844.

## Preparación de despliegue — 2026-08-04

- La batería ampliada pasa **30/30 tests**.
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
- CORS permite exclusivamente el origen público del dashboard.
- Web y gateway están `running:healthy` en Coolify detrás de Cloudflare Tunnel;
  PostgreSQL no expone un puerto público.
- La base está incluida en monitoreo, backup cifrado y restauración aislada:
  el ensayo restauró sus **4 tablas** y los 10 dumps del host.
- No se habilitó mainnet ni se usaron fondos reales.

## Condición para cerrar el MVP

El flujo se ejecutó con wallets desechables de devnet. El facilitador patrocinó la transacción, el proveedor recibió 10 000 unidades atómicas de USDC, el mismo payload fue rechazado al repetirse y PostgreSQL mostró el recibo finalizado. La creación previa del ATA del proveedor quedó identificada como requisito operativo.

## Auditoría de entregables

| Entregable solicitado | Evidencia | Estado |
|---|---|---|
| Aplicación funcional | `apps/web`, `apps/gateway`, PostgreSQL | Público en devnet |
| SDK/middleware publicable | `packages/sdk`, tarball instalado externamente | Verificado |
| Servidor MCP útil | `examples/mcp-scout`, test stdio y fuentes GitHub | Verificado salvo pago real |
| Landing y dashboard | Next.js + capturas desktop/móvil/live | Verificado local y público |
| README reproducible | `README.md`, `.env.example`, Compose | Verificado localmente |
| Arquitectura | `docs/architecture.md` | Listo |
| Modelo de negocio | `docs/business-model.md` | Listo |
| Competencia | `docs/competition.md` | Listo |
| Financiación vigente | `docs/funding.md` | Listo; enviar requiere identidad/KYC |
| Modelo de amenazas | `docs/security.md` | Listo |
| One-pager | `docs/one-pager.md` | Listo |
| Deck de 10 diapositivas | `docs/pitch-deck.md` | Listo |
| Demo de 90 segundos | `docs/demo-90s.md` | Guion listo; falta firma real |
| Grant Agentic | `docs/grant-agentic-draft.md` | Borrador listo |
| Grant Argentina | `docs/grant-argentina-draft.md` | Borrador listo |
| Colosseum Eternal | `docs/colosseum-eternal-draft.md` | Borrador listo |
| Backlog y roadmap | `docs/roadmap.md` | Listo |

## Auditoría del recorrido numerado

1. Conexión de proveedor: implementada con Wallet Standard.
2. “Premium Weather API”: sembrada en PostgreSQL.
3. Precio 0,01 USDC: `10000` unidades atómicas.
4. Endpoint protegido: `/v1/weather/premium` y proxy dinámico por producto.
5–9. Challenge, firma, pago, settle y respuesta: completados con USDC devnet.
10–11. Dashboard y Explorer: implementados; la fila sólo aparece tras persistir settlement.
12–14. Plan mensual, allowance y revocación: instrucciones canónicas y revocación Wallet Standard implementadas; falta transacción devnet real.
15. MCP cobrado: challenge stdio probado; falta settlement devnet real.
