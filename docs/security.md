# Modelo de amenazas

> Sincronizado 2026-08-10: los recibos públicos están acotados y versionados;
> PostgreSQL impide regresiones terminales y conflictos concurrentes. Webacy
> recibe únicamente la dirección pública del payer mediante HTTPS oficial, con
> timeout, límite de bytes, credencial server-side y fail-mode explícito.

## Activos y límites de confianza

MeterKit nunca custodia USDC, seed phrases ni claves privadas. Los activos son: autorizaciones firmadas, configuración de producto, recibos, disponibilidad del gateway y wallet patrocinadora si se activa Kora. Los límites son navegador/wallet, gateway, facilitador, RPC, PostgreSQL y programa de subscriptions.

## Amenazas y controles

| Amenaza                                      | Control                                                                                                                               | Prueba                                |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| Reutilizar pago                              | firma única y almacenamiento atómico; conflicto 409                                                                                   | `sdk.test.ts`                         |
| Monto insuficiente                           | requisitos exactos y delta onchain exacto antes de servir                                                                             | test RPC de monto                     |
| Mint o receptor falsos                       | balances pre/post RPC deben coincidir con mint y owner configurados                                                                   | tests RPC mint/receptor               |
| Red equivocada                               | sólo CAIP-2 devnet en MVP; mainnet no se acepta                                                                                       | test de red                           |
| Autorización expirada                        | `maxTimeoutSeconds=300`; facilitador simula y valida bloquehash                                                                       | test expiración                       |
| Doble ejecución concurrente                  | constraint único en DB y operación transaccional                                                                                      | carrera real PostgreSQL               |
| Repetición de alta HTTP                      | `Idempotency-Key`, hash del request y respuesta persistida                                                                            | integración DB                        |
| Alta con wallet ajena o firma reutilizada    | challenge Ed25519 ligado a dominio, método, ruta, hash del producto e idempotency key; nonce de un solo uso y expiración de 5 minutos | `wallet-auth.test.ts`                 |
| Recibo MCP reutilizado tras reinicio         | validación RPC independiente y claim atómico persistente por hash SHA-256                                                             | `receipt-guard.test.ts`               |
| Transacción confirmada caída                 | sólo un error onchain explícito pasa a `failed`; ausencia RPC queda recuperable y existe fallback opcional                            | `finality.test.ts`                    |
| Logs sensibles                               | nunca registrar payload, firma completa, header ni variables secretas                                                                 | revisión                              |
| Abuso de endpoint                            | límite por IP, body 32 KiB, validación Zod                                                                                            | integración                           |
| Facilitador comprometido                     | revalidar transacción, error y balances token por RPC antes del handler                                                               | tests SDK                             |
| Allowance excesiva                           | monto máximo, vencimiento obligatorio, copy de riesgo y revocación                                                                    | unitario                              |
| Revocación en red equivocada                 | UI exige `solana:devnet`, blockhash RPC devnet y no acepta fallback mainnet                                                           | builder/UI                            |
| Autorización retenida                        | bloquehash reciente; no usar durable nonce por defecto; cancelar propuestas                                                           | procedimiento                         |
| Lectura entre tenants                        | sesión firmada, token hasheado, expiración y consultas SQL por `owner_wallet`                                                         | integración PostgreSQL                |
| Colisión de producto entre tenants           | UUID interno, unicidad `(owner_wallet, slug)` y rechazo de rutas legacy ambiguas                                                      | integración PostgreSQL y tests SDK    |
| SSRF desde un producto                       | HTTPS, allowlist exacta, sin IP/puerto/credenciales/redirects, JSON y límite 1 MB                                                     | `upstream.test.ts`                    |
| SSRF desde el verificador de pilotos         | sólo HTTPS público; bloqueo de IP literal y DNS privado/link-local/reservado; sin redirects; localhost sólo con opt-in explícito      | `packages/pilot/src/index.test.ts`    |
| Challenge perdido/reutilizado entre réplicas | hash en PostgreSQL, consumo atómico, expiración, máximo por wallet y limpieza horaria                                                 | `wallet-auth.test.ts`, integración DB |
| Escape del scope del agente                  | origen/puerto/ruta normalizados; exact match por defecto y subrutas sólo con frontera explícita                                       | `examples/client/src/index.test.ts`   |

## Particularidades de Subscriptions

El repositorio oficial advierte que una transacción firmada con durable nonce puede conservar vigencia y que revocar sólo el delegate del ATA no termina una suscripción. MeterKit usa las instrucciones específicas `revokeDelegation`, `cancelSubscription` o `revokeSubscriptionAuthority`; no deja transacciones de control firmadas sin enviar. El estado “active” tampoco demuestra fondos disponibles: el servicio debe comprobar cobro por período antes de conceder acceso.

El dashboard deriva la cuenta de delegación mediante el SDK oficial, serializa
creación o revocación localmente y la entrega a Wallet Standard con
`signAndSendTransaction`. La clave privada no sale de la wallet. PostgreSQL
indexa únicamente metadata, estado y recibo.

## Operación

- Devnet y mainnet tienen despliegues, variables y bases separados.
- Mainnet está deshabilitado hasta una autorización explícita y revisión.
- Los secretos sólo viven en variables de entorno/secret manager.
- Confirmación mínima `confirmed`; para marcar `finalized`, consultar RPC. Un
  error onchain explícito se marca `failed`; una firma ausente nunca se convierte
  en fallo y puede recuperarse mediante un RPC secundario.
- Alertar por errores de settlement, replay y discrepancias del indexador.
- Rotar credenciales del facilitador sin afectar wallets de usuarios.

## Riesgos abiertos del MVP

- La finalidad depende de la disponibilidad y honestidad de los RPC configurados;
  para alta disponibilidad real deben operarse proveedores independientes.
- El modo sin `DATABASE_URL` mantiene challenges en memoria únicamente para
  desarrollo. El servicio alojado usa PostgreSQL y funciona con múltiples réplicas.
- La ejecución real se verificó con wallets desechables y fondos exclusivamente devnet; no se incluyen claves.
- El proveedor debe tener un ATA del mint USDC antes del primer cobro. Su creación es pública y no requiere la clave del proveedor, pero sí SOL devnet del fee payer.
- El precheck DNS del CLI y la conexión HTTPS son operaciones separadas. HTTPS
  reduce los objetivos prácticos de DNS rebinding, pero el transporte todavía no
  fija la IP validada. El CLI beta debe usarse sólo con endpoints elegidos por el
  desarrollador y nunca con URLs provenientes de PRs o configuración no confiable.

## Retención

- Challenges, sesiones e idempotency keys vencidos se eliminan cada hora.
- Los challenges se consumen mediante `DELETE ... RETURNING`.
- Pagos y recibos no se borran automáticamente porque son evidencia del proveedor.
- Allowances revocadas conservan metadata y recibo, nunca claves privadas.

## Publicación de paquetes

Los paquetes se verifican desde un tag que coincide con sus manifests y se
publican mediante GitHub OIDC con provenance. El workflow no contiene tokens npm.
La publicación exige configurar previamente el trusted publisher del scope; un
tarball local o un workflow verde no se presenta como publicación confirmada.
