import express from "express";
import { createHash, randomBytes } from "node:crypto";
import type { Express } from "express";
import cors from "cors";
import { rateLimit } from "express-rate-limit";
import {
  MemoryPaymentStore,
  SOLANA_DEVNET,
  SUBSCRIPTIONS_PROGRAM,
  explorerUrl,
  productSchema,
  type PaymentStore,
} from "@meterkit/core";
import { PostgresStore, type ProductStore } from "@meterkit/database";
import { createDynamicX402Middleware, createX402Middleware } from "@meterkit/sdk";
import { WalletChallenges } from "./wallet-auth.js";
import { SolanaFinalityReconciler } from "./finality.js";
import { loadGatewayConfig, requirePersistentMerchant } from "./config.js";
import {
  assertAllowedUpstream,
  fetchAllowedUpstream,
  parseUpstreamAllowlist,
} from "./upstream.js";

const app: Express = express();
const config = loadGatewayConfig();
if (config.trustProxyHops > 0) {
  app.set("trust proxy", config.trustProxyHops);
}
let store: PaymentStore = new MemoryPaymentStore();
let productStore: ProductStore | undefined;
let reconciler: SolanaFinalityReconciler | undefined;
let walletChallenges = new WalletChallenges();
const upstreamHosts = parseUpstreamAllowlist(
  process.env.UPSTREAM_HOST_ALLOWLIST ?? "api.open-meteo.com,api.github.com",
);
const paymentStore: PaymentStore = {
  has: (signature) => store.has(signature),
  save: (record) => store.save(record),
  list: () => store.list(),
};
app.disable("x-powered-by");
app.use((_request, response, next) => {
  response.set({
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "no-referrer",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Cross-Origin-Resource-Policy": "same-site",
  });
  if (process.env.NODE_ENV === "production") {
    response.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  next();
});
app.use(cors({
  origin: (process.env.CORS_ORIGINS ?? "http://localhost:3000,http://127.0.0.1:3100")
    .split(",").map((origin) => origin.trim()),
  exposedHeaders: ["PAYMENT-REQUIRED", "PAYMENT-RESPONSE"],
}));
app.use(express.json({ limit: "32kb" }));
app.use(rateLimit({ windowMs: 60_000, limit: Number(process.env.RATE_LIMIT_PER_MINUTE ?? 60) }));

const product = config.product;

app.get("/health", (_request, response) => response.json({
  status: "ok", network: SOLANA_DEVNET, custody: false,
  persistence: productStore ? "postgres" : "memory",
}));
app.get("/v1/public/products", async (_request, response) => {
  response.json([product]);
});
app.get("/v1/products", async (request, response) => {
  const owner = await sessionOwner(request.header("authorization"));
  if (!owner) {
    response.status(401).json({ error: "wallet_session_required" });
    return;
  }
  response.json(productStore ? await productStore.listProductsForOwner(owner) : []);
});
app.post("/v1/auth/session/challenge", async (request, response) => {
  const wallet = typeof request.body?.wallet === "string" ? request.body.wallet : "";
  if (wallet.length < 32 || wallet.length > 44) {
    response.status(422).json({ error: "invalid_wallet" });
    return;
  }
  const requestHash = createHash("sha256")
    .update(JSON.stringify({ wallet }))
    .digest("hex");
  const idempotencyKey = `session:${wallet}`;
  response.json(await walletChallenges.issue({
    wallet,
    requestHash,
    idempotencyKey,
    audience: config.publicGatewayUrl,
    method: "POST",
    path: "/v1/auth/session",
  }));
});
app.post("/v1/auth/session", async (request, response) => {
  if (!productStore) {
    response.status(503).json({ error: "postgres_required" });
    return;
  }
  const wallet = typeof request.body?.wallet === "string" ? request.body.wallet : "";
  const auth = request.body?.auth as Record<string, unknown> | undefined;
  const requestHash = createHash("sha256")
    .update(JSON.stringify({ wallet }))
    .digest("hex");
  const idempotencyKey = `session:${wallet}`;
  const authorized = auth && await walletChallenges.verify({
    wallet,
    nonce: typeof auth.nonce === "string" ? auth.nonce : "",
    signedMessage: typeof auth.signedMessage === "string" ? auth.signedMessage : "",
    signature: typeof auth.signature === "string" ? auth.signature : "",
    requestHash,
    idempotencyKey,
  });
  if (!authorized) {
    response.status(401).json({ error: "wallet_signature_required" });
    return;
  }
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + 60 * 60_000);
  await productStore.createSession(hashToken(token), wallet, expiresAt);
  response.set("Cache-Control", "no-store").json({
    token,
    expiresAt: expiresAt.toISOString(),
  });
});
app.post("/v1/auth/challenge", async (request, response) => {
  const wallet = typeof request.body?.wallet === "string" ? request.body.wallet : "";
  const parsed = productSchema.safeParse(request.body?.product);
  const idempotencyKey = typeof request.body?.idempotencyKey === "string"
    ? request.body.idempotencyKey : "";
  if (wallet.length < 32 || wallet.length > 44 || !parsed.success ||
      parsed.data.payTo !== wallet || !/^[A-Za-z0-9._:-]{8,200}$/.test(idempotencyKey)) {
    response.status(422).json({ error: "invalid_authorization_request" });
    return;
  }
  if (!parsed.data.upstreamUrl) {
    response.status(422).json({ error: "upstream_required" });
    return;
  }
  try {
    assertAllowedUpstream(parsed.data.upstreamUrl, upstreamHosts);
  } catch {
    response.status(422).json({ error: "upstream_not_allowed" });
    return;
  }
  const requestHash = createHash("sha256").update(JSON.stringify(parsed.data)).digest("hex");
  response.json(await walletChallenges.issue({
    wallet,
    requestHash,
    idempotencyKey,
    audience: config.publicGatewayUrl,
    method: "POST",
    path: "/v1/products",
  }));
});
app.post("/v1/products", async (request, response) => {
  if (!productStore) {
    response.status(503).json({ error: "postgres_required" });
    return;
  }
  const parsed = productSchema.safeParse(request.body?.product);
  if (!parsed.success) {
    response.status(422).json({ error: "invalid_product", issues: parsed.error.issues });
    return;
  }
  if (!parsed.data.upstreamUrl) {
    response.status(422).json({ error: "upstream_required" });
    return;
  }
  try {
    assertAllowedUpstream(parsed.data.upstreamUrl, upstreamHosts);
  } catch {
    response.status(422).json({ error: "upstream_not_allowed" });
    return;
  }
  const idempotencyKey = request.header("Idempotency-Key") ?? "";
  if (!/^[A-Za-z0-9._:-]{8,200}$/.test(idempotencyKey)) {
    response.status(422).json({ error: "idempotency_key_required" });
    return;
  }
  const requestHash = createHash("sha256")
    .update(JSON.stringify(parsed.data))
    .digest("hex");
  const auth = request.body?.auth as Record<string, unknown> | undefined;
  const authorized = auth && await walletChallenges.verify({
    wallet: parsed.data.payTo,
    nonce: typeof auth.nonce === "string" ? auth.nonce : "",
    signedMessage: typeof auth.signedMessage === "string" ? auth.signedMessage : "",
    signature: typeof auth.signature === "string" ? auth.signature : "",
    requestHash,
    idempotencyKey,
  });
  if (!authorized) {
    response.status(401).json({ error: "wallet_signature_required" });
    return;
  }
  try {
    const created = await productStore.createIdempotent(parsed.data, idempotencyKey, requestHash);
    response.status(201).location(`/v1/products/${created.id}`).json(created);
  } catch (error) {
    if (error instanceof Error && error.message === "IDEMPOTENCY_KEY_CONFLICT") {
      response.status(409).json({ error: "idempotency_key_conflict" });
      return;
    }
    if (error instanceof Error && error.message === "PRODUCT_OWNER_CONFLICT") {
      response.status(409).json({ error: "product_slug_unavailable" });
      return;
    }
    throw error;
  }
});
app.get("/v1/public/payments", async (_request, response) => {
  const payments = productStore
    ? await productStore.listPaymentsForProduct(product.id)
    : await paymentStore.list();
  response.set("Cache-Control", "no-store");
  response.json(publicPayments(payments));
});
app.get("/v1/payments", async (request, response) => {
  const owner = await sessionOwner(request.header("authorization"));
  if (!owner) {
    response.status(401).json({ error: "wallet_session_required" });
    return;
  }
  const payments = productStore
    ? await productStore.listPaymentsForOwner(owner)
    : [];
  response.set("Cache-Control", "no-store");
  response.json(publicPayments(payments));
});
app.get("/v1/allowances", async (request, response) => {
  const owner = await sessionOwner(request.header("authorization"));
  if (!owner || !productStore) {
    response.status(401).json({ error: "wallet_session_required" });
    return;
  }
  response.set("Cache-Control", "no-store").json(
    await productStore.listAllowancesForOwner(owner),
  );
});
app.post("/v1/allowances", async (request, response) => {
  const owner = await sessionOwner(request.header("authorization"));
  if (!owner || !productStore) {
    response.status(401).json({ error: "wallet_session_required" });
    return;
  }
  const body = request.body as Record<string, unknown>;
  const maxAtomic = typeof body.maxAtomic === "string" && /^[1-9]\d*$/.test(body.maxAtomic)
    ? BigInt(body.maxAtomic) : 0n;
  const expiresAt = typeof body.expiresAt === "string" ? new Date(body.expiresAt) : new Date(NaN);
  const validAddress = (value: unknown) =>
    typeof value === "string" && /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value);
  if (!validAddress(body.address) || !validAddress(body.delegateWallet) ||
      body.mint !== config.product.assetMint || maxAtomic <= 0n ||
      maxAtomic > 100_000_000n || !Number.isFinite(expiresAt.getTime()) ||
      expiresAt <= new Date() || expiresAt.getTime() > Date.now() + 90 * 86_400_000 ||
      typeof body.signature !== "string" ||
      !/^[1-9A-HJ-NP-Za-km-z]{64,88}$/.test(body.signature)) {
    response.status(422).json({ error: "invalid_allowance" });
    return;
  }
  const receiptValid = await verifyAllowanceReceipt({
    signature: String(body.signature),
    owner,
    delegationAccount: String(body.address),
    delegate: String(body.delegateWallet),
    mint: String(body.mint),
  });
  if (!receiptValid) {
    response.status(422).json({ error: "allowance_receipt_not_verified" });
    return;
  }
  await productStore.saveAllowance({
    address: String(body.address),
    ownerWallet: owner,
    delegateWallet: String(body.delegateWallet),
    mint: String(body.mint),
    maxAtomic: String(maxAtomic),
    expiresAt: expiresAt.toISOString(),
    revokedAt: null,
    signature: String(body.signature),
  });
  response.status(201).json({ status: "recorded" });
});
app.post("/v1/allowances/:address/revoked", async (request, response) => {
  const owner = await sessionOwner(request.header("authorization"));
  if (!owner || !productStore) {
    response.status(401).json({ error: "wallet_session_required" });
    return;
  }
  const allowanceAddress = Array.isArray(request.params.address)
    ? request.params.address[0] : request.params.address;
  if (!allowanceAddress || !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(allowanceAddress)) {
    response.status(422).json({ error: "invalid_allowance_address" });
    return;
  }
  const changed = await productStore.revokeAllowance(owner, allowanceAddress);
  response.status(changed ? 200 : 404).json({
    status: changed ? "revoked" : "allowance_not_found",
  });
});
app.get(
  "/v1/weather/premium",
  createX402Middleware({
    product,
    store: paymentStore,
    facilitatorUrl: process.env.X402_FACILITATOR_URL ?? "https://x402.org/facilitator",
    rpcUrl: process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com",
  }),
  (request, response) => {
    const city = typeof request.query.city === "string" ? request.query.city : "Buenos Aires";
    response.json({
      city,
      summary: "Datos de demostración: conecte un proveedor meteorológico permitido para producción.",
      temperatureC: 21,
      observedAt: new Date().toISOString(),
      receipt: "See PAYMENT-RESPONSE header after settlement",
    });
  },
);
app.get(
  "/v1/products/:id/proxy",
  createDynamicX402Middleware({
    resolveProduct: async (id) => productStore?.get(id) ?? (id === product.id ? product : null),
    store: paymentStore,
    facilitatorUrl: process.env.X402_FACILITATOR_URL ?? "https://x402.org/facilitator",
    rpcUrl: process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com",
  }),
  async (request, response) => {
    const id = Array.isArray(request.params.id) ? request.params.id[0] : request.params.id;
    if (!id) {
      response.status(404).json({ error: "product_not_found" });
      return;
    }
    const configured = await productStore?.get(id) ?? (id === product.id ? product : null);
    if (!configured) {
      response.status(404).json({ error: "product_not_found" });
      return;
    }
    if (!configured.upstreamUrl) {
      response.status(502).json({ error: "upstream_not_configured" });
      return;
    }
    try {
      const upstream = await fetchAllowedUpstream({
        upstreamUrl: configured.upstreamUrl,
        clientQuery: new URL(request.originalUrl, config.publicGatewayUrl).searchParams,
        allowedHosts: upstreamHosts,
      });
      response
        .status(upstream.status)
        .set("Content-Type", upstream.contentType)
        .set("X-MeterKit-Upstream", new URL(upstream.sourceUrl).hostname)
        .send(Buffer.from(upstream.body));
    } catch (error) {
      console.error(JSON.stringify({
        event: "upstream_request_failed",
        productId: configured.id,
        error: error instanceof Error ? error.message : "unknown",
      }));
      response.status(502).json({ error: "upstream_unavailable" });
    }
  },
);

