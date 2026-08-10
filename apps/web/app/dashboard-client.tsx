"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  useConnect,
  useWallets,
  type UiWallet,
  type UiWalletAccount,
} from "@wallet-standard/react";
import { getWallets } from "@wallet-standard/app";
import type { Wallet, WalletAccount } from "@wallet-standard/base";
import {
  SolanaSignAndSendTransaction,
  SolanaSignMessage,
  type SolanaSignAndSendTransactionFeature,
  type SolanaSignMessageFeature,
} from "@solana/wallet-standard-features";
import {
  buildRevokeDelegationTransaction,
  prepareFixedAllowanceTransaction,
} from "@usemeterkit/subscriptions";
import bs58 from "bs58";
import { dateLocales, type Locale } from "./locale";
import { waitForFinalizedSignature } from "./solana-finality";
import { ProductForm } from "./product-form";

type Product = {
  id: string;
  name: string;
  description: string;
  resource: string;
  upstreamUrl?: string;
  priceAtomic: string;
  assetMint: string;
  payTo: string;
  network: string;
};
type Payment = {
  id: string;
  productId: string;
  amountAtomic: string;
  signature: string;
  settledAt: string;
  status: string;
  explorerUrl: string;
};

const gateway = process.env.NEXT_PUBLIC_GATEWAY_URL ?? "http://localhost:3402";
const usdcMint = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
const walletDevnet = "solana:devnet";
const rpcUrl =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? "https://api.devnet.solana.com";

export type ConnectedWallet = { wallet: Wallet; account: WalletAccount };

