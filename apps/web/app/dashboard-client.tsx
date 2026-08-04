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
import { dateLocales, type Locale } from "./locale";

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

export type ConnectedWallet = { wallet: Wallet; account: WalletAccount };

export function WalletButton({ onConnect, locale }: {
  onConnect: (connection: ConnectedWallet) => void;
  locale: Locale;
}) {
  const wallets = useWallets();
  const [open, setOpen] = useState(false);
  if (!wallets.length) return <button className="wallet" disabled>
    {locale === "en" ? "Install a Solana wallet" : locale === "es" ? "Instala una wallet Solana" : "Instale uma carteira Solana"}
  </button>;
  return (
    <div className="walletMenu">
      <button className="wallet" onClick={() => setOpen((value) => !value)}>
        <span className="dot" /> {locale === "en" ? "Connect wallet" : locale === "es" ? "Conectar wallet" : "Conectar carteira"}
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
  }}>{connecting ? "…" : wallet.name}</button>;
}

const dashboardCopy = {
  en: {
    connect: "Connect your wallet.", newProduct: "＋ New product",
    overview: "OVERVIEW · PUBLIC DEVNET DATA", volume: "Settled volume", requests: "Paid requests",
    products: "Active products", receipts: "Unique receipts", persisted: "From PostgreSQL",
    config: "Persistent configuration", network: "Network", perRequest: "per request",
    createAnother: "Create another product", apiTool: "API, endpoint, or MCP tool",
    activity: "ONCHAIN ACTIVITY", recent: "Recent payments", refresh: "Refresh ↻",
    empty: "No settled payments yet.", payerControl: "PAYER CONTROL",
    revokeTitle: "Revoke an authorization.", revokeBody: "Your wallet signs a canonical program instruction. MeterKit never receives your key.",
  },
  es: {
    connect: "Conecta tu wallet.", newProduct: "＋ Nuevo producto",
    overview: "OVERVIEW · DATOS PÚBLICOS DE DEVNET", volume: "Volumen liquidado", requests: "Solicitudes pagadas",
    products: "Productos activos", receipts: "Recibos únicos", persisted: "Desde PostgreSQL",
    config: "Configuración persistente", network: "Red", perRequest: "por solicitud",
    createAnother: "Crea otro producto", apiTool: "API, endpoint o herramienta MCP",
    activity: "ACTIVIDAD ONCHAIN", recent: "Pagos recientes", refresh: "Actualizar ↻",
    empty: "Aún no hay pagos liquidados.", payerControl: "CONTROL DEL PAGADOR",
    revokeTitle: "Revoca una autorización.", revokeBody: "La wallet firma una instrucción del programa canónico. MeterKit nunca recibe tu clave.",
  },
  "pt-BR": {
    connect: "Conecte sua carteira.", newProduct: "＋ Novo produto",
    overview: "VISÃO GERAL · DADOS PÚBLICOS DA DEVNET", volume: "Volume liquidado", requests: "Requisições pagas",
    products: "Produtos ativos", receipts: "Recibos únicos", persisted: "Do PostgreSQL",
    config: "Configuração persistente", network: "Rede", perRequest: "por requisição",
    createAnother: "Crie outro produto", apiTool: "API, endpoint ou ferramenta MCP",
    activity: "ATIVIDADE ONCHAIN", recent: "Pagamentos recentes", refresh: "Atualizar ↻",
    empty: "Ainda não há pagamentos liquidados.", payerControl: "CONTROLE DO PAGADOR",
    revokeTitle: "Revogue uma autorização.", revokeBody: "Sua carteira assina uma instrução do programa canônico. MeterKit nunca recebe sua chave.",
  },
} as const;