async function start() {
  if (process.env.DATABASE_URL) {
    requirePersistentMerchant();
    const postgres = PostgresStore.connect(process.env.DATABASE_URL);
    await postgres.migrate();
    await postgres.create(product);
    store = postgres;
    productStore = postgres;
    walletChallenges = new WalletChallenges(postgres);
    reconciler = new SolanaFinalityReconciler(
      postgres,
      [
        process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com",
        ...(process.env.SOLANA_RPC_FALLBACK_URL
          ? [process.env.SOLANA_RPC_FALLBACK_URL]
          : []),
      ],
    );
    const pollMs = Math.max(Number(process.env.FINALITY_POLL_MS ?? 15_000), 5_000);
    const timer = setInterval(() => {
      reconciler?.reconcile().catch((error: unknown) => {
        console.error(JSON.stringify({ event: "finality_reconcile_failed", error: String(error) }));
      });
    }, pollMs);
    timer.unref();
    const cleanupTimer = setInterval(() => {
      postgres.cleanupExpired().catch((error: unknown) => {
        console.error(JSON.stringify({ event: "expired_data_cleanup_failed", error: String(error) }));
      });
    }, 60 * 60_000);
    cleanupTimer.unref();
  }
  return app.listen(config.port, () => console.log(JSON.stringify({
    event: "gateway_started",
    port: config.port,
    publicUrl: config.publicGatewayUrl,
    network: "devnet",
    persistence: productStore ? "postgres" : "memory",
  })));
}
if (process.env.NODE_ENV !== "test") {
  start().catch((error: unknown) => {
    console.error(JSON.stringify({ event: "gateway_start_failed", error: String(error) }));
    process.exitCode = 1;
  });
}
export { app, product, start };

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

