"use client";

import { useCallback, useEffect, useState } from "react";
import { useConnect, useWallets, type UiWallet, type UiWalletAccount } from "@wallet-standard/react";
import { getWallets } from "@wallet-standard/app";
import type { Wallet, WalletAccount } from "@wallet-standard/base";
import {
  SolanaSignAndSendTransaction,
  SolanaSignMessage,
  type SolanaSignAndSendTransactionFeature,
  type SolanaSignMessageFeature,
} from "@solana/wallet-standard-features";
import { buildRevokeDelegationTransaction } from "@meterkit/subscriptions";
import bs58 from "bs58";

type Product = {
  id: string; name: string; description: string; resource: string;
  upstreamUrl?: string; priceAtomic: string; assetMint: string; payTo: string; network: string;
};
type Payment = {
  id: string; productId: string; amountAtomic: string; signature: string;
  settledAt: string; status: string; explorerUrl: string;
};

const gateway = process.env.NEXT_PUBLIC_GATEWAY_URL ?? "http://localhost:3402";
const usdcMint = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
const devnet = "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1";
const walletDevnet = "solana:devnet";
const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? "https://api.devnet.solana.com";

type ConnectedWallet = { wallet: Wallet; account: WalletAccount };

export function WalletButton({ onConnect, locale }: {
  onConnect: (connection: ConnectedWallet) => void;
  locale: "en" | "es";
}) {
  const wallets = useWallets();
  const [open, setOpen] = useState(false);
  if (!wallets.length) return <button className="wallet" disabled>
    {locale === "en" ? "Install a Solana wallet" : "Instala una wallet Solana"}
  </button>;
  return (
    <div className="walletMenu">
      <button className="wallet" onClick={() => setOpen((value) => !value)}>
        <span className="dot" /> {locale === "en" ? "Connect wallet" : "Conectar wallet"}
      </button>
      {open && <div className="walletOptions">
        {wallets.map((wallet) =>
          <WalletOption key={`${wallet.name}:${wallet.version}`} wallet={wallet} onAccount={(account) => {
            const rawWallet = getWallets().get().find((candidate) =>
              candidate.name === wallet.name && candidate.version === wallet.version);
            const rawAccount = rawWallet?.accounts.find((candidate) => candidate.address === account.address);
            if (rawWallet && rawAccount) onConnect({ wallet: rawWallet, account: rawAccount });
            setOpen(false);
          }} />)}
      </div>}
    </div>
  );
}

function WalletOption({ wallet, onAccount }: { wallet: UiWallet; onAccount: (account: UiWalletAccount) => void }) {
  const [connecting, connect] = useConnect(wallet);
  return <button disabled={connecting} onClick={async () => {
    const accounts = await connect();
    const solana = accounts.find((account) => account.chains.some((chain) => chain.startsWith("solana:")));
    if (solana) onAccount(solana);
  }}>{connecting ? "Conectando…" : wallet.name}</button>;
}

const dashboardCopy = {
  en: {
    connect: "Connect your wallet.", newProduct: "＋ New product",
    overview: "OVERVIEW · LIVE DATA", volume: "Settled volume", requests: "Paid requests",
    products: "Active products", receipts: "Unique receipts", persisted: "From PostgreSQL",
    config: "Persistent configuration", network: "Network", perRequest: "per request",
    createAnother: "Create another product", apiTool: "API, endpoint, or MCP tool",
    activity: "ONCHAIN ACTIVITY", recent: "Recent payments", refresh: "Refresh ↻",
    empty: "No settled payments yet.", payerControl: "PAYER CONTROL",
    revokeTitle: "Revoke an authorization.", revokeBody: "Your wallet signs a canonical program instruction. MeterKit never receives your key.",
  },
  es: {
    connect: "Conecta tu wallet.", newProduct: "＋ Nuevo producto",
    overview: "OVERVIEW · DATOS REALES", volume: "Volumen liquidado", requests: "Solicitudes pagadas",
    products: "Productos activos", receipts: "Recibos únicos", persisted: "Desde PostgreSQL",
    config: "Configuración persistente", network: "Red", perRequest: "por solicitud",
    createAnother: "Crea otro producto", apiTool: "API, endpoint o herramienta MCP",
    activity: "ACTIVIDAD ONCHAIN", recent: "Pagos recientes", refresh: "Actualizar ↻",
    empty: "Aún no hay pagos liquidados.", payerControl: "CONTROL DEL PAGADOR",
    revokeTitle: "Revoca una autorización.", revokeBody: "La wallet firma una instrucción del programa canónico. MeterKit nunca recibe tu clave.",
  },
} as const;