export function DashboardClient({ locale }: { locale: Locale }) {
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
      if (!productsResponse.ok || !paymentsResponse.ok) throw new Error(locale === "en" ? "Gateway unavailable" : locale === "es" ? "Gateway no disponible" : "Gateway indisponível");
      setProducts(await productsResponse.json() as Product[]);
      setPayments(await paymentsResponse.json() as Payment[]);
      setError(undefined);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : locale === "en" ? "Could not read the gateway" : locale === "es" ? "No se pudo leer el gateway" : "Não foi possível acessar o gateway");
    }
  }, [locale, sessionToken]);
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
              void authenticateWallet(connected, locale).then(setSessionToken).catch((cause: unknown) => {
                setError(cause instanceof Error ? cause.message : locale === "en" ? "Could not authenticate wallet" : locale === "es" ? "No se pudo autenticar la wallet" : "Não foi possível autenticar a carteira");
              });
            }} />
            <button className="new" disabled={!connection} onClick={() => setCreating(true)}>{text.newProduct}</button>
          </div>
        </header>
        {error && <p className="errorBanner">{error}</p>}
        {creating && connection && <ProductForm locale={locale} connection={connection} onClose={() => setCreating(false)} onCreated={refresh} />}
        <div className="metrics">
          <article><span>{text.volume}</span><strong>{formatUsdc(volume, locale)} USDC</strong><small>{text.persisted}</small></article>
          <article><span>{text.requests}</span><strong>{payments.length}</strong><small>{text.receipts}</small></article>
          <article><span>{text.products}</span><strong>{products.length}</strong><small>{text.config}</small></article>
          <article><span>{text.network}</span><strong className="network"><i /> Devnet</strong><small>USDC · SPL Token</small></article>
        </div>
        <div className="grid liveGrid">
          {products.map((product) => <article className="product" key={product.id}>
            <div className="productTop"><span className="weather">⌁</span><span className="live">● {locale === "en" ? "ACTIVE" : locale === "es" ? "ACTIVO" : "ATIVO"}</span></div>
            <h3>{product.name}</h3><p>{locale === "en" && product.id === "premium-weather"
              ? "Compact forecast with provenance and retrieval time"
              : product.description}</p>
            <div className="price"><strong>{formatUsdc(BigInt(product.priceAtomic), locale)}</strong><span> USDC<br />{text.perRequest}</span></div>
            <code>GET {new URL(product.resource).pathname}</code>
            <div className="productFoot"><span>{short(product.payTo)}</span><a href={product.resource} target="_blank" rel="noreferrer">{locale === "en" ? "Try 402 ↗" : locale === "es" ? "Probar 402 ↗" : "Testar 402 ↗"}</a></div>
          </article>)}
          {connection && <button className="add" onClick={() => setCreating(true)}><span>＋</span><h3>{text.createAnother}</h3><p>{text.apiTool}</p></button>}
        </div>
      </section>
      <section className="transactions" id="payments">
        <div className="sectionHead"><div><span className="kicker">{text.activity}</span><h2>{text.recent}</h2></div><button onClick={() => void refresh()}>{text.refresh}</button></div>
        <div className="table">
          {!payments.length && <p className="empty">{text.empty}</p>}
          {payments.map((payment) => <div className="row" key={payment.id}>
            <span className="tx">↗</span><div><strong>{payment.productId}</strong><small>{new Date(payment.settledAt).toLocaleString(dateLocales[locale])}</small></div>
            <code>{short(payment.signature)}</code><strong>{formatUsdc(BigInt(payment.amountAtomic), locale)} USDC</strong>
            <span className="final">✓ {payment.status}</span><a href={payment.explorerUrl} target="_blank" rel="noreferrer">Explorer ↗</a>
          </div>)}
        </div>
      </section>
    </>
  );
}

export function AllowancePanel({ connection, locale }: { connection?: ConnectedWallet; locale: Locale }) {
  const text = dashboardCopy[locale];
  const [delegationAccount, setDelegationAccount] = useState("");
  const [status, setStatus] = useState(locale === "en" ? "Revoke allowance" : locale === "es" ? "Revocar allowance" : "Revogar allowance");
  useEffect(() => setStatus(locale === "en" ? "Revoke allowance" : locale === "es" ? "Revocar allowance" : "Revogar allowance"), [locale]);
  const [signature, setSignature] = useState<string>();
  return <section className="allowances" id="allowances">
    <div>
      <span className="kicker">{text.payerControl}</span>
      <h2>{text.revokeTitle}</h2>
      <p>{text.revokeBody}</p>
    </div>
    <form onSubmit={async (event) => {
      event.preventDefault();
      if (!connection) { setStatus(locale === "en" ? "Connect your wallet" : locale === "es" ? "Conecta tu wallet" : "Conecte sua carteira"); return; }
      if (!connection.account.chains.includes(walletDevnet)) {
        setStatus(locale === "en" ? "Switch wallet to devnet" : locale === "es" ? "Cambia la wallet a devnet" : "Mude a carteira para devnet");
        return;
      }
      const feature = connection.wallet.features[SolanaSignAndSendTransaction] as
        SolanaSignAndSendTransactionFeature[typeof SolanaSignAndSendTransaction] | undefined;
      if (!feature) { setStatus(locale === "en" ? "Wallet cannot send transactions" : locale === "es" ? "Wallet sin envío de transacciones" : "A carteira não envia transações"); return; }
      setStatus(locale === "en" ? "Preparing…" : locale === "es" ? "Preparando…" : "Preparando…");
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
          throw new Error(locale === "en" ? "RPC did not return a blockhash" : locale === "es" ? "RPC no devolvió un blockhash" : "RPC não retornou um blockhash");
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
        if (!result) throw new Error(locale === "en" ? "Wallet did not return a signature" : locale === "es" ? "La wallet no devolvió firma" : "A carteira não retornou uma assinatura");
        const encoded = bs58.encode(result.signature);
        setSignature(encoded);
        setStatus(locale === "en" ? "Revoked ✓" : locale === "es" ? "Revocada ✓" : "Revogada ✓");
      } catch (cause) {
        setStatus(cause instanceof Error ? cause.message : locale === "en" ? "Could not revoke" : locale === "es" ? "No se pudo revocar" : "Não foi possível revogar");
      }
    }}>
      <label>{locale === "en" ? "Delegation account" : locale === "es" ? "Cuenta de delegación" : "Conta de delegação"}
        <input
          required
          minLength={32}
          maxLength={44}
          value={delegationAccount}
          onChange={(event) => setDelegationAccount(event.target.value)}
          placeholder={locale === "en" ? "Delegation account address" : locale === "es" ? "Dirección del delegation account" : "Endereço da conta de delegação"}
        />
      </label>
      <button type="submit">{status}</button>
      {signature && <a
        href={`https://explorer.solana.com/tx/${encodeURIComponent(signature)}?cluster=devnet`}
        target="_blank"
        rel="noreferrer"
      >{locale === "en" ? "Open revocation in Explorer ↗" : locale === "es" ? "Abrir revocación en Explorer ↗" : "Abrir revogação no Explorer ↗"}</a>}
    </form>
  </section>;
}

