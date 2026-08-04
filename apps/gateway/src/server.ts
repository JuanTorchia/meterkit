import express from "express";
import { createHash } from "node:crypto";
import type { Express } from "express";
import cors from "cors";
import { rateLimit } from "express-rate-limit";
import {
  MemoryPaymentStore,
  SOLANA_DEVNET,
  explorerUrl,
  productSchema,
  type PaymentStore,
} from "@meterkit/core";
import { PostgresStore, type ProductStore } from "@meterkit/database";
import { createDynamicX402Middleware, createX402Middleware } from "@meterkit/sdk";
import { WalletChallenges } from "./wallet-auth.js";
import { SolanaFinalityReconciler } from "./finality.js";
import { loadGatewayConfig, requirePersistentMerchant } from "./config.js";

const app: Express = express();
const config = loadGatewayConfig();
if (config.trustProxyHops > 0) {
  app.set("trust proxy", config.trustProxyHops);
}
let store: PaymentStore = new MemoryPaymentStore();
let productStore: ProductStore | undefined;
let reconciler: SolanaFinalityReconciler | undefined;
const walletChallenges = new WalletChallenges();
const paymentStore: PaymentStore = {
  has: (signature) => store.has(signature),
  save: (record) => store.save(record),
  list: () => store.list(),
};
app.disable("x-powered-by");
app.use(cors({
  origin: (process.env.CORS_ORIGINS ?? "http://localhost:3000,http://127.0.0.1:3100")
    .split(",").map((origin) => origin.trim()),
}));
app.use(express.json({ limit: "32kb" }));
app.use(rateLimit({ windowMs: 60_000, limit: Number(process.env.RATE_LIMIT_PER_MINUTE ?? 60) }));

const product = config.product;

app.get("/health", (_request, response) => response.json({
  status: "ok", network: SOLANA_DEVNET, custody: false,
  persistence: productStore ? "postgres" : "memory",
}));
app.get("/v1/products", async (_request, response) => {
  response.json(productStore ? await productStore.listProducts() : [product]);
});
app.post("/v1/auth/challenge", (request, response) => {
  const wallet = typeof request.body?.wallet === "string" ? request.body.wallet : "";
  if (wallet.length < 32 || wallet.length > 44) {
    response.status(422).json({ error: "invalid_wallet" });
    return;
  }
  response.json(walletChallenges.issue(wallet));
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
  const auth = request.body?.auth as Record<string, unknown> | undefined;
  const authorized = auth && walletChallenges.verify({
    wallet: parsed.data.payTo,
    nonce: typeof auth.nonce === "string" ? auth.nonce : "",
    signedMessage: typeof auth.signedMessage === "string" ? auth.signedMessage : "",
    signature: typeof auth.signature === "string" ? auth.signature : "",
  });
  if (!authorized) {
    response.status(401).json({ error: "wallet_signature_required" });
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
  try {
    const created = await productStore.createIdempotent(parsed.data, idempotencyKey, requestHash);
    response.status(201).location(`/v1/products/${created.id}`).json(created);
  } catch (error) {
    if (error instanceof Error && error.message === "IDEMPOTENCY_KEY_CONFLICT") {
      response.status(409).json({ error: "idempotency_key_conflict" });
      return;
    }
    throw error;
  }
});
app.get("/v1/payments", async (_request, response) => {
  const payments = await paymentStore.list();
  response.json(payments.map((payment) => ({
    ...payment,
    explorerUrl: explorerUrl(payment.signature),
  })));
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
    response.json({
      product: configured.name,
      protected: true,
      message: "Pago x402 liquidado; conecta aquí el handler o upstream de tu API.",
      servedAt: new Date().toISOString(),
    });
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
    reconciler = new SolanaFinalityReconciler(
      postgres,
      process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com",
    );
    const pollMs = Math.max(Number(process.env.FINALITY_POLL_MS ?? 15_000), 5_000);
    const timer = setInterval(() => {
      reconciler?.reconcile().catch((error: unknown) => {
        console.error(JSON.stringify({ event: "finality_reconcile_failed", error: String(error) }));
      });
    }, pollMs);
    timer.unref();
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
