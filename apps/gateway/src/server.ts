import express from "express";
import { createHash, randomBytes } from "node:crypto";
import type { Express } from "express";
import {
  MemoryPaymentStore,
  SOLANA_DEVNET,
  SUBSCRIPTIONS_PROGRAM,
  explorerUrl,
  productSchema,
  type PaymentStore,
} from "@usemeterkit/core";
import { PostgresStore, type ProductStore } from "@usemeterkit/database";
import {
  createDynamicX402Middleware,
  createX402Middleware,
} from "@usemeterkit/sdk";
import { WalletChallenges } from "./wallet-auth.js";
import { SolanaFinalityReconciler } from "./finality.js";
import { loadGatewayConfig, requirePersistentMerchant } from "./config.js";
import {
  assertAllowedUpstream,
  fetchAllowedUpstream,
  parseUpstreamAllowlist,
} from "./upstream.js";
import { pilotEngagementFileSchema, verifyEndpoint } from "@usemeterkit/pilot";
import { rateLimit } from "express-rate-limit";
import { z } from "zod";
import { buildIdentity } from "./build-identity.js";
import { installHttpPolicy } from "./http-policy.js";
import { toHostedAuthorization } from "./authorization.js";
import {
  buildGitHubAuthorizationUrl,
  exchangeGitHubIdentity,
} from "./github-auth.js";

const app: Express = express();
const config = loadGatewayConfig();
const verifyRequestSchema = z.object({
  endpoint: z.string().url().max(2048),
});
// Deliberately far below the global 60/min: one call here is one outbound
// request that can occupy a socket for up to 15 seconds.
const verifyLimiter = rateLimit({
  windowMs: 60_000,
  limit: Number(process.env.VERIFY_RATE_LIMIT_PER_MINUTE ?? 6),
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: (_request, response, _next, options) => {
    response.status(options.statusCode).set("Cache-Control", "no-store").json({
      error: "rate_limit_exceeded",
      retryable: true,
      retryAfterSeconds: 60,
    });
  },
});
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
installHttpPolicy(app, config.trustProxyHops);

const product = config.product;

