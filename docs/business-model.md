# Modelo de negocio

> Actualización 2026-08-10: el wedge es SDK OSS más integración pagada. El
> hosted puede cobrar suscripción o comisión transparente/no custodial; no hay
> token, rendimientos, trading ni ingresos afirmados. El Agentic Engineering
> Grant fue aprobado por 200 USDG; aprobación no se presenta como ingreso de
> clientes ni como pago recibido hasta verificar la liquidación.

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

La vía más rápida no es construir una plataforma completa: integrar el
middleware a un proveedor real y cobrar una tarifa fija de implementación. El
microgrant Agentic de 200 USDG ya fue aprobado. La siguiente validación no se
infiere del grant: 3 desarrolladores independientes integran el SDK, uno liquida
≥10 pagos devnet durante siete días y uno expresa disposición concreta a pagar
una integración.

Estado factual al 2026-08-10: dos paquetes públicos, validación interna completa
en devnet, cero pilotos externos verificados, cero clientes y cero ingresos
comerciales afirmados.

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
