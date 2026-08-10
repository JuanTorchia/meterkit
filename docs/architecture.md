# Arquitectura de MeterKit

> Sincronizado 2026-08-10: la API pública recomendada es `protect()`. Express,
> Next.js, Hono y MCP mantienen el mismo ciclo x402 2.21. El presupuesto de
> agente reserva capacidad antes de liquidar y sólo la consume después de un
> settlement durable; una respuesta ambigua permanece reservada y recuperable.

Fecha de decisión: 2026-08-03.

## Resumen

MeterKit es un plano de control no custodial. El cliente firma; el facilitador x402 verifica y liquida; USDC viaja directamente a la cuenta token del proveedor. MeterKit conserva solamente configuración, índices y recibos públicos.

```text
Cliente/agente ──HTTP──> Gateway + @usemeterkit/sdk ──verify/settle──> facilitador x402
      │                         │                                      │
      │ firma local             └── metadata/recibos ──> PostgreSQL    │
      └──────────────────── USDC/Solana devnet ────────────────────────┘
                                      │
Proveedor <──────────────── liquidación directa + Explorer ───────────┘
```

## Componentes

- `apps/web`: landing y dashboard Next.js 16. No maneja secretos de wallets.
- `apps/web/[lang]/docs`: documentación Fumadocs local, buscable y equivalente
  en inglés/español.
- `apps/gateway`: API Express 5, 402, rate limiting, índice de ventas.
- `packages/sdk`: middleware publicable y adaptador de facilitador x402.
- `packages/core`: tipos, validaciones, recibos y abstracción de persistencia.
- `packages/subscriptions`: integración aislada con `@solana/subscriptions` 0.4.0.
- `packages/create-meterkit`: inicializador determinista, secretless y todavía
  candidato de workspace; no se presenta como paquete npm publicado.
- `packages/pilot`: diagnóstico y evidencia consentida/minimizada; todavía no
  es un paquete npm público.
- `examples/client`: cliente x402 con firmante inyectado por el usuario.
- `examples/mcp-scout`: servidor MCP útil, primera consulta gratuita.

## Decisiones

1. Paquetes oficiales x402 2.21 coordinados, esquema `exact`, CAIP-2 devnet y
   `PAYMENT-REQUIRED`/`PAYMENT-SIGNATURE`.
2. Mint devnet USDC de Circle: `4zMMC...DncDU`, 6 decimales; 0,01 USDC son `10000` unidades.
3. El facilitador público `https://x402.org/facilitator` se usa sólo en testnet. Producción exige un facilitador autenticado o propio.
4. Subscriptions usa el programa canónico `De1eg...R44`. La UI siempre ofrece revocación explícita; no confía en rotación de autoridad.
5. Kora queda como adaptador opcional posterior: mejora UX de gas, pero introduce una wallet patrocinadora operada por el despliegue y no es necesaria para el primer cobro.
6. PostgreSQL es el almacén alojado. El `MemoryPaymentStore` permite tests deterministas y desarrollo sin infraestructura.
7. Comisión alojada: no se inserta silenciosamente. Sólo puede aplicarse como transferencia adicional visible y firmada por el pagador; el modo open source usa 0%.
8. El alta de producto exige challenge Ed25519 de Wallet Standard, válido cinco minutos y consumido una sola vez. `Idempotency-Key` evita duplicados seguros.
9. El dashboard emite una sesión bearer aleatoria de una hora después de una
   firma ligada a dominio y request. PostgreSQL almacena sólo SHA-256 del token;
   productos y pagos privados se filtran por `owner_wallet`. La demo pública usa
   rutas `/v1/public/*` separadas.
10. El proxy alojado sólo acepta HTTPS hacia una allowlist explícita, sin IP,
    credenciales, puerto alternativo ni redirects. Limita la respuesta a 1 MB y
    exige JSON. El middleware self-hosted sigue siendo la integración preferida.
11. La interfaz se publica en inglés por defecto para grants y pilotos globales,
    con cambio inmediato a español para Latinoamérica.
12. Los challenges de wallet viven en PostgreSQL y se consumen atómicamente.
13. Cada producto tiene un UUID interno inmutable y un slug DNS minúsculo de
    hasta 63 caracteres, único dentro de `(owner_wallet, slug)`. Las rutas nuevas
    incluyen owner y slug. La ruta histórica por slug sólo se resuelve si existe
    un único producto compatible; una ambigüedad se rechaza en vez de cruzar
    tenants.
14. Finality nunca infiere un fallo desde una respuesta RPC ausente y admite un
    proveedor secundario.
15. Las imágenes usan base por digest, Next.js standalone y dependencias
    productivas del gateway.
16. Las allowances oficiales se proyectan a una vista canónica con owner,
    delegate, mint, scope, límite por request, límite agregado, gasto, reserva,
    finality y revocación. PostgreSQL serializa reserve/consume/release para
    evitar overspend entre réplicas.
17. GitHub es una identidad opcional enlazada a una sesión de wallet. No
    sustituye la propiedad onchain ni autoriza pagos; los estados OAuth se
    almacenan hasheados, expiran y se consumen una sola vez.
18. El harness profesional separa latencia local de dependencias externas y
    registra el commit, entorno, percentiles, outcomes y ejecuciones duplicadas.

## Consistencia y finalización

El gateway sólo entrega el recurso tras `settle` y una segunda validación RPC. Esta compara balances token pre/post: el payer debe perder al menos el monto y el owner destinatario debe recibir exactamente el monto, con el mint configurado y `meta.err=null`. La firma es clave única. PostgreSQL aplica `UNIQUE(network, signature)` incluso bajo carreras. La respuesta incluye `PAYMENT-RESPONSE`; el índice proyecta un enlace Explorer. El pago entra como `confirmed` y un reconciliador consulta `getSignatureStatuses` cada 15 segundos para promover únicamente firmas exitosas a `finalized`.

La identidad persistida del producto usa `products.uid`; los pagos apuntan a ese
UUID. Slug y owner siguen presentes como identidad pública legible, sin permitir
que un proveedor reserve el slug de otro.

Los paquetes públicos confirmados son `@usemeterkit/core@0.1.0` y
`@usemeterkit/sdk@0.1.0`. Los demás workspaces siguen siendo candidatos hasta
una release versionada y aprobada; un build local no equivale a publicación.

## Fuentes técnicas

- [x402 v2 y redes](https://docs.cdp.coinbase.com/x402/network-support)
- [Subscriptions & Allowances](https://solana.com/docs/payments/subscriptions/overview)
- [SDK oficial de subscriptions](https://github.com/solana-foundation/subscriptions)
- [USDC en Solana](https://developers.circle.com/stablecoins/usdc-contract-addresses)
- [Kora](https://solana.com/docs/payments/send-payments/payment-processing/fee-abstraction)
- [MCP TypeScript SDK](https://ts.sdk.modelcontextprotocol.io/server)
