# Competencia y posicionamiento

> Posicionamiento actualizado 2026-08-10: MeterKit no reemplaza x402. Compite en
> adopción endurecida para Solana: middleware, recibos durables, replay/finality,
> MCP, allowances, inicializador, documentación bilingüe, evidencia y operación
> reproducible. Webacy es complementario.

Consulta original: 2026-08-03. Estado del producto reconciliado: 2026-08-10.

| Alternativa                                            | Fortaleza                                             | Hueco para MeterKit                                                            |
| ------------------------------------------------------ | ----------------------------------------------------- | ------------------------------------------------------------------------------ |
| [pay.sh](https://pay.sh/)                              | Capa Solana pay-as-you-go, directorio y subscriptions | MeterKit prioriza SDK open source, dashboard autohospedable y onboarding LatAm |
| [x402/CDP](https://docs.cdp.coinbase.com/x402/welcome) | Protocolo y facilitador multichain oficial            | MeterKit es producto vertical para proveedores Solana/MCP, no otro protocolo   |
| [Helius](https://www.helius.dev/)                      | Infraestructura/RPC y planes de API                   | Potencial cliente/diseño asociado; MeterKit sirve APIs de cualquier tamaño     |
| [Sphere](https://spherepay.co/)                        | Pagos stablecoin empresariales                        | MeterKit se centra en micropagos máquina-a-máquina y OSS                       |
| Stripe Billing                                         | UX SaaS madura                                        | Requiere cuentas/rails tradicionales y tiene cobertura geográfica distinta     |
| Gateway casero                                         | Control total                                         | Mayor coste de seguridad, replay, recibos, indexación y suscripciones          |

La diferenciación defendible no es inventar otro protocolo: es el flujo integrado
x402 2.21 + presupuesto de agente con reserva durable + MCP + recibos/finality,
con liquidación directa, onboarding generado y evidencia reproducible. No se
afirma exclusividad: las primitivas son abiertas, el middleware x402 oficial ya
existe y pay.sh continúa siendo un competidor directo relevante.

La ventaja todavía no está validada comercialmente. Dos paquetes públicos y una
prueba interna superior no sustituyen instalaciones independientes, uso repetido
o disposición a pagar. El próximo análisis competitivo debe incorporar fricción
observada en tres pilotos reales, no más funciones especulativas.