export function DashboardClient({ locale }: { locale: "en" | "es" }) {
  const text = dashboardCopy[locale];
  const [products, setProducts] = useState<Product[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [connection, setConnection] = useState<ConnectedWallet>();
  const [sessionToken, setSessionToken] = useState<string>();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string>();

  const refresh = useCallback(async () => {
    try {
      const path = sessionToken ? "/v1" : "/v1/public";
      const headers = sessionToken ? { authorization: `Bearer ${sessionToken}` } : undefined;
      const [productsResponse, paymentsResponse] = await Promise.all([
        fetch(`${gateway}${path}/products`, { headers }),
        fetch(`${gateway}${path}/payments`, { headers }),
      ]);
      if (!productsResponse.ok || !paymentsResponse.ok) throw new Error("Gateway no disponible");
      setProducts(await productsResponse.json() as Product[]);
      setPayments(await paymentsResponse.json() as Payment[]);
      setError(undefined);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo leer el gateway");
    }
  }, [sessionToken]);
  useEffect(() => { void refresh(); const timer = setInterval(() => void refresh(), 10_000); return () => clearInterval(timer); }, [refresh]);

  const volume = payments.reduce((sum, payment) => sum + BigInt(payment.amountAtomic), 0n);
  return (
    <>
      <section className="dashboard" id="products">
        <header>
          <div><span className="kicker">{text.overview}</span><h2>{connection ? short(connection.account.address) : text.connect}</h2></div>
          <div className="dashboardActions">
            <WalletButton locale={locale} onConnect={(connected) => {
              setConnection(connected);
              void authenticateWallet(connected).then(setSessionToken).catch((cause: unknown) => {
                setError(cause instanceof Error ? cause.message : "No se pudo autenticar la wallet");
              });
            }} />
            <button className="new" disabled={!connection} onClick={() => setCreating(true)}>{text.newProduct}</button>
          </div>
        </header>
        {error && <p className="errorBanner">{error}. Inicia `pnpm dev`.</p>}
        {creating && connection && <ProductForm locale={locale} connection={connection} onClose={() => setCreating(false)} onCreated={refresh} />}
        <div className="metrics">
          <article><span>{text.volume}</span><strong>{formatUsdc(volume)} USDC</strong><small>{text.persisted}</small></article>
          <article><span>{text.requests}</span><strong>{payments.length}</strong><small>{text.receipts}</small></article>
          <article><span>{text.products}</span><strong>{products.length}</strong><small>{text.config}</small></article>
          <article><span>{text.network}</span><strong className="network"><i /> Devnet</strong><small>USDC · SPL Token</small></article>
        </div>
        <div className="grid liveGrid">
          {products.map((product) => <article className="product" key={product.id}>
            <div className="productTop"><span className="weather">⌁</span><span className="live">● {locale === "en" ? "ACTIVE" : "ACTIVO"}</span></div>
            <h3>{product.name}</h3><p>{locale === "en" && product.id === "premium-weather"
              ? "Compact forecast with provenance and retrieval time"
              : product.description}</p>
            <div className="price"><strong>{formatUsdc(BigInt(product.priceAtomic))}</strong><span> USDC<br />{text.perRequest}</span></div>
            <code>GET {new URL(product.resource).pathname}</code>
            <div className="productFoot"><span>{short(product.payTo)}</span><a href={product.resource}>{locale === "en" ? "Try 402 →" : "Probar 402 →"}</a></div>
          </article>)}
          {connection && <button className="add" onClick={() => setCreating(true)}><span>＋</span><h3>{text.createAnother}</h3><p>{text.apiTool}</p></button>}
        </div>
      </section>
      <section className="transactions" id="payments">
        <div className="sectionHead"><div><span className="kicker">{text.activity}</span><h2>{text.recent}</h2></div><button onClick={() => void refresh()}>{text.refresh}</button></div>
        <div className="table">
          {!payments.length && <p className="empty">{text.empty}</p>}
          {payments.map((payment) => <div className="row" key={payment.id}>
            <span className="tx">↗</span><div><strong>{payment.productId}</strong><small>{new Date(payment.settledAt).toLocaleString("es")}</small></div>
            <code>{short(payment.signature)}</code><strong>{formatUsdc(BigInt(payment.amountAtomic))} USDC</strong>
            <span className="final">✓ {payment.status}</span><a href={payment.explorerUrl} target="_blank" rel="noreferrer">Explorer ↗</a>
          </div>)}
        </div>
      </section>
      <AllowancePanel connection={connection} locale={locale} />
    </>
  );
}

function AllowancePanel({ connection, locale }: { connection?: ConnectedWallet; locale: "en" | "es" }) {
  const text = dashboardCopy[locale];
  const [delegationAccount, setDelegationAccount] = useState("");
  const [status, setStatus] = useState(locale === "en" ? "Revoke allowance" : "Revocar allowance");
  const [signature, setSignature] = useState<string>();
  return <section className="allowances" id="allowances">
    <div>
      <span className="kicker">{text.payerControl}</span>
      <h2>{text.revokeTitle}</h2>
      <p>{text.revokeBody}</p>
    </div>
    <form onSubmit={async (event) => {
      event.preventDefault();
      if (!connection) { setStatus("Conecta tu wallet"); return; }
      if (!connection.account.chains.includes(walletDevnet)) {
        setStatus("Cambia la wallet a devnet");
        return;
      }
      const feature = connection.wallet.features[SolanaSignAndSendTransaction] as
        SolanaSignAndSendTransactionFeature[typeof SolanaSignAndSendTransaction] | undefined;
      if (!feature) { setStatus("Wallet sin envío de transacciones"); return; }
      setStatus("Preparando…");
      try {
        const response = await fetch(rpcUrl, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0", id: crypto.randomUUID(),
            method: "getLatestBlockhash", params: [{ commitment: "confirmed" }],
          }),
        });
        const body = await response.json() as {
          result?: { value?: { blockhash?: string; lastValidBlockHeight?: number } };
        };
        const latest = body.result?.value;
        if (!response.ok || !latest?.blockhash || latest.lastValidBlockHeight === undefined) {
          throw new Error("RPC no devolvió un blockhash");
        }
        const transaction = buildRevokeDelegationTransaction({
          ownerAddress: connection.account.address,
          delegationAccount,
          recentBlockhash: latest.blockhash,
          lastValidBlockHeight: BigInt(latest.lastValidBlockHeight),
        });
        const [result] = await feature.signAndSendTransaction({
          account: connection.account,
          transaction: new Uint8Array(transaction),
          chain: walletDevnet,
          options: { commitment: "confirmed", skipPreflight: false, maxRetries: 3 },
        });
        if (!result) throw new Error("La wallet no devolvió firma");
        const encoded = bs58.encode(result.signature);
        setSignature(encoded);
        setStatus("Revocada ✓");
      } catch (cause) {
        setStatus(cause instanceof Error ? cause.message : "No se pudo revocar");
      }
    }}>
      <label>{locale === "en" ? "Delegation account" : "Cuenta de delegación"}
        <input
          required
          minLength={32}
          maxLength={44}
          value={delegationAccount}
          onChange={(event) => setDelegationAccount(event.target.value)}
          placeholder={locale === "en" ? "Delegation account address" : "Dirección del delegation account"}
        />
      </label>
      <button type="submit">{status}</button>
      {signature && <a
        href={`https://explorer.solana.com/tx/${encodeURIComponent(signature)}?cluster=devnet`}
        target="_blank"
        rel="noreferrer"
      >Abrir revocación en Explorer ↗</a>}
    </form>
  </section>;
}

