# Modelo de negocio

> Actualización 2026-08-10: el wedge es SDK OSS más integración pagada. El
> hosted puede cobrar suscripción o comisión transparente/no custodial; no hay
> token, rendimientos, trading ni ingresos afirmados. Créditos Webacy son apoyo
> en especie, nunca efectivo.

## Propuesta

“Conecta una wallet, fija un precio y comienza a cobrar USDC por solicitud o suscripción.”

## Oferta

| Plan           | Precio inicial | Incluye                                          |
| -------------- | -------------: | ------------------------------------------------ |
| Open source    |             $0 | SDK, gateway propio, recibos, comunidad          |
| Hosted Starter |  $0 + hasta 1% | dashboard, 1.000 liquidaciones, analítica básica |
| Pro            |        $49/mes | mayor volumen, alertas, exportación, soporte     |
| Integración    |   desde $1.500 | implementación, revisión y capacitación          |
| Enterprise     |     cotización | SSO, SLA, despliegue dedicado, soporte           |

La comisión sólo se activa si el cliente ve y firma una transferencia adicional no custodial. Si x402/Solana no permiten un reparto atómico transparente para una combinación, MeterKit cobra el SaaS por separado y no intercepta fondos.

## Primer ingreso

La vía más rápida no es construir una plataforma completa: integrar el middleware a un proveedor real y cobrar una tarifa fija de implementación. Paralelamente se solicita el microgrant de 200 USDG. Métrica de validación: 3–5 desarrolladores instalan el SDK, uno liquida ≥10 pagos devnet y uno acepta pagar una integración.

## Dogfooding y primer usuario

MeterKit nació a partir de un problema encontrado en una aplicación privada que el
equipo ya estaba desarrollando: necesitábamos monetizar capacidades de API o IA
globalmente sin introducir custodia, tarjetas, facturación tradicional ni una
infraestructura de pagos distinta para cada herramienta.

Esa aplicación funcionará como integración interna de referencia:

- integrará el mismo SDK publicado que utilizan terceros;
- ejecutará el mismo flujo x402 y las mismas políticas de límites;
- servirá para detectar problemas de instalación, operación y reconciliación;
- producirá métricas de uso técnico separadas de la demo sintética;
- pagará al proveedor directamente, sin privilegios ni rutas privadas de MeterKit.

El uso interno demuestra que el producto resuelve un problema propio y evita
construir funciones sin necesidad. No se contabiliza como piloto externo,
validación independiente, ingreso ni adopción de terceros. La validación comercial
requiere además entre tres y cinco desarrolladores independientes y al menos un
cliente dispuesto a pagar.

## Guardrails

Sin token, rendimientos, trading, custodia ni almacenamiento de claves. MeterKit vende software, alojamiento, analítica y soporte.
