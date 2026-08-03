# MeterKit

## USDC payments for the agentic web

Monetizar una API hoy implica cuentas, tarjetas, API keys, facturación y restricciones geográficas. MeterKit permite conectar una wallet, fijar un precio y comenzar a cobrar USDC por solicitud o suscripción.

El proveedor integra unas pocas líneas de middleware. Una llamada sin pago recibe HTTP 402 con requisitos x402. El cliente o agente firma localmente, el facilitador liquida USDC directamente al proveedor y repite la llamada. MeterKit valida el recibo, bloquea replay y muestra la venta con enlace a Solana Explorer. No custodia fondos ni claves.

El primer mercado son desarrolladores de APIs, MCP y herramientas de IA, particularmente en Latinoamérica. MeterKit ofrece un SDK Apache-2.0 autohospedable, un dashboard alojado y soporte de integración. Los ingresos provienen del plan Pro, integraciones y una comisión opcional de hasta 1% únicamente cuando sea visible, firmada y no custodial.

La demo “Solana Project Scout” genera reportes factuales con fuentes públicas: primera consulta gratis y siguientes por micropago. No da asesoramiento de inversión.

El MVP combina x402 v2 sobre Solana, USDC, recibos verificables y las nuevas primitivas nativas de Subscriptions & Allowances para planes mensuales y límites de gasto de agentes. El objetivo de cuatro semanas: pago devnet, 3–5 pilotos, suscripción revocable, dashboard e implementación alojada.

Éxito inicial: 10 pagos devnet sin replay, cinco instalaciones externas y el primer cliente de integración.