async function sessionOwner(authorization: string | undefined) {
  if (!productStore || !authorization?.startsWith("Bearer ")) return null;
  const token = authorization.slice("Bearer ".length);
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
  return productStore.getSessionOwner(hashToken(token));
}

function publicPayments(payments: Awaited<ReturnType<PaymentStore["list"]>>) {
  return payments.map((payment) => ({
    id: payment.id,
    productId: payment.productId,
    amountAtomic: payment.amountAtomic,
    network: payment.network,
    signature: payment.signature,
    settledAt: payment.settledAt,
    status: payment.status,
    explorerUrl: explorerUrl(payment.signature),
  }));
}

async function verifyAllowanceReceipt(input: {
  signature: string;
  owner: string;
  delegationAccount: string;
  delegate: string;
  mint: string;
}) {
  try {
    const rpcUrl = process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com";
    const rpcResponse = await fetch(rpcUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      signal: AbortSignal.timeout(10_000),
      body: JSON.stringify({
        jsonrpc: "2.0", id: crypto.randomUUID(), method: "getTransaction",
        params: [input.signature, {
          commitment: "finalized",
          encoding: "jsonParsed",
          maxSupportedTransactionVersion: 0,
        }],
      }),
    });
    if (!rpcResponse.ok) return false;
    const body = await rpcResponse.json() as {
      result?: {
        meta?: { err?: unknown };
        transaction?: { message?: { accountKeys?: Array<string | { pubkey?: string }> } };
      } | null;
    };
    if (!body.result || body.result.meta?.err != null) return false;
    const keys = new Set((body.result.transaction?.message?.accountKeys ?? [])
      .map((key) => typeof key === "string" ? key : key.pubkey)
      .filter((key): key is string => Boolean(key)));
    return [
      input.owner, input.delegationAccount, input.delegate, input.mint,
      SUBSCRIPTIONS_PROGRAM,
    ].every((key) => keys.has(key));
  } catch {
    return false;
  }
}
