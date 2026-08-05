# Backlog y roadmap de cuatro semanas

## Hardening previo a pilotos — 2026-08-05

- [x] Cerrar escape de ruta del cliente agente.
- [x] Persistir y consumir challenges entre réplicas.
- [x] Evitar falsos fallos de finality y permitir RPC secundario.
- [x] Canonizar slugs de producto.
- [x] Crear/listar/revocar allowances desde el dashboard.
- [x] Fijar Actions e imágenes y añadir CodeQL, SBOM y Trivy.
- [x] Añadir `pnpm evidence:grant`.
- [ ] Migrar namespace global a UUID + slug por owner antes de alta pública abierta.
- [ ] Obtener 3–5 pilotos externos; no sustituirlos con agentes internos.

## P0 — recorrido cobrable

- [x] Monorepo, validación y separación devnet/mainnet.
- [x] Challenge HTTP 402 x402 v2.
- [x] Adaptador de settlement, recibo y protección replay.
- [x] Premium Weather API y cliente ejemplo.
- [x] Persistencia PostgreSQL y constraint único de comprobante.
- [x] Pago real devnet con wallets de prueba, rechazo de replay y Explorer.
- [x] Reconciliación de finalidad por RPC y estados `confirmed`/`finalized`.

## P1 — producto demostrable

- [x] Landing/dashboard visual.
- [x] MCP Solana Project Scout base y primera consulta gratis.
- [x] Adaptador/política de Subscriptions & Allowances.
- [x] Wallet Standard y creación persistente autorizada por firma Ed25519.
- [x] Enlazar lifecycle x402 oficial a cada invocación MCP pagada.
- [x] SDK empaquetable e importado desde tarball limpio.
- [ ] Plan mensual y cobro periódico onchain completos.
- [x] Revocación firmable desde Wallet Standard y enlace Explorer.

## P2 — pilotos y operación

- [ ] Exportación CSV/webhooks.
- [ ] Observabilidad y reconciliación RPC.
- [ ] Kora opcional con límites.
- [ ] Cinco pilotos y caso de estudio.

## Semana 1

Congelar contratos x402, completar tests adversariales, Postgres y una transacción USDC devnet. Salida: firma Explorer + replay rechazado.

## Semana 2

Wallet Standard, CRUD de productos, dashboard real, cliente publicable y despliegue de preview autorizado. Salida: otro desarrollador sigue README.

## Semana 3

Plan mensual, fixed/recurring allowance, revocación y MCP Streamable HTTP pagado. Salida: vídeo de cada ciclo devnet.

## Semana 4

3–5 pilotos, correcciones, observabilidad, documentación, aplicaciones y demo. Salida: release `v0.1.0`.
