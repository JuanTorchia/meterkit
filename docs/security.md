# Modelo de amenazas

## Activos y límites de confianza

MeterKit nunca custodia USDC, seed phrases ni claves privadas. Los activos son: autorizaciones firmadas, configuración de producto, recibos, disponibilidad del gateway y wallet patrocinadora si se activa Kora. Los límites son navegador/wallet, gateway, facilitador, RPC, PostgreSQL y programa de subscriptions.

## Amenazas y controles

| Amenaza | Control | Prueba |
|---|---|---|
| Reutilizar pago | firma única y almacenamiento atómico; conflicto 409 | `sdk.test.ts` |
| Monto insuficiente | requisitos exactos y delta onchain exacto antes de servir | test RPC de monto |
| Mint o receptor falsos | balances pre/post RPC deben coincidir con mint y owner configurados | tests RPC mint/receptor |
| Red equivocada | sólo CAIP-2 devnet en MVP; mainnet no se acepta | test de red |
| Autorización expirada | `maxTimeoutSeconds=300`; facilitador simula y valida bloquehash | test expiración |
| Doble ejecución concurrente | constraint único en DB y operación transaccional | carrera real PostgreSQL |
| Repetición de alta HTTP | `Idempotency-Key`, hash del request y respuesta persistida | integración DB |
| Alta con wallet ajena | challenge Ed25519, nonce de un solo uso y expiración de 5 minutos | `wallet-auth.test.ts` |
| Logs sensibles | nunca registrar payload, firma completa, header ni variables secretas | revisión |
| Abuso de endpoint | límite por IP, body 32 KiB, validación Zod | integración |
| Facilitador comprometido | revalidar transacción, error y balances token por RPC antes del handler | tests SDK |
| Allowance excesiva | monto máximo, vencimiento obligatorio, copy de riesgo y revocación | unitario |
| Revocación en red equivocada | UI exige `solana:devnet`, blockhash RPC devnet y no acepta fallback mainnet | builder/UI |
| Autorización retenida | bloquehash reciente; no usar durable nonce por defecto; cancelar propuestas | procedimiento |

## Particularidades de Subscriptions

El repositorio oficial advierte que una transacción firmada con durable nonce puede conservar vigencia y que revocar sólo el delegate del ATA no termina una suscripción. MeterKit usa las instrucciones específicas `revokeDelegation`, `cancelSubscription` o `revokeSubscriptionAuthority`; no deja transacciones de control firmadas sin enviar. El estado “active” tampoco demuestra fondos disponibles: el servicio debe comprobar cobro por período antes de conceder acceso.

El dashboard serializa la revocación localmente y la entrega a Wallet Standard con `signAndSendTransaction`. La clave privada no sale de la wallet. El formulario avanzado solicita la cuenta de delegación concreta para evitar búsquedas ambiguas; una dirección inválida falla antes de solicitar firma.

## Operación

- Devnet y mainnet tienen despliegues, variables y bases separados.
- Mainnet está deshabilitado hasta una autorización explícita y revisión.
- Los secretos sólo viven en variables de entorno/secret manager.
- Confirmación mínima `confirmed`; para marcar `finalized`, consultar RPC con ese commitment.
- Alertar por errores de settlement, replay y discrepancias del indexador.
- Rotar credenciales del facilitador sin afectar wallets de usuarios.

## Riesgos abiertos del MVP

- La finalidad depende de la disponibilidad y honestidad del RPC configurado; para alta disponibilidad se deben comparar proveedores.
- Los challenges de autenticación de wallet viven en memoria. Son seguros para una réplica, pero el servicio alojado debe moverlos a Redis/PostgreSQL.
- La ejecución real se verificó con wallets desechables y fondos exclusivamente devnet; no se incluyen claves.
- El proveedor debe tener un ATA del mint USDC antes del primer cobro. Su creación es pública y no requiere la clave del proveedor, pero sí SOL devnet del fee payer.
