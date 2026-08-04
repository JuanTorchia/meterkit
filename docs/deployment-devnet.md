# Despliegue público exclusivamente en devnet

Este runbook prepara una demo pública; no habilita mainnet ni necesita claves
privadas. El gateway, el dashboard y PostgreSQL son servicios separados.

## Invariantes

- `METERKIT_NETWORK` debe ser exactamente `solana-devnet`.
- `PUBLIC_GATEWAY_URL` debe ser HTTPS fuera de localhost.
- `MERCHANT_WALLET` contiene sólo la dirección pública del proveedor.
- Ningún servicio recibe seed phrase, keypair o `SOLANA_PRIVATE_KEY`.
- El cliente firma y paga desde su propia wallet.
- El gateway recibe el puerto inyectado por el hosting mediante `PORT`.

## Gateway

Construir desde la raíz con `Dockerfile.gateway`.

Variables:

```text
METERKIT_NETWORK=solana-devnet
PUBLIC_GATEWAY_URL=https://<gateway-publico>
TRUST_PROXY_HOPS=1
CORS_ORIGINS=https://<dashboard-publico>
DATABASE_URL=<postgresql-administrado>
MERCHANT_WALLET=<wallet-publica-proveedor>
USDC_MINT=4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
SOLANA_RPC_URL=https://api.devnet.solana.com
X402_FACILITATOR_URL=https://x402.org/facilitator
RATE_LIMIT_PER_MINUTE=60
FINALITY_POLL_MS=15000
```

El hosting inyecta `PORT`; no fijarlo salvo que la plataforma lo requiera.
`TRUST_PROXY_HOPS=1` presupone exactamente un reverse proxy administrado entre
Internet y Express; ajustar sólo después de verificar la topología del hosting.
Health check: `GET /health`.

## Dashboard

Construir desde la raíz con `Dockerfile.web`. Estas dos variables son argumentos
de build porque Next.js incorpora `NEXT_PUBLIC_*` en el bundle:

```text
NEXT_PUBLIC_GATEWAY_URL=https://<gateway-publico>
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
```

El proceso usa el `PORT` inyectado por el hosting.

## Orden de puesta en marcha

1. Crear PostgreSQL sin exposición pública innecesaria.
2. Desplegar el gateway con una URL temporal.
3. Verificar `/health`, `/v1/public/products`, `/v1/public/payments` y el challenge 402.
4. Desplegar el dashboard apuntando al gateway.
5. Restringir `CORS_ORIGINS` a la URL final del dashboard.
6. Revalidar health, CORS, challenge, pago, recibo y replay.
7. Registrar la evidencia en `docs/audit.md`.

## Criterio de rollback

Desactivar el gateway si acepta una red distinta de devnet, publica un
destinatario o mint inesperado, devuelve contenido protegido sin liquidación,
permite reutilizar una firma o pierde persistencia. No cambiar a mainnet como
forma de diagnosticar un problema de devnet.