function ProductForm({ connection, onClose, onCreated, locale }: {
  connection: ConnectedWallet;
  onClose: () => void;
  onCreated: () => Promise<void>;
  locale: Locale;
}) {
  const [status, setStatus] = useState(locale === "en" ? "Create" : locale === "es" ? "Crear" : "Criar");
  return <form className="productForm" onSubmit={async (event) => {
    event.preventDefault(); setStatus(locale === "en" ? "Saving…" : locale === "es" ? "Guardando…" : "Salvando…");
    const data = new FormData(event.currentTarget);
    const id = String(data.get("id"));
    const feature = connection.wallet.features[SolanaSignMessage] as
      SolanaSignMessageFeature[typeof SolanaSignMessage] | undefined;
    if (!feature) { setStatus(locale === "en" ? "Wallet cannot sign messages" : locale === "es" ? "Wallet sin firma de mensajes" : "A carteira não assina mensagens"); return; }
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
    if (!challengeResponse.ok) { setStatus(locale === "en" ? "Authorization failed" : locale === "es" ? "No se pudo autorizar" : "Não foi possível autorizar"); return; }
    const challenge = await challengeResponse.json() as { nonce: string; message: string };
    const [signed] = await feature.signMessage({
      account: connection.account,
      message: new TextEncoder().encode(challenge.message),
    });
    if (!signed) { setStatus(locale === "en" ? "Signature cancelled" : locale === "es" ? "Firma cancelada" : "Assinatura cancelada"); return; }
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
    <input name="description" required placeholder={locale === "en" ? "What the customer receives" : locale === "es" ? "Qué obtiene el cliente" : "O que o cliente recebe"} />
    <input
      name="upstreamUrl"
      required
      type="url"
      defaultValue="https://api.open-meteo.com/v1/forecast?latitude=-34.6037&longitude=-58.3816&current=temperature_2m"
      placeholder="https://api.example.com/data"
    />
    <input name="price" required type="number" min="0.000001" step="0.000001" defaultValue="0.01" />
    <button type="submit">{status}</button><button type="button" onClick={onClose}>{locale === "en" ? "Cancel" : locale === "es" ? "Cancelar" : "Cancelar"}</button>
  </form>;
}

function formatUsdc(atomic: bigint, locale: Locale) {
  const whole = atomic / 1_000_000n;
  const fractional = String(atomic % 1_000_000n).padStart(6, "0").replace(/0+$/, "");
  const separator = locale === "en" ? "." : ",";
  return fractional ? `${whole}${separator}${fractional}` : String(whole);
}
function short(value: string) { return value.length > 12 ? `${value.slice(0, 5)}…${value.slice(-4)}` : value; }
function bytesToBase64(value: Uint8Array) {
  let binary = "";
  for (const byte of value) binary += String.fromCharCode(byte);
  return btoa(binary);
}

async function authenticateWallet(connection: ConnectedWallet, locale: Locale) {
  const feature = connection.wallet.features[SolanaSignMessage] as
    SolanaSignMessageFeature[typeof SolanaSignMessage] | undefined;
  if (!feature) throw new Error(locale === "en" ? "Wallet cannot sign messages" : locale === "es" ? "La wallet no soporta firma de mensajes" : "A carteira não assina mensagens");
  const challengeResponse = await fetch(`${gateway}/v1/auth/session/challenge`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ wallet: connection.account.address }),
  });
  if (!challengeResponse.ok) throw new Error(locale === "en" ? "Could not create session" : locale === "es" ? "No se pudo crear la sesión" : "Não foi possível criar a sessão");
  const challenge = await challengeResponse.json() as { nonce: string; message: string };
  const [signed] = await feature.signMessage({
    account: connection.account,
    message: new TextEncoder().encode(challenge.message),
  });
  if (!signed) throw new Error(locale === "en" ? "Session signature cancelled" : locale === "es" ? "Firma de sesión cancelada" : "Assinatura da sessão cancelada");
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
  if (!sessionResponse.ok) throw new Error(locale === "en" ? "Session signature rejected" : locale === "es" ? "La firma de sesión fue rechazada" : "Assinatura da sessão rejeitada");
  const session = await sessionResponse.json() as { token: string };
  return session.token;
}