app.get("/health", (_request, response) =>
  response.json({
    status: "ok",
    network: SOLANA_DEVNET,
    custody: false,
    persistence: productStore ? "postgres" : "memory",
    ...buildIdentity(),
  }),
);
app.get("/v1/public/products", async (_request, response) => {
  response.json([product]);
});
app.get("/v1/products", async (request, response) => {
  const owner = await sessionOwner(request.header("authorization"));
  if (!owner) {
    response.status(401).json({ error: "wallet_session_required" });
    return;
  }
  response.json(
    productStore ? await productStore.listProductsForOwner(owner) : [],
  );
});
app.post("/v1/auth/session/challenge", async (request, response) => {
  const wallet =
    typeof request.body?.wallet === "string" ? request.body.wallet : "";
  if (wallet.length < 32 || wallet.length > 44) {
    response.status(422).json({ error: "invalid_wallet" });
    return;
  }
  const requestHash = createHash("sha256")
    .update(JSON.stringify({ wallet }))
    .digest("hex");
  const idempotencyKey = `session:${wallet}`;
  response.json(
    await walletChallenges.issue({
      wallet,
      requestHash,
      idempotencyKey,
      audience: config.publicGatewayUrl,
      method: "POST",
      path: "/v1/auth/session",
    }),
  );
});
app.post("/v1/auth/session", async (request, response) => {
  if (!productStore) {
    response.status(503).json({ error: "postgres_required" });
    return;
  }
  const wallet =
    typeof request.body?.wallet === "string" ? request.body.wallet : "";
  const auth = request.body?.auth as Record<string, unknown> | undefined;
  const requestHash = createHash("sha256")
    .update(JSON.stringify({ wallet }))
    .digest("hex");
  const idempotencyKey = `session:${wallet}`;
  const authorized =
    auth &&
    (await walletChallenges.verify({
      wallet,
      nonce: typeof auth.nonce === "string" ? auth.nonce : "",
      signedMessage:
        typeof auth.signedMessage === "string" ? auth.signedMessage : "",
      signature: typeof auth.signature === "string" ? auth.signature : "",
      requestHash,
      idempotencyKey,
    }));
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
app.get("/v1/auth/github", async (request, response) => {
  const owner = await sessionOwner(request.header("authorization"));
  if (!owner || !productStore) {
    response.status(401).json({ error: "wallet_session_required" });
    return;
  }
  response.set("Cache-Control", "no-store").json({
    configured: githubOAuthConfig() !== null,
    identity: await productStore.getGitHubIdentity(owner),
  });
});
app.post("/v1/auth/github/link", async (request, response) => {
  const owner = await sessionOwner(request.header("authorization"));
  const oauth = githubOAuthConfig();
  if (!owner || !productStore) {
    response.status(401).json({ error: "wallet_session_required" });
    return;
  }
  if (!oauth) {
    response.status(503).json({ error: "github_oauth_not_configured" });
    return;
  }
  const state = randomBytes(32).toString("base64url");
  await productStore.createOAuthLinkState(
    owner,
    hashToken(state),
    new Date(Date.now() + 10 * 60_000),
  );
  response.set("Cache-Control", "no-store").json({
    authorizationUrl: buildGitHubAuthorizationUrl({
      clientId: oauth.clientId,
      callbackUrl: oauth.callbackUrl,
      state,
    }),
  });
});
app.get("/v1/auth/github/callback", async (request, response) => {
  const oauth = githubOAuthConfig();
  const code = queryString(request.query.code);
  const state = queryString(request.query.state);
  if (
    !oauth ||
    !productStore ||
    !code ||
    !state ||
    code.length > 512 ||
    state.length > 128
  ) {
    response.redirect(303, `${dashboardUrl()}?github=error`);
    return;
  }
  const owner = await productStore.consumeOAuthLinkState(hashToken(state));
  if (!owner) {
    response.redirect(303, `${dashboardUrl()}?github=expired`);
    return;
  }
  try {
    const identity = await exchangeGitHubIdentity({
      clientId: oauth.clientId,
      clientSecret: oauth.clientSecret,
      callbackUrl: oauth.callbackUrl,
      code,
    });
    await productStore.linkGitHubIdentity(owner, identity);
    response.redirect(303, `${dashboardUrl()}?github=linked`);
  } catch {
    response.redirect(303, `${dashboardUrl()}?github=error`);
  }
});
app.post("/v1/auth/challenge", async (request, response) => {
  const wallet =
    typeof request.body?.wallet === "string" ? request.body.wallet : "";
  const parsed = productSchema.safeParse(request.body?.product);
  const idempotencyKey =
    typeof request.body?.idempotencyKey === "string"
      ? request.body.idempotencyKey
      : "";
  if (
    wallet.length < 32 ||
    wallet.length > 44 ||
    !parsed.success ||
    parsed.data.payTo !== wallet ||
    !/^[A-Za-z0-9._:-]{8,200}$/.test(idempotencyKey)
  ) {
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
  const requestHash = createHash("sha256")
    .update(JSON.stringify(parsed.data))
    .digest("hex");
  response.json(
    await walletChallenges.issue({
      wallet,
      requestHash,
      idempotencyKey,
      audience: config.publicGatewayUrl,
      method: "POST",
      path: "/v1/products",
    }),
  );
});
app.post("/v1/products", async (request, response) => {
  if (!productStore) {
    response.status(503).json({ error: "postgres_required" });
    return;
  }
  const parsed = productSchema.safeParse(request.body?.product);
  if (!parsed.success) {
    response
      .status(422)
      .json({ error: "invalid_product", issues: parsed.error.issues });
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
  const authorized =
    auth &&
    (await walletChallenges.verify({
      wallet: parsed.data.payTo,
      nonce: typeof auth.nonce === "string" ? auth.nonce : "",
      signedMessage:
        typeof auth.signedMessage === "string" ? auth.signedMessage : "",
      signature: typeof auth.signature === "string" ? auth.signature : "",
      requestHash,
      idempotencyKey,
    }));
  if (!authorized) {
    response.status(401).json({ error: "wallet_signature_required" });
    return;
  }
  try {
    const created = await productStore.createIdempotent(
      parsed.data,
      idempotencyKey,
      requestHash,
    );
    response
      .status(201)
      .location(
        `/v1/products/${encodeURIComponent(created.payTo)}/${created.id}`,
      )
      .json(created);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "IDEMPOTENCY_KEY_CONFLICT"
    ) {
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
  const publicProduct = await productStore?.getByOwnerSlug(
    product.payTo,
    product.id,
  );
  const payments =
    productStore && publicProduct
      ? await productStore.listPaymentsForProduct(publicProduct.uid)
      : await paymentStore.list();
  response.set("Cache-Control", "no-store");
  response.json(publicPayments(payments));
});
app.post("/v1/pilots/engagements", async (request, response) => {
  const owner = await sessionOwner(request.header("authorization"));
  if (!owner || !productStore) {
    response.status(401).json({ error: "wallet_session_required" });
    return;
  }
  const parsed = pilotEngagementFileSchema.safeParse(request.body?.engagement);
  if (!parsed.success) {
    response.status(422).json({
      error: "invalid_pilot_engagement",
      issues: parsed.error.issues,
    });
    return;
  }
  if (parsed.data.commercialPayments.length) {
    response
      .status(422)
      .json({ error: "private_commercial_evidence_rejected" });
    return;
  }
  try {
    await productStore.savePilotEngagement({
      ...parsed.data.engagement,
      ownerWallet: owner,
    });
    for (const intervention of parsed.data.interventions) {
      await productStore.saveSupportIntervention(intervention);
    }
    for (const event of parsed.data.events) {
      await productStore.appendActivationEvent(event);
    }
    for (const consent of parsed.data.consents) {
      await productStore.saveConsentGrant(consent);
    }
    for (const observation of parsed.data.retentionObservations) {
      await productStore.saveRetentionObservation(observation);
    }
    for (const willingness of parsed.data.willingnessToPay) {
      await productStore.saveWillingnessToPay(willingness);
    }
    response.status(202).set("Cache-Control", "no-store").json({
      engagementId: parsed.data.engagement.engagementId,
      status: "recorded",
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "PILOT_PRODUCT_OWNER_MISMATCH"
    ) {
      response.status(404).json({ error: "pilot_product_not_found" });
      return;
    }
    throw error;
  }
});
app.get("/v1/pilots/summary", async (request, response) => {
  const owner = await sessionOwner(request.header("authorization"));
  if (!owner || !productStore) {
    response.status(401).json({ error: "wallet_session_required" });
    return;
  }
  response
    .set("Cache-Control", "no-store")
    .json(await productStore.getPilotConversionSummary(owner));
});
// Readiness verification, hosted. The same check the pilot CLI runs, without
// asking a provider to clone the repository first.
//
// This makes the gateway an outbound HTTP client on caller-supplied input, so
// it carries its own limiter rather than relying on the global one: each call
// costs an outbound request with a 15s ceiling. verifyEndpoint already refuses
// credentials in the URL, non-https public endpoints, and hostnames resolving
// to loopback, private, link-local or reserved addresses; allowLocalhost stays
// off here, which the CLI only enables for local development.
app.post(
  "/v1/pilot/verify",
  // Validation runs before the limiter on purpose: the budget exists to bound
  // outbound requests, so a mistyped URL should not spend it.
  (request, response, next) => {
    const parsed = verifyRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      response
        .status(400)
        .json({ error: "invalid_endpoint", retryable: false });
      return;
    }
    response.locals.endpoint = parsed.data.endpoint;
    next();
  },
  verifyLimiter,
  async (_request, response) => {
    response.set("Cache-Control", "no-store");
    try {
      // A refused address still answers with a report. verifyEndpoint rejects it
      // in parseEndpoint before any request leaves the process, and naming the
      // reason helps a provider more than a bare status would.
      response.json(await verifyEndpoint(response.locals.endpoint as string));
    } catch (cause) {
      response.status(502).json({
        error: "verification_failed",
        retryable: true,
        detail: cause instanceof Error ? cause.message : "endpoint unreachable",
      });
    }
  },
);
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
  response
    .set("Cache-Control", "no-store")
    .json(
      (await productStore.listAllowancesForOwner(owner)).map(
        toHostedAuthorization,
      ),
    );
});
app.get("/v1/allowances/export", async (request, response) => {
  const result = await exportHostedAllowanceMetadata(
    request.header("authorization"),
    productStore,
    sessionOwner,
  );
  response
    .set("Cache-Control", "no-store")
    .status(result.status)
    .json(result.body);
});
app.get("/v1/allowances/:address", async (request, response) => {
  const owner = await sessionOwner(request.header("authorization"));
  const allowanceAddress = singleParam(request.params.address);
  if (!owner || !productStore) {
    response.status(401).json({ error: "wallet_session_required" });
    return;
  }
  if (!allowanceAddress) {
    response.status(422).json({ error: "invalid_allowance_address" });
    return;
  }
  const allowance = await productStore.getAllowanceForOwner(
    owner,
    allowanceAddress,
  );
  response
    .status(allowance ? 200 : 404)
    .json(
      allowance
        ? toHostedAuthorization(allowance)
        : { error: "allowance_not_found" },
    );
});
app.delete("/v1/allowances/:address/metadata", async (request, response) => {
  const allowanceAddress = singleParam(request.params.address);
  const result = await deleteHostedAllowanceMetadata(
    request.header("authorization"),
    allowanceAddress,
    productStore,
    sessionOwner,
  );
  response.status(result.status).end();
});
app.post("/v1/allowances", async (request, response) => {
  const owner = await sessionOwner(request.header("authorization"));
  if (!owner || !productStore) {
    response.status(401).json({ error: "wallet_session_required" });
    return;
  }
  const body = request.body as Record<string, unknown>;
  const maxAtomic =
    typeof body.maxAtomic === "string" && /^[1-9]\d*$/.test(body.maxAtomic)
      ? BigInt(body.maxAtomic)
      : 0n;
  const expiresAt =
    typeof body.expiresAt === "string"
      ? new Date(body.expiresAt)
      : new Date(NaN);
  const validAddress = (value: unknown) =>
    typeof value === "string" && /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value);
  if (
    !validAddress(body.address) ||
    !validAddress(body.delegateWallet) ||
    body.mint !== config.product.assetMint ||
    maxAtomic <= 0n ||
    maxAtomic > 100_000_000n ||
    !Number.isFinite(expiresAt.getTime()) ||
    expiresAt <= new Date() ||
    expiresAt.getTime() > Date.now() + 90 * 86_400_000 ||
    typeof body.signature !== "string" ||
    !/^[1-9A-HJ-NP-Za-km-z]{64,88}$/.test(body.signature)
  ) {
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
    perRequestAtomic: String(maxAtomic),
    recipientScope: config.product.payTo,
    resourceScopes: [config.product.resource],
    startsAt: new Date().toISOString(),
    observedCommitment: "finalized",
    observedAt: new Date().toISOString(),
    status: "active",
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
    ? request.params.address[0]
    : request.params.address;
  if (
    !allowanceAddress ||
    !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(allowanceAddress)
  ) {
    response.status(422).json({ error: "invalid_allowance_address" });
    return;
  }
  const signature =
    typeof request.body?.signature === "string" ? request.body.signature : "";
  if (
    !/^[1-9A-HJ-NP-Za-km-z]{64,88}$/.test(signature) ||
    !(await verifyRevocationReceipt({
      signature,
      owner,
      delegationAccount: allowanceAddress,
    }))
  ) {
    response.status(422).json({ error: "revocation_receipt_not_verified" });
    return;
  }
  const changed = await productStore.revokeAllowance(
    owner,
    allowanceAddress,
    signature,
  );
  response.status(changed ? 200 : 404).json({
    status: changed ? "revoked" : "allowance_not_found",
  });
});
app.post(
  "/v1/allowances/:address/revocation-pending",
  async (request, response) => {
    const owner = await sessionOwner(request.header("authorization"));
    const allowanceAddress = singleParam(request.params.address);
    if (!owner || !productStore) {
      response.status(401).json({ error: "wallet_session_required" });
      return;
    }
    const changed = allowanceAddress
      ? await productStore.beginAllowanceRevocation(owner, allowanceAddress)
      : false;
    response.status(changed ? 202 : 409).json({
      status: changed ? "revocation_pending" : "revocation_not_started",
    });
  },
);
app.get(
  "/v1/weather/premium",
  createX402Middleware({
    product,
    store: paymentStore,
    facilitatorUrl:
      process.env.X402_FACILITATOR_URL ?? "https://x402.org/facilitator",
    rpcUrl: process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com",
  }),
  (request, response) => {
    const city =
      typeof request.query.city === "string"
        ? request.query.city
        : "Buenos Aires";
    response.json({
      city,
      summary:
        "Datos de demostración: conecte un proveedor meteorológico permitido para producción.",
      temperatureC: 21,
      observedAt: new Date().toISOString(),
      receipt: "See PAYMENT-RESPONSE header after settlement",
    });
  },
);
app.get(
  ["/v1/products/:owner/:slug/proxy", "/v1/products/:id/proxy"],
  createDynamicX402Middleware({
    resolveProduct: resolveScopedProduct,
    store: paymentStore,
    facilitatorUrl:
      process.env.X402_FACILITATOR_URL ?? "https://x402.org/facilitator",
    rpcUrl: process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com",
  }),
  async (request, response) => {
    const owner = singleParam(request.params.owner);
    const slug =
      singleParam(request.params.slug) ?? singleParam(request.params.id);
    if (!slug) {
      response.status(404).json({ error: "product_not_found" });
      return;
    }
    const configured = await resolveScopedProduct({
      owner: owner ?? null,
      slug,
    });
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
        clientQuery: new URL(request.originalUrl, config.publicGatewayUrl)
          .searchParams,
        allowedHosts: upstreamHosts,
      });
      response
        .status(upstream.status)
        .set("Content-Type", upstream.contentType)
        .set("X-MeterKit-Upstream", new URL(upstream.sourceUrl).hostname)
        .send(Buffer.from(upstream.body));
    } catch (error) {
      console.error(
        JSON.stringify({
          event: "upstream_request_failed",
          productId: configured.id,
          error: error instanceof Error ? error.message : "unknown",
        }),
      );
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
    reconciler = new SolanaFinalityReconciler(postgres, [
      process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com",
      ...(process.env.SOLANA_RPC_FALLBACK_URL
        ? [process.env.SOLANA_RPC_FALLBACK_URL]
        : []),
    ]);
    const pollMs = Math.max(
      Number(process.env.FINALITY_POLL_MS ?? 15_000),
      5_000,
    );
    const timer = setInterval(() => {
      reconciler?.reconcile().catch((error: unknown) => {
        console.error(
          JSON.stringify({
            event: "finality_reconcile_failed",
            error: String(error),
          }),
        );
      });
    }, pollMs);
    timer.unref();
    const cleanupTimer = setInterval(() => {
      postgres.cleanupExpired().catch((error: unknown) => {
        console.error(
          JSON.stringify({
            event: "expired_data_cleanup_failed",
            error: String(error),
          }),
        );
      });
    }, 60 * 60_000);
    cleanupTimer.unref();
  }
  return app.listen(config.port, () =>
    console.log(
      JSON.stringify({
        event: "gateway_started",
        port: config.port,
        publicUrl: config.publicGatewayUrl,
        network: "devnet",
        persistence: productStore ? "postgres" : "memory",
      }),
    ),
  );
}
if (process.env.NODE_ENV !== "test") {
  start().catch((error: unknown) => {
    console.error(
      JSON.stringify({ event: "gateway_start_failed", error: String(error) }),
    );
    process.exitCode = 1;
  });
}
export { app, product, start };

export async function exportHostedAllowanceMetadata(
  authorization: string | undefined,
  hostedStore: ProductStore | undefined,
  resolveOwner: (authorization: string | undefined) => Promise<string | null>,
  now: () => Date = () => new Date(),
) {
  const owner = await resolveOwner(authorization);
  if (!owner || !hostedStore) {
    return { status: 401 as const, body: { error: "wallet_session_required" } };
  }
  return {
    status: 200 as const,
    body: {
      schemaVersion: 1 as const,
      exportedAt: now().toISOString(),
      authorizations: (await hostedStore.listAllowancesForOwner(owner)).map(
        toHostedAuthorization,
      ),
    },
  };
}

export async function deleteHostedAllowanceMetadata(
  authorization: string | undefined,
  allowanceAddress: string | undefined,
  hostedStore: ProductStore | undefined,
  resolveOwner: (authorization: string | undefined) => Promise<string | null>,
) {
  const owner = await resolveOwner(authorization);
  if (!owner || !hostedStore) return { status: 401 as const };
  if (!allowanceAddress) return { status: 404 as const };
  const deleted = await hostedStore.deleteAllowanceMetadata(
    owner,
    allowanceAddress,
  );
  return { status: deleted ? (204 as const) : (404 as const) };
}

async function resolveScopedProduct(scope: {
  owner: string | null;
  slug: string;
}) {
  if (productStore) {
    const configured = scope.owner
      ? await productStore.getByOwnerSlug(scope.owner, scope.slug)
      : await productStore.getUniqueBySlug(scope.slug);
    if (configured) return configured;
  }
  return scope.slug === product.id &&
    (!scope.owner || scope.owner === product.payTo)
    ? product
    : null;
}

function singleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function queryString(value: unknown) {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return undefined;
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function githubOAuthConfig() {
  const clientId = process.env.GITHUB_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GITHUB_OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  return {
    clientId,
    clientSecret,
    callbackUrl:
      process.env.GITHUB_OAUTH_CALLBACK_URL ??
      `${config.publicGatewayUrl}/v1/auth/github/callback`,
  };
}

function dashboardUrl() {
  const candidate = new URL(
    process.env.PUBLIC_DASHBOARD_URL ?? "http://127.0.0.1:3100/dashboard",
  );
  const local = ["localhost", "127.0.0.1"].includes(candidate.hostname);
  if (
    (candidate.protocol !== "https:" &&
      !(local && candidate.protocol === "http:")) ||
    candidate.username ||
    candidate.password
  )
    return "http://127.0.0.1:3100/dashboard";
  candidate.search = "";
  candidate.hash = "";
  return candidate.toString().replace(/\/$/, "");
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
    const rpcUrl =
      process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com";
    const rpcResponse = await fetch(rpcUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      signal: AbortSignal.timeout(10_000),
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: crypto.randomUUID(),
        method: "getTransaction",
        params: [
          input.signature,
          {
            commitment: "finalized",
            encoding: "jsonParsed",
            maxSupportedTransactionVersion: 0,
          },
        ],
      }),
    });
    if (!rpcResponse.ok) return false;
    const body = (await rpcResponse.json()) as {
      result?: {
        meta?: { err?: unknown };
        transaction?: {
          message?: { accountKeys?: Array<string | { pubkey?: string }> };
        };
      } | null;
    };
    if (!body.result || body.result.meta?.err != null) return false;
    const keys = new Set(
      (body.result.transaction?.message?.accountKeys ?? [])
        .map((key) => (typeof key === "string" ? key : key.pubkey))
        .filter((key): key is string => Boolean(key)),
    );
    return [
      input.owner,
      input.delegationAccount,
      input.delegate,
      input.mint,
      SUBSCRIPTIONS_PROGRAM,
    ].every((key) => keys.has(key));
  } catch {
    return false;
  }
}

async function verifyRevocationReceipt(input: {
  signature: string;
  owner: string;
  delegationAccount: string;
}) {
  try {
    const rpcResponse = await fetch(
      process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        signal: AbortSignal.timeout(10_000),
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: crypto.randomUUID(),
          method: "getTransaction",
          params: [
            input.signature,
            {
              commitment: "finalized",
              encoding: "jsonParsed",
              maxSupportedTransactionVersion: 0,
            },
          ],
        }),
      },
    );
    if (!rpcResponse.ok) return false;
    const body = (await rpcResponse.json()) as {
      result?: {
        meta?: { err?: unknown };
        transaction?: {
          message?: { accountKeys?: Array<string | { pubkey?: string }> };
        };
      } | null;
    };
    if (!body.result || body.result.meta?.err != null) return false;
    const keys = new Set(
      (body.result.transaction?.message?.accountKeys ?? [])
        .map((key) => (typeof key === "string" ? key : key.pubkey))
        .filter((key): key is string => Boolean(key)),
    );
    return [input.owner, input.delegationAccount, SUBSCRIPTIONS_PROGRAM].every(
      (key) => keys.has(key),
    );
  } catch {
    return false;
  }
}