export function WalletButton({
  onConnect,
  locale,
}: {
  onConnect: (connection: ConnectedWallet) => void;
  locale: Locale;
}) {
  const wallets = useWallets();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [open]);
  if (!wallets.length)
    return (
      <button className="wallet" disabled>
        {locale === "en"
          ? "Install a Solana wallet"
          : locale === "es"
            ? "Instala una wallet Solana"
            : "Instale uma carteira Solana"}
      </button>
    );
  return (
    <div className="walletMenu">
      <button
        className="wallet"
        aria-expanded={open}
        aria-controls="wallet-options"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="dot" />{" "}
        {locale === "en"
          ? "Connect wallet"
          : locale === "es"
            ? "Conectar wallet"
            : "Conectar carteira"}
      </button>
      {open && (
        <div className="walletOptions" id="wallet-options">
          {wallets.map((wallet) => (
            <WalletOption
              key={`${wallet.name}:${wallet.version}`}
              wallet={wallet}
              onAccount={(account) => {
                const rawWallet = getWallets()
                  .get()
                  .find(
                    (candidate) =>
                      candidate.name === wallet.name &&
                      candidate.version === wallet.version,
                  );
                const rawAccount = rawWallet?.accounts.find(
                  (candidate) => candidate.address === account.address,
                );
                if (rawWallet && rawAccount)
                  onConnect({ wallet: rawWallet, account: rawAccount });
                setOpen(false);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function WalletOption({
  wallet,
  onAccount,
}: {
  wallet: UiWallet;
  onAccount: (account: UiWalletAccount) => void;
}) {
  const [connecting, connect] = useConnect(wallet);
  return (
    <button
      disabled={connecting}
      onClick={async () => {
        const accounts = await connect();
        const solana = accounts.find((account) =>
          account.chains.some((chain) => chain.startsWith("solana:")),
        );
        if (solana) onAccount(solana);
      }}
    >
      {connecting ? "…" : wallet.name}
    </button>
  );
}

const dashboardCopy = {
  en: {
    connect: "Connect your wallet.",
    newProduct: "＋ New product",
    overview: "OVERVIEW · PUBLIC DEVNET DATA",
    volume: "Settled volume",
    requests: "Paid requests",
    products: "Active products",
    receipts: "Unique receipts",
    persisted: "From PostgreSQL",
    config: "Persistent configuration",
    network: "Network",
    perRequest: "per request",
    createAnother: "Create another product",
    apiTool: "API, endpoint, or MCP tool",
    activity: "ONCHAIN ACTIVITY",
    recent: "Recent payments",
    refresh: "Refresh ↻",
    empty: "No settled payments yet.",
    loading: "Loading receipts…",
    payerControl: "PAYER CONTROL",
    revokeTitle: "Revoke an authorization.",
    revokeBody:
      "Your wallet signs a canonical program instruction. MeterKit never receives your key.",
    internalEvidence:
      "Internal devnet verification · not external users, revenue or production activity.",
  },
  es: {
    connect: "Conecta tu wallet.",
    newProduct: "＋ Nuevo producto",
    overview: "OVERVIEW · DATOS PÚBLICOS DE DEVNET",
    volume: "Volumen liquidado",
    requests: "Solicitudes pagadas",
    products: "Productos activos",
    receipts: "Recibos únicos",
    persisted: "Desde PostgreSQL",
    config: "Configuración persistente",
    network: "Red",
    perRequest: "por solicitud",
    createAnother: "Crea otro producto",
    apiTool: "API, endpoint o herramienta MCP",
    activity: "ACTIVIDAD ONCHAIN",
    recent: "Pagos recientes",
    refresh: "Actualizar ↻",
    empty: "Aún no hay pagos liquidados.",
    loading: "Cargando recibos…",
    payerControl: "CONTROL DEL PAGADOR",
    revokeTitle: "Revoca una autorización.",
    revokeBody:
      "La wallet firma una instrucción del programa canónico. MeterKit nunca recibe tu clave.",
    internalEvidence:
      "Verificación interna en devnet · no representa usuarios externos, ingresos ni actividad productiva.",
  },
  "pt-BR": {
    connect: "Conecte sua carteira.",
    newProduct: "＋ Novo produto",
    overview: "VISÃO GERAL · DADOS PÚBLICOS DA DEVNET",
    volume: "Volume liquidado",
    requests: "Requisições pagas",
    products: "Produtos ativos",
    receipts: "Recibos únicos",
    persisted: "Do PostgreSQL",
    config: "Configuração persistente",
    network: "Rede",
    perRequest: "por requisição",
    createAnother: "Crie outro produto",
    apiTool: "API, endpoint ou ferramenta MCP",
    activity: "ATIVIDADE ONCHAIN",
    recent: "Pagamentos recentes",
    refresh: "Atualizar ↻",
    empty: "Ainda não há pagamentos liquidados.",
    loading: "Carregando recibos…",
    payerControl: "CONTROLE DO PAGADOR",
    revokeTitle: "Revogue uma autorização.",
    revokeBody:
      "Sua carteira assina uma instrução do programa canônico. MeterKit nunca recebe sua chave.",
    internalEvidence:
      "Verificação interna na devnet · não representa usuários externos, receita ou atividade produtiva.",
  },
} as const;

export function DashboardClient({ locale }: { locale: Locale }) {
  const text = dashboardCopy[locale];
  const [products, setProducts] = useState<Product[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [connection, setConnection] = useState<ConnectedWallet>();
  const [sessionToken, setSessionToken] = useState<string>();
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const refreshSequence = useRef(0);

  const refresh = useCallback(
    async (signal?: AbortSignal) => {
      const sequence = ++refreshSequence.current;
      try {
        const path = sessionToken ? "/v1" : "/v1/public";
        const headers = sessionToken
          ? { authorization: `Bearer ${sessionToken}` }
          : undefined;
        const [productsResponse, paymentsResponse] = await Promise.all([
          fetch(`${gateway}${path}/products`, { headers, signal }),
          fetch(`${gateway}${path}/payments`, { headers, signal }),
        ]);
        if (!productsResponse.ok || !paymentsResponse.ok)
          throw new Error(
            locale === "en"
              ? "Gateway unavailable"
              : locale === "es"
                ? "Gateway no disponible"
                : "Gateway indisponível",
          );
        const [nextProducts, nextPayments] = await Promise.all([
          productsResponse.json() as Promise<Product[]>,
          paymentsResponse.json() as Promise<Payment[]>,
        ]);
        if (sequence !== refreshSequence.current || signal?.aborted) return;
        setProducts(nextProducts);
        setPayments(nextPayments);
        setError(undefined);
      } catch (cause) {
        if (signal?.aborted || sequence !== refreshSequence.current) return;
        setError(
          cause instanceof Error
            ? cause.message
            : locale === "en"
              ? "Could not read the gateway"
              : locale === "es"
                ? "No se pudo leer el gateway"
                : "Não foi possível acessar o gateway",
        );
      } finally {
        if (sequence === refreshSequence.current && !signal?.aborted) setLoading(false);
      }
    },
    [locale, sessionToken],
  );
  useEffect(() => {
    let active: AbortController | undefined;
    const run = () => {
      active?.abort();
      active = new AbortController();
      void refresh(active.signal);
    };
    run();
    const timer = setInterval(run, 10_000);
    return () => {
      clearInterval(timer);
      active?.abort();
      refreshSequence.current += 1;
    };
  }, [refresh]);

  const volume = payments.reduce(
    (sum, payment) => sum + BigInt(payment.amountAtomic),
    0n,
  );
  return (
    <>
      <section className="dashboard" id="products">
        <header>
          <div>
            <span className="kicker">{text.overview}</span>
            <h2>
              {connection ? short(connection.account.address) : text.connect}
            </h2>
          </div>
          <div className="dashboardActions">
            <WalletButton
              locale={locale}
              onConnect={(connected) => {
                setConnection(connected);
                void authenticateWallet(connected, locale)
                  .then(setSessionToken)
                  .catch((cause: unknown) => {
                    setError(
                      cause instanceof Error
                        ? cause.message
                        : locale === "en"
                          ? "Could not authenticate wallet"
                          : locale === "es"
                            ? "No se pudo autenticar la wallet"
                            : "Não foi possível autenticar a carteira",
                    );
                  });
              }}
            />
            <button
              className="new"
              disabled={!connection}
              onClick={() => setCreating(true)}
            >
              {text.newProduct}
            </button>
          </div>
        </header>
        {error && <p className="errorBanner" role="alert">{error}</p>}
        {!connection && (
          <p className="evidenceBanner">{text.internalEvidence}</p>
        )}
        {creating && connection && (
          <ProductForm
            locale={locale}
            connection={connection}
            onClose={() => setCreating(false)}
            onCreated={refresh}
          />
        )}
        <div className="metrics">
          <article>
            <span>{text.volume}</span>
            <strong>{formatUsdc(volume, locale)} USDC</strong>
            <small>{text.persisted}</small>
          </article>
          <article>
            <span>{text.requests}</span>
            <strong>{payments.length}</strong>
            <small>{text.receipts}</small>
          </article>
          <article>
            <span>{text.products}</span>
            <strong>{products.length}</strong>
            <small>{text.config}</small>
          </article>
          <article>
            <span>{text.network}</span>
            <strong className="network">
              <i /> Devnet
            </strong>
            <small>USDC · SPL Token</small>
          </article>
        </div>
        <div className="grid liveGrid">
          {products.map((product) => (
            <article className="product" key={product.id}>
              <div className="productTop">
                <span className="weather">⌁</span>
                <span className="live">
                  ●{" "}
                  {locale === "en"
                    ? "ACTIVE"
                    : locale === "es"
                      ? "ACTIVO"
                      : "ATIVO"}
                </span>
              </div>
              <h3>{product.name}</h3>
              <p>
                {locale === "en" && product.id === "premium-weather"
                  ? "Compact forecast with provenance and retrieval time"
                  : product.description}
              </p>
              <div className="price">
                <strong>
                  {formatUsdc(BigInt(product.priceAtomic), locale)}
                </strong>
                <span>
                  {" "}
                  USDC
                  <br />
                  {text.perRequest}
                </span>
              </div>
              <code>GET {new URL(product.resource).pathname}</code>
              <div className="productFoot">
                <span>{short(product.payTo)}</span>
                <a href={product.resource} target="_blank" rel="noreferrer">
                  {locale === "en"
                    ? "Try 402 ↗"
                    : locale === "es"
                      ? "Probar 402 ↗"
                      : "Testar 402 ↗"}
                </a>
              </div>
            </article>
          ))}
          {connection && (
            <button className="add" onClick={() => setCreating(true)}>
              <span>＋</span>
              <h3>{text.createAnother}</h3>
              <p>{text.apiTool}</p>
            </button>
          )}
        </div>
      </section>
      <section className="transactions" id="payments">
        <div className="sectionHead">
          <div>
            <span className="kicker">{text.activity}</span>
            <h2>{text.recent}</h2>
          </div>
          <button onClick={() => void refresh()}>{text.refresh}</button>
        </div>
        <div className="table" aria-live="polite" aria-busy={loading}>
          {loading && <p className="empty">{text.loading}</p>}
          {!loading && !payments.length && <p className="empty">{text.empty}</p>}
          {payments.map((payment) => (
            <div className="row" key={payment.id}>
              <span className="tx">↗</span>
              <div>
                <strong>{payment.productId}</strong>
                <small>
                  {new Date(payment.settledAt).toLocaleString(
                    dateLocales[locale],
                  )}
                </small>
              </div>
              <code>{short(payment.signature)}</code>
              <strong>
                {formatUsdc(BigInt(payment.amountAtomic), locale)} USDC
              </strong>
              <span className={`receiptStatus receiptStatus-${payment.status}`}>
                {payment.status === "finalized" ? "✓" : payment.status === "failed" ? "×" : "…"} {payment.status}
              </span>
              <a href={payment.explorerUrl} target="_blank" rel="noreferrer">
                Explorer ↗
              </a>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

type Allowance = {
  address: string;
  ownerWallet: string;
  delegateWallet: string;
  mint: string;
  maxAtomic: string;
  expiresAt: string;
  revokedAt: string | null;
  signature: string | null;
};

export function AllowancePanel({
  connection,
  sessionToken,
  locale,
}: {
  connection?: ConnectedWallet;
  sessionToken?: string;
  locale: Locale;
}) {
  const text = dashboardCopy[locale];
  const [allowances, setAllowances] = useState<Allowance[]>([]);
  const [status, setStatus] = useState("");
  const [pending, setPending] = useState(false);
  const refreshAllowances = useCallback(async () => {
    if (!sessionToken) {
      setAllowances([]);
      return;
    }
    const response = await fetch(`${gateway}/v1/allowances`, {
      headers: { authorization: `Bearer ${sessionToken}` },
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) throw new Error(`Error ${response.status}`);
    setAllowances((await response.json()) as Allowance[]);
  }, [sessionToken]);
  useEffect(() => {
    void refreshAllowances().catch(() => setAllowances([]));
  }, [refreshAllowances]);

  return (
    <section className="allowances" id="allowances">
      <div>
        <span className="kicker">{text.payerControl}</span>
        <h2>
          {locale === "en"
            ? "Create, inspect and revoke allowances."
            : locale === "es"
              ? "Crea, consulta y revoca allowances."
              : "Crie, consulte e revogue allowances."}
        </h2>
        <p>{text.revokeBody}</p>
        <div className="allowanceList">
          {!allowances.length && (
            <p>
              {locale === "en"
                ? "No recorded allowances for this wallet."
                : locale === "es"
                  ? "No hay allowances registradas para esta wallet."
                  : "Não há allowances registradas para esta carteira."}
            </p>
          )}
          {allowances.map((allowance) => (
            <article key={allowance.address}>
              <strong>{short(allowance.delegateWallet)}</strong>
              <span>
                {formatUsdc(BigInt(allowance.maxAtomic), locale)} USDC ·{" "}
                {new Date(allowance.expiresAt).toLocaleDateString(
                  dateLocales[locale],
                )}
              </span>
              <code>{short(allowance.address)}</code>
              <span>
                {allowance.revokedAt
                  ? "Revoked"
                  : new Date(allowance.expiresAt) <= new Date()
                    ? "Expired"
                    : "Active"}
              </span>
              {allowance.signature && (
                <a
                  href={`https://explorer.solana.com/tx/${encodeURIComponent(allowance.signature)}?cluster=devnet`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Explorer ↗
                </a>
              )}
              {!allowance.revokedAt && (
                <button
                  disabled={pending}
                  onClick={() => void revokeAllowance(allowance.address)}
                >
                  {locale === "en"
                    ? "Revoke"
                    : locale === "es"
                      ? "Revocar"
                      : "Revogar"}
                </button>
              )}
            </article>
          ))}
        </div>
      </div>
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          if (pending) return;
          if (!connection || !sessionToken) {
            setStatus(
              locale === "en"
                ? "Connect and authenticate your wallet"
                : locale === "es"
                  ? "Conecta y autentica tu wallet"
                  : "Conecte e autentique sua carteira",
            );
            return;
          }
          if (!connection.account.chains.includes(walletDevnet)) {
            setStatus(
              locale === "en"
                ? "Switch wallet to devnet"
                : locale === "es"
                  ? "Cambia la wallet a devnet"
                  : "Mude a carteira para devnet",
            );
            return;
          }
          const feature = connection.wallet.features[
            SolanaSignAndSendTransaction
          ] as
            | SolanaSignAndSendTransactionFeature[typeof SolanaSignAndSendTransaction]
            | undefined;
          if (!feature) {
            setStatus(
              locale === "en"
                ? "Wallet cannot send transactions"
                : locale === "es"
                  ? "Wallet sin envío de transacciones"
                  : "A carteira não envia transações",
            );
            return;
          }
          setStatus(
            locale === "en"
              ? "Preparing…"
              : locale === "es"
                ? "Preparando…"
                : "Preparando…",
          );
          setPending(true);
          try {
            const data = new FormData(event.currentTarget);
            const delegateWallet = String(data.get("delegateWallet"));
            const maxAtomic = BigInt(
              Math.round(Number(data.get("maxUsdc")) * 1_000_000),
            );
            const expiresAt = new Date(
              Date.now() + Number(data.get("days")) * 86_400_000,
            );
            const latest = await getLatestBlockhash(locale);
            const prepared = await prepareFixedAllowanceTransaction({
              ownerAddress: connection.account.address,
              mint: usdcMint,
              delegate: delegateWallet,
              maxAtomic,
              expiresAt,
              nonce: BigInt(Date.now()),
              authorityInitId: BigInt(String(data.get("authorityInitId"))),
              recentBlockhash: latest.blockhash,
              lastValidBlockHeight: BigInt(latest.lastValidBlockHeight),
            });
            const [result] = await feature.signAndSendTransaction({
              account: connection.account,
              transaction: new Uint8Array(prepared.transaction),
              chain: walletDevnet,
              options: {
                commitment: "confirmed",
                skipPreflight: false,
                maxRetries: 3,
              },
            });
            if (!result)
              throw new Error(
                locale === "en"
                  ? "Wallet did not return a signature"
                  : locale === "es"
                    ? "La wallet no devolvió firma"
                    : "A carteira não retornou uma assinatura",
              );
            const encoded = bs58.encode(result.signature);
            setStatus(
              locale === "en"
                ? "Submitted · confirming…"
                : locale === "es"
                  ? "Enviada · confirmando…"
                  : "Enviada · confirmando…",
            );
            await waitForFinalizedSignature(encoded, rpcUrl);
            const record = await fetch(`${gateway}/v1/allowances`, {
              method: "POST",
              headers: {
                "content-type": "application/json",
                authorization: `Bearer ${sessionToken}`,
              },
              body: JSON.stringify({
                address: prepared.delegationAccount,
                delegateWallet,
                mint: usdcMint,
                maxAtomic: String(maxAtomic),
                expiresAt: expiresAt.toISOString(),
                signature: encoded,
              }),
            });
            if (!record.ok)
              throw new Error(`Could not record allowance: ${record.status}`);
            await refreshAllowances();
            setStatus(
              locale === "en"
                ? "Allowance active ✓"
                : locale === "es"
                  ? "Allowance activa ✓"
                  : "Allowance ativa ✓",
            );
          } catch (cause) {
            setStatus(
              cause instanceof Error
                ? cause.message
                : locale === "en"
                  ? "Could not create allowance"
                  : locale === "es"
                    ? "No se pudo crear la allowance"
                    : "Não foi possível criar a allowance",
            );
          } finally {
            setPending(false);
          }
        }}
      >
        <label>
          {locale === "en"
            ? "Delegate wallet"
            : locale === "es"
              ? "Wallet delegada"
              : "Carteira delegada"}
          <input
            name="delegateWallet"
            required
            minLength={32}
            maxLength={44}
            disabled={pending}
          />
        </label>
        <label>
          {locale === "en"
            ? "Maximum USDC"
            : locale === "es"
              ? "Máximo USDC"
              : "Máximo USDC"}
          <input
            name="maxUsdc"
            type="number"
            required
            min="0.000001"
            max="100"
            step="0.000001"
            defaultValue="1"
            disabled={pending}
          />
        </label>
        <label>
          {locale === "en"
            ? "Expires in days"
            : locale === "es"
              ? "Vence en días"
              : "Expira em dias"}
          <input
            name="days"
            type="number"
            required
            min="1"
            max="90"
            defaultValue="30"
            disabled={pending}
          />
        </label>
        <label>
          {locale === "en"
            ? "Authority initialization ID"
            : locale === "es"
              ? "ID de inicialización de authority"
              : "ID de inicialização da authority"}
          <input
            name="authorityInitId"
            type="number"
            required
            min="0"
            defaultValue="1"
            disabled={pending}
          />
        </label>
        <button type="submit" disabled={pending} aria-busy={pending}>
          {pending
            ? status
            : locale === "en"
              ? "Create fixed allowance"
              : locale === "es"
                ? "Crear allowance fija"
                : "Criar allowance fixa"}
        </button>
        {status && !pending && <p role="status">{status}</p>}
      </form>
    </section>
  );

  async function revokeAllowance(delegationAccount: string) {
    if (!connection || !sessionToken || pending) return;
    const feature = connection.wallet.features[SolanaSignAndSendTransaction] as
      | SolanaSignAndSendTransactionFeature[typeof SolanaSignAndSendTransaction]
      | undefined;
    if (!feature) return;
    setPending(true);
    try {
      const latest = await getLatestBlockhash(locale);
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
        options: {
          commitment: "confirmed",
          skipPreflight: false,
          maxRetries: 3,
        },
      });
      if (!result) throw new Error("Wallet did not return a signature");
      const encoded = bs58.encode(result.signature);
      await waitForFinalizedSignature(encoded, rpcUrl);
      const response = await fetch(
        `${gateway}/v1/allowances/${encodeURIComponent(delegationAccount)}/revoked`,
        {
          method: "POST",
          headers: { authorization: `Bearer ${sessionToken}` },
        },
      );
      if (!response.ok)
        throw new Error(`Could not record revocation: ${response.status}`);
      await refreshAllowances();
      setStatus(
        locale === "en"
          ? "Revoked ✓"
          : locale === "es"
            ? "Revocada ✓"
            : "Revogada ✓",
      );
    } catch (cause) {
      setStatus(cause instanceof Error ? cause.message : "Could not revoke");
    } finally {
      setPending(false);
    }
  }
}

function formatUsdc(atomic: bigint, locale: Locale) {
  const whole = atomic / 1_000_000n;
  const fractional = String(atomic % 1_000_000n)
    .padStart(6, "0")
    .replace(/0+$/, "");
  const separator = locale === "en" ? "." : ",";
  return fractional ? `${whole}${separator}${fractional}` : String(whole);
}
function short(value: string) {
  return value.length > 12 ? `${value.slice(0, 5)}…${value.slice(-4)}` : value;
}
function bytesToBase64(value: Uint8Array) {
  let binary = "";
  for (const byte of value) binary += String.fromCharCode(byte);
  return btoa(binary);
}

async function getLatestBlockhash(locale: Locale) {
  const response = await fetch(rpcUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    signal: AbortSignal.timeout(10_000),
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: crypto.randomUUID(),
      method: "getLatestBlockhash",
      params: [{ commitment: "confirmed" }],
    }),
  });
  const body = (await response.json()) as {
    result?: { value?: { blockhash?: string; lastValidBlockHeight?: number } };
  };
  const latest = body.result?.value;
  if (
    !response.ok ||
    !latest?.blockhash ||
    latest.lastValidBlockHeight === undefined
  ) {
    throw new Error(
      locale === "en"
        ? "RPC did not return a blockhash"
        : locale === "es"
          ? "RPC no devolvió un blockhash"
          : "RPC não retornou um blockhash",
    );
  }
  return {
    blockhash: latest.blockhash,
    lastValidBlockHeight: latest.lastValidBlockHeight,
  };
}

export async function authenticateWallet(
  connection: ConnectedWallet,
  locale: Locale,
) {
  const feature = connection.wallet.features[SolanaSignMessage] as
    SolanaSignMessageFeature[typeof SolanaSignMessage] | undefined;
  if (!feature)
    throw new Error(
      locale === "en"
        ? "Wallet cannot sign messages"
        : locale === "es"
          ? "La wallet no soporta firma de mensajes"
          : "A carteira não assina mensagens",
    );
  const challengeResponse = await fetch(
    `${gateway}/v1/auth/session/challenge`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ wallet: connection.account.address }),
    },
  );
  if (!challengeResponse.ok)
    throw new Error(
      locale === "en"
        ? "Could not create session"
        : locale === "es"
          ? "No se pudo crear la sesión"
          : "Não foi possível criar a sessão",
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
        ? "Session signature cancelled"
        : locale === "es"
          ? "Firma de sesión cancelada"
          : "Assinatura da sessão cancelada",
    );
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
  if (!sessionResponse.ok)
    throw new Error(
      locale === "en"
        ? "Session signature rejected"
        : locale === "es"
          ? "La firma de sesión fue rechazada"
          : "Assinatura da sessão rejeitada",
    );
  const session = (await sessionResponse.json()) as { token: string };
  return session.token;
}
