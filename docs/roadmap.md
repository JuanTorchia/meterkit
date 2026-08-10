# Backlog y roadmap de MeterKit

> Estado 2026-08-10: completados `protect()`, ejemplo Next.js, recibos/eventos,
> CLI de activación y adaptador Webacy probado. Próximo gate: publicar paquetes
> versionados y obtener tres integraciones externas consentidas; agentes
> sintéticos y dogfooding no cuentan como pilotos.

MeterKit se construye en dos velocidades:

1. un compromiso inmediato, acotado y verificable para el Agentic Engineering Grant;
2. una apuesta de producto de seis meses, condicionada por uso externo real.

La ambición no se medirá por cantidad de funciones. Se medirá por integraciones
independientes, pagos verificables, tiempo de integración, confiabilidad y clientes
dispuestos a pagar. No se contabilizan wallets internas, agentes sintéticos ni
transacciones del equipo como adopción externa.

## Hardening previo a pilotos — 2026-08-05

- [x] Cerrar escape de ruta del cliente agente.
- [x] Persistir y consumir challenges entre réplicas.
- [x] Evitar falsos fallos de finality y permitir RPC secundario.
- [x] Canonizar slugs de producto.
- [x] Crear/listar/revocar allowances desde el dashboard.
- [x] Fijar Actions e imágenes y añadir CodeQL, SBOM y Trivy.
- [x] Añadir `pnpm evidence:grant`.
- [x] Migrar namespace global a UUID + slug por owner antes de alta pública abierta.
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

## Horizonte 1 — cierre del grant (hasta 2026-08-31)

### Objetivo

Convertir el MVP técnicamente probado en una herramienta que tres desarrolladores
independientes puedan evaluar sin asistencia constante.

### Entregables

- Publicar `@usemeterkit/sdk` y `@usemeterkit/core` con versiones reproducibles
  (empaquetado y trusted-publishing implementados; publicación npm pendiente).
- [x] Incorporar UUID interno y namespace `owner/slug` antes del alta pública abierta.
- [x] Crear un quickstart que llegue al primer HTTP 402 en menos de 10 minutos.
- Integrar MeterKit en la aplicación privada que originó la necesidad, utilizando
  exclusivamente la interfaz pública del SDK y sin atajos internos.
- Ejecutar tres pilotos externos con wallets distintas.
- Registrar fricción de instalación, errores y tiempo hasta el primer pago.
- Completar el cobro periódico mensual sólo si las primitivas oficiales vigentes
  permiten una implementación segura y revocable.
- Publicar el video de 90 segundos y un caso de uso técnico reproducible.

### Métricas de salida

- 1 integración interna completa utilizada como dogfooding, reportada por separado.
- 3 wallets externas completan el recorrido x402 en devnet.
- 2 desarrolladores integran el middleware en un servicio propio o ejemplo
  independiente.
- Mediana de tiempo hasta el primer 402 menor a 15 minutos.
- 100% de replays observados rechazados.
- 0 fallos críticos de aislamiento entre tenants.

### Condición de avance

No abrir mainnet ni cobrar comisión hasta completar una revisión de seguridad
independiente y validar que al menos un piloto desea continuar usando MeterKit.

## Horizonte 2 — producto validado (septiembre–octubre de 2026)

### Objetivo

Pasar de una demo alojada a una capa de monetización que pueda operar un proveedor
real sin que MeterKit custodie fondos.

### Producto

- Gateway alojado multi-tenant con aislamiento, cuotas y auditoría.
- SDK Node estable y adaptadores de referencia para Next.js, Express y MCP.
- Webhooks firmados, exportación de recibos y reconciliación automática.
- Analítica por producto, endpoint, wallet y estado de liquidación.
- Gestión completa de allowances y suscripciones revocables.
- Política de fees transparente: transferencia adicional explícita o suscripción
  SaaS separada; nunca deducción opaca.
- Observabilidad operativa, runbooks, backups y objetivos de servicio iniciales.
- Entorno sandbox/devnet permanente y procedimiento documentado de promoción.

### Go-to-market

- Entrevistar 20 creadores de APIs, MCP y herramientas de IA.
- Ejecutar 8–10 pilotos, priorizando Latinoamérica y equipos Solana.
- Convertir al menos 2 pilotos en integraciones pagadas.
- Publicar 2 casos de estudio con permiso verificable.
- Preparar aplicaciones a Argentina Grant, Solana Foundation y Colosseum usando
  únicamente métricas reales.