function ProductForm({ connection, onClose, onCreated, locale }: {
  connection: ConnectedWallet;
  onClose: () => void;
  onCreated: () => Promise<void>;
  locale: "en" | "es";
}) {
  const [status, setStatus] = useState(locale === "en" ? "Create" : "Crear");
  return <form className="productForm" onSubmit={async (event) => {
    event.preventDefault(); setStatus("Guardando…");
    const data = new FormData(event.currentTarget);
    const id = String(data.get("id"));
    const feature = connection.wallet.features[SolanaSignMessage] as
      SolanaSignMessageFeature[typeof SolanaSignMessage] | undefined;
    if (!feature) { setStatus("Wallet sin firma de mensajes"); return; }
    const product = {
      id, name: data.get("name"), description: data.get("description"),
      resource: `${gateway}/v1/products/${encodeURIComponent(id)}/proxy`,
      upstreamUrl: data.get("upstreamUrl"),
      priceAtomic: String(Math.round(Number(data.get("price")) * 1_000_000)),
      assetMint: usdcMint, payTo: connection.account.address, network: devnet,
    };
    const idempotencyKey = crypto.randomUUID();
    const challengeResponse = await fetch(`${gateway}/v1/auth/challenge`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({
        wallet: connection.account.address,
        product,
        idempotencyKey,
      }),
    });
    if (!challengeResponse.ok) { setStatus("No se pudo autorizar"); return; }
    const challenge = await challengeResponse.json() as { nonce: string; message: string };
    const [signed] = await feature.signMessage({
      account: connection.account,
      message: new TextEncoder().encode(challenge.message),
    });
    if (!signed) { setStatus("Firma cancelada"); return; }
    const response = await fetch(`${gateway}/v1/products`, {
      method: "POST", headers: {
        "content-type": "application/json",
        "Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify({
        product,
        auth: {
          nonce: challenge.nonce,
          signedMessage: bytesToBase64(signed.signedMessage),
          signature: bytesToBase64(signed.signature),
        },
      }),
    });
    if (!response.ok) { setStatus(`Error ${response.status}`); return; }
    await onCreated(); onClose();
  }}>
    <input name="id" required pattern="[a-z0-9-]+" placeholder="premium-weather" />
    <input name="name" required minLength={3} placeholder="Premium Weather API" />
    <input name="description" required placeholder="Qué obtiene el cliente" />
    <input
      name="upstreamUrl"
      required
      type="url"
      defaultValue="https://api.open-meteo.com/v1/forecast?latitude=-34.6037&longitude=-58.3816&current=temperature_2m"
      placeholder="https://api.example.com/data"
    />
    <input name="price" required type="number" min="0.000001" step="0.000001" defaultValue="0.01" />
    <button type="submit">{status}</button><button type="button" onClick={onClose}>Cancelar</button>
  </form>;
}

