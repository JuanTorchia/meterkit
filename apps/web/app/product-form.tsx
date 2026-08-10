"use client";

import { useState } from "react";
import {
  SolanaSignMessage,
  type SolanaSignMessageFeature,
} from "@solana/wallet-standard-features";
import type { Wallet, WalletAccount } from "@wallet-standard/base";
import type { Locale } from "./locale";

const gateway = process.env.NEXT_PUBLIC_GATEWAY_URL ?? "http://localhost:3402";
const usdcMint = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
const devnet = "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1";
type ConnectedWallet = { wallet: Wallet; account: WalletAccount };

export function ProductForm({
  connection,
  onClose,
  onCreated,
  locale,
}: {
  connection: ConnectedWallet;
  onClose: () => void;
  onCreated: () => Promise<void>;
  locale: Locale;
}) {
  const [status, setStatus] = useState(
    locale === "en" ? "Create" : locale === "es" ? "Crear" : "Criar",
  );
  const [pending, setPending] = useState(false);
  const labels =
    locale === "en"
      ? {
          id: "Product ID",
          name: "Product name",
          description: "Customer result",
          upstream: "Protected upstream URL",
          price: "Price in USDC",
        }
      : locale === "es"
        ? {
            id: "ID del producto",
            name: "Nombre",
            description: "Resultado para el cliente",
            upstream: "URL protegida de origen",
            price: "Precio en USDC",
          }
        : {
            id: "ID do produto",
            name: "Nome",
            description: "Resultado para o cliente",
            upstream: "URL de origem protegida",
            price: "Preço em USDC",
          };

  return (
    <form
      className="productForm"
      onSubmit={async (event) => {
        event.preventDefault();
        if (pending) return;
        setPending(true);
        setStatus(
          locale === "en"
            ? "Saving…"
            : locale === "es"
              ? "Guardando…"
              : "Salvando…",
        );
        try {
          const data = new FormData(event.currentTarget);
          const id = String(data.get("id"));
          const feature = connection.wallet.features[SolanaSignMessage] as
            SolanaSignMessageFeature[typeof SolanaSignMessage] | undefined;
          if (!feature)
            throw new Error(
              locale === "en"
                ? "Wallet cannot sign messages"
                : locale === "es"
                  ? "Wallet sin firma de mensajes"
                  : "A carteira não assina mensagens",
            );
          const product = {
            id,
            name: data.get("name"),
            description: data.get("description"),
            resource: `${gateway}/v1/products/${encodeURIComponent(connection.account.address)}/${encodeURIComponent(id)}/proxy`,
            upstreamUrl: data.get("upstreamUrl"),
            priceAtomic: String(
              Math.round(Number(data.get("price")) * 1_000_000),
            ),
            assetMint: usdcMint,
            payTo: connection.account.address,
            network: devnet,
          };
          const idempotencyKey = crypto.randomUUID();
          const challengeResponse = await fetch(
            `${gateway}/v1/auth/challenge`,
            {
              method: "POST",
              headers: { "content-type": "application/json" },
              signal: AbortSignal.timeout(15_000),
              body: JSON.stringify({
                wallet: connection.account.address,
                product,
                idempotencyKey,
              }),
            },
          );
          if (!challengeResponse.ok)
            throw new Error(
              locale === "en"
                ? "Authorization failed"
                : locale === "es"
                  ? "No se pudo autorizar"
                  : "Não foi possível autorizar",
            );
          const challenge = (await challengeResponse.json()) as {
            nonce: string;
            message: string;
          };
          const [signed] = await feature.signMessage({
            account: connection.account,
            message: new TextEncoder().encode(challenge.message),
          });
          if (!signed)
            throw new Error(
              locale === "en"
                ? "Signature cancelled"
                : locale === "es"
                  ? "Firma cancelada"
                  : "Assinatura cancelada",
            );
          const response = await fetch(`${gateway}/v1/products`, {
            method: "POST",
            headers: {
              "content-type": "application/json",
              "Idempotency-Key": idempotencyKey,
            },
            signal: AbortSignal.timeout(15_000),
            body: JSON.stringify({
              product,
              auth: {
                nonce: challenge.nonce,
                signedMessage: bytesToBase64(signed.signedMessage),
                signature: bytesToBase64(signed.signature),
              },
            }),
          });
          if (!response.ok) throw new Error(`Error ${response.status}`);
          await onCreated();
          onClose();
        } catch (cause) {
          setStatus(
            cause instanceof Error
              ? cause.message
              : locale === "en"
                ? "Could not create product"
                : locale === "es"
                  ? "No se pudo crear el producto"
                  : "Não foi possível criar o produto",
          );
        } finally {
          setPending(false);
        }
      }}
    >
      <label>
        <span>{labels.id}</span>
        <input
          name="id"
          disabled={pending}
          required
          pattern="[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?"
          placeholder="premium-weather"
        />
      </label>
      <label>
        <span>{labels.name}</span>
        <input
          name="name"
          disabled={pending}
          required
          minLength={3}
          placeholder="Premium Weather API"
        />
      </label>
      <label>
        <span>{labels.description}</span>
        <input
          name="description"
          disabled={pending}
          required
          placeholder={
            locale === "en"
              ? "What the customer receives"
              : locale === "es"
                ? "Qué obtiene el cliente"
                : "O que o cliente recebe"
          }
        />
      </label>
      <label>
        <span>{labels.upstream}</span>
        <input
          name="upstreamUrl"
          disabled={pending}
          required
          type="url"
          defaultValue="https://api.open-meteo.com/v1/forecast?latitude=-34.6037&longitude=-58.3816&current=temperature_2m"
          placeholder="https://api.example.com/data"
        />
      </label>
      <label>
        <span>{labels.price}</span>
        <input
          name="price"
          disabled={pending}
          required
          type="number"
          min="0.000001"
          step="0.000001"
          defaultValue="0.01"
        />
      </label>
      <button type="submit" disabled={pending} aria-busy={pending}>
        {status}
      </button>
      <button type="button" disabled={pending} onClick={onClose}>
        {locale === "en" ? "Cancel" : "Cancelar"}
      </button>
    </form>
  );
}

function bytesToBase64(value: Uint8Array) {
  let binary = "";
  value.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}