### Métricas objetivo

- 10 integraciones externas acumuladas.
- 5 proveedores con al menos una transacción válida.
- 2 clientes de integración o hosted dispuestos a pagar.
- Primer ingreso objetivo: USD 1.500–3.000 por implementación y soporte.
- Disponibilidad mensual observada ≥99,5% en el entorno alojado.
- Menos de 1% de liquidaciones en estado `unknown` por más de 15 minutos.

## Horizonte 3 — infraestructura sostenible (noviembre de 2026–enero de 2027)

### Objetivo

Demostrar que MeterKit puede ser una pieza de infraestructura open source con un
servicio comercial sostenible, no sólo un proyecto de hackathon.

### Plataforma

- Especificación pública y versionada del recibo MeterKit.
- Compatibilidad probada con múltiples facilitadores x402 cuando sea viable.
- Clientes adicionales definidos por demanda real; no mantener SDKs sin usuarios.
- Reconciliación multi-RPC y herramientas de recuperación operativa.
- Panel de consumo y límites para agentes con políticas firmadas y auditables.
- Despliegue self-hosted endurecido y opción dedicada para empresas.
- Auditoría de seguridad externa antes de ampliar exposición o habilitar mainnet.

### Ecosistema y reputación técnica

- Publicar decisiones de arquitectura, threat model y resultados de auditoría.
- Contribuir correcciones o documentación upstream a x402/Solana cuando aparezcan
  problemas reproducibles.
- Presentar una charla o workshop técnico con un recorrido devnet completo.
- Mantener ejemplos útiles y no financieros que demuestren pagos entre agentes.
- Buscar entre 3 y 5 contribuidores externos y al menos 2 integraciones comunitarias.

### Métricas objetivo

- 25 proveedores registrados y 10 activos mensuales.
- 3 clientes pagos acumulados.
- USD 2.000 de MRR o USD 10.000 acumulados en integraciones; cualquiera de los dos
  valida continuidad comercial inicial.
- 1.000 liquidaciones válidas acumuladas sin custodia.
- 99,9% de rechazo de replay medido y cero pérdida de fondos atribuible a MeterKit.
- 30% de instalaciones nuevas completan el quickstart.

## Modelo operativo

### Cadencia semanal

- Lunes: métricas, incidentes y selección de un problema prioritario.
- Martes a jueves: implementación, revisión y contacto con pilotos.
- Viernes: release pequeño, evidencia reproducible y actualización pública.
- Cada dos semanas: entrevista de usuario y revisión de seguridad.
- Cada mes: decisión continuar, recortar o pivotar basada en métricas.

### Distribución inicial del tiempo

| Área                           | Dedicación |
| ------------------------------ | ---------: |
| Producto e ingeniería          |        45% |
| Seguridad, pruebas y operación |        20% |
| Pilotos y entrevistas          |        20% |
| Documentación y ecosistema     |        10% |
| Grants y administración        |         5% |

Los grants financian ejecución, pero no sustituyen clientes ni adopción.

## Puertas de decisión

### Continuar con el enfoque actual

Se cumple si, antes de finalizar octubre, existen al menos cinco integraciones
externas y dos equipos expresan una disposición concreta a pagar.

### Pivotar el segmento

Se evalúa si los desarrolladores completan pagos pero no necesitan un dashboard
alojado. En ese caso, priorizar SDK, infraestructura self-hosted y servicios de
integración.

### Recortar o detener

Se aplica si después de 20 entrevistas y 10 pilotos no hay uso repetido ni
disposición a pagar. La tecnología y el aprendizaje se conservan como portfolio,
pero no se continúa agregando funciones sin demanda.

## Riesgos estratégicos

- x402 y las primitivas de suscripción todavía pueden cambiar: encapsularlas detrás
  de adaptadores y fijar versiones verificadas.
- El test-USDC no valida intención de pago: separar claramente evidencia técnica de
  validación comercial.
- Un producto de pagos exige confianza: privilegiar no custodia, transparencia,
  auditoría y simplicidad por encima de velocidad de expansión.
- El mercado puede preferir infraestructura invisible: validar antes de invertir
  fuertemente en un dashboard SaaS.
- Las comisiones por transacción pueden generar fricción: probar primero ingresos
  por integración y plan alojado.
