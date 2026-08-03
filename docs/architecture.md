# Arquitectura de MeterKit

Fecha de decisión: 2026-08-03.

## Resumen

MeterKit es un plano de control no custodial. El cliente firma; el facilitador x402 verifica y liquida; USDC viaja directamente a la cuenta token del proveedor. MeterKit conserva solamente configuración, índices y recibos públicos.

```text
Cliente/agente ──HTTP──> Gateway + @meterkit/sdk ──verify/settle──> facilitador x402
      │                         │                                      │
      │ firma local             └── metadata/recibos ──> PostgreSQL    │
      └──────────────────── USDC/Solana devnet ────────────────────────┘
                                      │
Proveedor <──────────────── liquidación directa + Explorer ───────────┘
```

## Componentes

- `apps/web`: landing y dashboard Next.js 16. No maneja secretos de wallets.
- `apps/gateway`: API Express 5, 402, rate limiting, índice de ventas.
- `packages/sdk`: middleware publicable y adaptador de facilitador x402.
- `packages/core`: tipos, validaciones, recibos y abstracción de persistencia.
- `packages/subscriptions`: integración aislada con `@solana/subscriptions` 0.4.0.
- `examples/client`: cliente x402 con firmante inyectado por el usuario.
- `examples/mcp-scout`: servidor MCP útil, primera consulta gratuita.

## Decisiones

1. x402 v2, esquema `exact`, CAIP-2 devnet y `PAYMENT-REQUIRED`/`PAYMENT-SIGNATURE`.
2. Mint devnet USDC de Circle: `4zMMC...DncDU`, 6 decimales; 0,01 USDC son `10000` unidades.
3. El facilitador público `https://x402.org/facilitator` se usa sólo en testnet. Producción exige un facilitador autenticado o propio.
4. Subscriptions usa el programa canónico `De1eg...R44`. La UI siempre ofrece revocación explícita; no confía en rotación de autoridad.
5. Kora queda como adaptador opcional posterior: mejora UX de gas, pero introduce una wallet patrocinadora operada por el despliegue y no es necesaria para el primer cobro.
6. PostgreSQL es el almacén alojado. El `MemoryPaymentStore` permite tests deterministas y desarrollo sin infraestructura.
7. Comisión alojada: no se inserta silenciosamente. Sólo puede aplicarse como transferencia adicional visible y firmada por el pagador; el modo open source usa 0%.
8. El alta de producto exige challenge Ed25519 de Wallet Standard, válido cinco minutos y consumido una sola vez. `Idempotency-Key` evita duplicados seguros.

## Consistencia y finalización

El gateway sólo entrega el recurso tras `settle` y una segunda validación RPC. Esta compara balances token pre/post: el payer debe perder al menos el monto y el owner destinatario debe recibir exactamente el monto, con el mint configurado y `meta.err=null`. La firma es clave única. PostgreSQL aplica `UNIQUE(network, signature)` incluso bajo carreras. La respuesta incluye `PAYMENT-RESPONSE`; el índice proyecta un enlace Explorer. El pago entra como `confirmed` y un reconciliador consulta `getSignatureStatuses` cada 15 segundos para promover únicamente firmas exitosas a `finalized`.

## Fuentes técnicas

- [x402 v2 y redes](https://docs.cdp.coinbase.com/x402/network-support)
- [Subscriptions & Allowances](https://solana.com/docs/payments/subscriptions/overview)
- [SDK oficial de subscriptions](https://github.com/solana-foundation/subscriptions)
- [USDC en Solana](https://developers.circle.com/stablecoins/usdc-contract-addresses)
- [Kora](https://solana.com/docs/payments/send-payments/payment-processing/fee-abstraction)
- [MCP TypeScript SDK](https://ts.sdk.modelcontextprotocol.io/server)