function formatUsdc(atomic: bigint) {
  const whole = atomic / 1_000_000n;
  const fractional = String(atomic % 1_000_000n).padStart(6, "0").replace(/0+$/, "");
  return fractional ? `${whole},${fractional}` : String(whole);
}
function short(value: string) { return value.length > 12 ? `${value.slice(0, 5)}…${value.slice(-4)}` : value; }
function bytesToBase64(value: Uint8Array) {
  let binary = "";
  for (const byte of value) binary += String.fromCharCode(byte);
  return btoa(binary);
}

async function authenticateWallet(connection: ConnectedWallet) {
  const feature = connection.wallet.features[SolanaSignMessage] as
    SolanaSignMessageFeature[typeof SolanaSignMessage] | undefined;
  if (!feature) throw new Error("La wallet no soporta firma de mensajes");
  const challengeResponse = await fetch(`${gateway}/v1/auth/session/challenge`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ wallet: connection.account.address }),
  });
  if (!challengeResponse.ok) throw new Error("No se pudo crear la sesión");
  const challenge = await challengeResponse.json() as { nonce: string; message: string };
  const [signed] = await feature.signMessage({
    account: connection.account,
    message: new TextEncoder().encode(challenge.message),
  });
  if (!signed) throw new Error("Firma de sesión cancelada");
  const sessionResponse = await fetch(`${gateway}/v1/auth/session`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      wallet: connection.account.address,
      auth: {
        nonce: challenge.nonce,
        signedMessage: bytesToBase64(signed.signedMessage),
        signature: bytesToBase64(signed.signature),
      },
    }),
  });
  if (!sessionResponse.ok) throw new Error("La firma de sesión fue rechazada");
  const session = await sessionResponse.json() as { token: string };
  return session.token;
}
