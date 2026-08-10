import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import pg from "pg";
import {
  benchmarkRunSchema,
  paymentRecordSchema,
  publicReleaseSchema,
  publicPaymentReceiptSchema,
  persistedProductSchema,
  productSchema,
  type BenchmarkRun,
  type PaymentRecord,
  type PaymentStore,
  type PublicPaymentReceipt,
  type PersistedProduct,
  type Product,
  type PublicRelease,
} from "@usemeterkit/core";

const { Pool } = pg;

export interface ProductStore {
  create(product: Product): Promise<PersistedProduct>;
  createIdempotent(
    product: Product,
    key: string,
    requestHash: string,
  ): Promise<PersistedProduct>;
  getByUid(uid: string): Promise<PersistedProduct | null>;
  getByOwnerSlug(
    ownerWallet: string,
    slug: string,
  ): Promise<PersistedProduct | null>;
  getUniqueBySlug(slug: string): Promise<PersistedProduct | null>;
  listProducts(): Promise<readonly PersistedProduct[]>;
  listProductsForOwner(
    ownerWallet: string,
  ): Promise<readonly PersistedProduct[]>;
  listPaymentsForOwner(ownerWallet: string): Promise<readonly PaymentRecord[]>;
  listPaymentsForProduct(productId: string): Promise<readonly PaymentRecord[]>;
  createSession(
    tokenHash: string,
    ownerWallet: string,
    expiresAt: Date,
  ): Promise<void>;
  getSessionOwner(tokenHash: string): Promise<string | null>;
  saveWalletChallenge(
    challenge: WalletChallengeRecord,
    maxActive: number,
  ): Promise<void>;
  consumeWalletChallenge(
    nonceHash: string,
  ): Promise<WalletChallengeRecord | null>;
  cleanupExpired(now?: Date): Promise<{
    challenges: number;
    sessions: number;
    idempotencyKeys: number;
    metadataRequests: number;
    oauthLinkStates: number;
    allowanceReservations: number;
  }>;
  saveAllowance(allowance: AgentAllowanceRecord): Promise<void>;
  listAllowancesForOwner(
    ownerWallet: string,
  ): Promise<readonly AgentAllowanceRecord[]>;
  revokeAllowance(
    ownerWallet: string,
    address: string,
    revocationSignature?: string,
  ): Promise<boolean>;
  getAllowanceForOwner(
    ownerWallet: string,
    address: string,
  ): Promise<AgentAllowanceRecord | null>;
  deleteAllowanceMetadata(
    ownerWallet: string,
    address: string,
  ): Promise<boolean>;
  reserveAllowanceSpend(
    input: AllowanceSpendReservationInput,
  ): Promise<AllowanceSpendReservation>;
  consumeAllowanceSpend(reservationId: string): Promise<boolean>;
  releaseAllowanceSpend(reservationId: string): Promise<boolean>;
  beginAllowanceRevocation(
    ownerWallet: string,
    address: string,
  ): Promise<boolean>;
  setAllowanceObservationStatus(
    address: string,
    status: "active" | "unknown" | "failed",
  ): Promise<boolean>;
  createOAuthLinkState(
    ownerWallet: string,
    stateHash: string,
    expiresAt: Date,
  ): Promise<void>;
  consumeOAuthLinkState(stateHash: string): Promise<string | null>;
  linkGitHubIdentity(
    ownerWallet: string,
    identity: GitHubIdentityRecord,
  ): Promise<void>;
  getGitHubIdentity(ownerWallet: string): Promise<GitHubIdentityRecord | null>;
}

export type WalletChallengeRecord = {
  nonceHash: string;
  wallet: string;
  message: string;
  requestHash: string;
  idempotencyKey: string;
  expiresAt: Date;
};

export type AgentAllowanceRecord = {
  address: string;
  ownerWallet: string;
  delegateWallet: string;
  mint: string;
  maxAtomic: string;
  expiresAt: string;
  revokedAt: string | null;
  signature: string | null;
  perRequestAtomic?: string;
  spentAtomic?: string;
  reservedAtomic?: string;
  status?:
    | "pending"
    | "active"
    | "exhausted"
    | "expired"
    | "revocation_pending"
    | "revoked"
    | "unknown"
    | "failed";
  recipientScope?: string | null;
  resourceScopes?: string[];
  startsAt?: string;
  observedCommitment?: "processed" | "confirmed" | "finalized" | "unknown";
  observedAt?: string;
  revocationSignature?: string | null;
};

export type AllowanceSpendReservationInput = {
  reservationId: string;
  allowanceAddress: string;
  paymentKey: string;
  amountAtomic: string;
  expiresAt: Date;
};

export type AllowanceSpendReservation = AllowanceSpendReservationInput & {
  status: "reserved" | "consumed" | "released";
};

export type GitHubIdentityRecord = {
  subject: string;
  login: string;
  avatarUrl: string | null;
  linkedAt: string;
};

export interface FinalityStore {
  listConfirmedSignatures(limit?: number): Promise<readonly string[]>;
  markFinalized(signature: string): Promise<boolean>;
  markFailed(signature: string): Promise<boolean>;
}

export interface ReceiptStore {
  savePublicReceipt(receipt: PublicPaymentReceipt): Promise<void>;
  getPublicReceipt(receiptId: string): Promise<PublicPaymentReceipt | null>;
}

export type HostedMetadataRequest = {
  requestId: string;
  ownerWallet: string;
  requestKind: "export" | "delete";
  status: "queued" | "completed" | "failed";
  requestedAt: string;
  expiresAt: string;
};

export interface WorldClassEvidenceStore {
  saveReleaseManifest(manifest: PublicRelease): Promise<void>;
  getReleaseManifest(version: string): Promise<PublicRelease | null>;
  saveBenchmarkRun(run: BenchmarkRun): Promise<void>;
  listBenchmarkRuns(sourceCommit: string): Promise<readonly BenchmarkRun[]>;
  createHostedMetadataRequest(
    ownerWallet: string,
    requestKind: HostedMetadataRequest["requestKind"],
    expiresAt: Date,
  ): Promise<HostedMetadataRequest>;
  listHostedMetadataRequests(
    ownerWallet: string,
  ): Promise<readonly HostedMetadataRequest[]>;
}

export class PostgresStore
  implements
    PaymentStore,
    ProductStore,
    FinalityStore,
    ReceiptStore,
    WorldClassEvidenceStore
{
  constructor(readonly pool: pg.Pool) {}

  static connect(connectionString: string) {
    return new PostgresStore(
      new Pool({
        connectionString,
        max: 10,
        connectionTimeoutMillis: 5_000,
        idleTimeoutMillis: 30_000,
      }),
    );
  }

  async migrate() {
    for (const name of [
      "001_init.sql",
      "002_product_tenant_identity.sql",
      "003_policy_receipts.sql",
      "004_world_class_evidence.sql",
      "005_authorization_reservations.sql",
      "006_linked_identities.sql",
    ]) {
      const migration = await readFile(
        fileURLToPath(new URL(`../migrations/${name}`, import.meta.url)),
        "utf8",
      );
      await this.pool.query(migration);
    }
  }

  async has(signature: string) {
    const result = await this.pool.query<{ exists: boolean }>(
      "SELECT EXISTS(SELECT 1 FROM payments WHERE network = $1 AND signature = $2) AS exists",
      ["solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1", signature],
    );
    return result.rows[0]?.exists ?? false;
  }

  async save(record: PaymentRecord) {
    const value = paymentRecordSchema.parse(record);
    try {
      await this.pool.query(
        `INSERT INTO payments
          (id, product_id, product_uid, payer, pay_to, mint, amount_atomic, network, signature, status, settled_at)
         VALUES ($1,$2,
           (SELECT uid FROM products WHERE owner_wallet=$4 AND id=$2),
           $3,$4,$5,$6,$7,$8,$9,$10)`,
        [
          value.id,
          value.productId,
          value.payer,
          value.payTo,
          value.mint,
          value.amountAtomic,
          value.network,
          value.signature,
          "confirmed",
          value.settledAt,
        ],
      );
    } catch (error) {
      if (isUniqueViolation(error)) throw new Error("PAYMENT_REPLAYED");
      throw error;
    }
  }

  async list() {
    const result = await this.pool.query(
      `SELECT id, product_id, payer, pay_to, mint, amount_atomic::text, network,
              signature, settled_at, status
       FROM payments ORDER BY settled_at DESC LIMIT 200`,
    );
    return result.rows.map(mapPayment);
  }

  async listConfirmedSignatures(limit = 100) {
    const result = await this.pool.query<{ signature: string }>(
      `SELECT signature FROM payments
       WHERE network=$1 AND status='confirmed'
       ORDER BY settled_at ASC LIMIT $2`,
      [SOLANA_DEVNET_NETWORK, Math.min(Math.max(limit, 1), 256)],
    );
    return result.rows.map((row) => row.signature);
  }

  async markFinalized(signature: string) {
    const result = await this.pool.query(
      `UPDATE payments SET status='finalized'
       WHERE network=$1 AND signature=$2 AND status='confirmed'`,
      [SOLANA_DEVNET_NETWORK, signature],
    );
    return (result.rowCount ?? 0) > 0;
  }

  async markFailed(signature: string) {
    const result = await this.pool.query(
      `UPDATE payments SET status='failed'
       WHERE network=$1 AND signature=$2 AND status='confirmed'`,
      [SOLANA_DEVNET_NETWORK, signature],
    );
    return (result.rowCount ?? 0) > 0;
  }

  async savePublicReceipt(receipt: PublicPaymentReceipt) {
    const value = publicPaymentReceiptSchema.parse(receipt);
    const result = await this.pool.query(
      `INSERT INTO public_payment_receipts
        (receipt_id, product_id, network, asset_mint, amount_atomic, recipient,
         payer, resource_url, decision, settlement, signature_fingerprint,
         explorer_url, policy_decisions, reason_code, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb,$14,$15,$16)
       ON CONFLICT (receipt_id) DO UPDATE SET
         decision=EXCLUDED.decision, settlement=EXCLUDED.settlement,
         signature_fingerprint=EXCLUDED.signature_fingerprint,
         explorer_url=EXCLUDED.explorer_url,
         policy_decisions=EXCLUDED.policy_decisions,
         reason_code=EXCLUDED.reason_code, updated_at=EXCLUDED.updated_at
       WHERE public_payment_receipts.product_id=EXCLUDED.product_id
         AND public_payment_receipts.network=EXCLUDED.network
         AND public_payment_receipts.asset_mint=EXCLUDED.asset_mint
         AND public_payment_receipts.amount_atomic=EXCLUDED.amount_atomic
         AND public_payment_receipts.recipient=EXCLUDED.recipient
         AND public_payment_receipts.resource_url=EXCLUDED.resource_url
         AND (public_payment_receipts.settlement NOT IN ('finalized','failed')
              OR public_payment_receipts.settlement=EXCLUDED.settlement)
         AND (public_payment_receipts.settlement NOT IN ('confirmed')
              OR EXCLUDED.settlement IN ('confirmed','finalized','failed'))
         AND public_payment_receipts.updated_at <= EXCLUDED.updated_at`,
      [
        value.receiptId,
        value.productId,
        value.network,
        value.assetMint,
        value.amountAtomic,
        value.recipient,
        value.payer ?? null,
        value.resource,
        value.decision,
        value.settlement,
        value.signatureFingerprint ?? null,
        value.explorerUrl ?? null,
        JSON.stringify(value.policyDecisions),
        value.reasonCode,
        value.createdAt,
        value.updatedAt,
      ],
    );
    if ((result.rowCount ?? 0) !== 1)
      throw new Error("RECEIPT_TRANSITION_REJECTED");
  }

  async getPublicReceipt(receiptId: string) {
    const result = await this.pool.query(
      `SELECT * FROM public_payment_receipts WHERE receipt_id=$1`,
      [receiptId],
    );
    return result.rows[0] ? mapPublicReceipt(result.rows[0]) : null;
  }

  async saveReleaseManifest(manifest: PublicRelease) {
    const value = publicReleaseSchema.parse(manifest);
    const result = await this.pool.query(
      `INSERT INTO release_manifests (version, source_commit, manifest)
       VALUES ($1,$2,$3::jsonb) ON CONFLICT (version) DO NOTHING`,
      [value.version, value.sourceCommit, JSON.stringify(value)],
    );
    if ((result.rowCount ?? 0) !== 1) {
      throw new Error("RELEASE_MANIFEST_IMMUTABLE");
    }
  }

  async getReleaseManifest(version: string) {
    const result = await this.pool.query<{ manifest: unknown }>(
      "SELECT manifest FROM release_manifests WHERE version=$1",
      [version],
    );
    return result.rows[0]
      ? publicReleaseSchema.parse(result.rows[0].manifest)
      : null;
  }

  async saveBenchmarkRun(run: BenchmarkRun) {
    const value = benchmarkRunSchema.parse(run);
    const result = await this.pool.query(
      `INSERT INTO benchmark_runs (run_id, source_commit, scenario, evidence)
       VALUES ($1,$2,$3,$4::jsonb) ON CONFLICT (run_id) DO NOTHING`,
      [
        value.runId,
        value.sourceCommit,
        value.workload.scenario,
        JSON.stringify(value),
      ],
    );
    if ((result.rowCount ?? 0) !== 1)
      throw new Error("BENCHMARK_RUN_IMMUTABLE");
  }

  async listBenchmarkRuns(sourceCommit: string) {
    const result = await this.pool.query<{ evidence: unknown }>(
      `SELECT evidence FROM benchmark_runs
       WHERE source_commit=$1 ORDER BY created_at DESC LIMIT 100`,
      [sourceCommit],
    );
    return result.rows.map((row) => benchmarkRunSchema.parse(row.evidence));
  }

  async createHostedMetadataRequest(
    ownerWallet: string,
    requestKind: HostedMetadataRequest["requestKind"],
    expiresAt: Date,
  ) {
    if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(ownerWallet)) {
      throw new Error("INVALID_OWNER_WALLET");
    }
    if (!(["export", "delete"] as const).includes(requestKind)) {
      throw new Error("INVALID_METADATA_REQUEST_KIND");
    }
    if (expiresAt.getTime() <= Date.now()) {
      throw new Error("INVALID_METADATA_REQUEST_EXPIRY");
    }
    const requestId = crypto.randomUUID();
    const result = await this.pool.query(
      `INSERT INTO hosted_metadata_requests
        (request_id, owner_wallet, request_kind, expires_at)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [requestId, ownerWallet, requestKind, expiresAt],
    );
    return mapHostedMetadataRequest(result.rows[0]);
  }

  async listHostedMetadataRequests(ownerWallet: string) {
    const result = await this.pool.query(
      `SELECT * FROM hosted_metadata_requests
       WHERE owner_wallet=$1 AND expires_at > now()
       ORDER BY requested_at DESC LIMIT 100`,
      [ownerWallet],
    );
    return result.rows.map(mapHostedMetadataRequest);
  }

  async create(product: Product) {
    const value = productSchema.parse(product);
    const result = await this.pool.query(
      `INSERT INTO products
          (id, owner_wallet, name, description, resource_url, upstream_url, network, asset_mint, pay_to, price_atomic)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         ON CONFLICT (owner_wallet, id) DO UPDATE SET
           name=EXCLUDED.name, description=EXCLUDED.description,
           resource_url=EXCLUDED.resource_url, upstream_url=EXCLUDED.upstream_url,
           price_atomic=EXCLUDED.price_atomic
         WHERE products.owner_wallet=EXCLUDED.owner_wallet
         RETURNING *`,
      [
        value.id,
        value.payTo,
        value.name,
        value.description,
        value.resource,
        value.upstreamUrl ?? null,
        value.network,
        value.assetMint,
        value.payTo,
        value.priceAtomic,
      ],
    );
    if (!result.rows[0]) throw new Error("PRODUCT_OWNER_CONFLICT");
    return mapProduct(result.rows[0]);
  }

  async createIdempotent(product: Product, key: string, requestHash: string) {
    const value = productSchema.parse(product);
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const inserted = await client.query(
        `INSERT INTO idempotency_keys (key, request_hash, expires_at)
         VALUES ($1,$2,now() + interval '24 hours')
         ON CONFLICT (key) DO NOTHING`,
        [key, requestHash],
      );
      if (inserted.rowCount === 0) {
        const existing = await client.query<{
          request_hash: string;
          response_body: Product | null;
        }>(
          `SELECT request_hash, response_body FROM idempotency_keys
           WHERE key=$1 FOR UPDATE`,
          [key],
        );
        const row = existing.rows[0];
        if (!row || row.request_hash !== requestHash)
          throw new Error("IDEMPOTENCY_KEY_CONFLICT");
        if (!row.response_body)
          throw new Error("IDEMPOTENCY_REQUEST_INCOMPLETE");
        await client.query("COMMIT");
        return persistedProductSchema.parse(row.response_body);
      }
      const result = await client.query(
        `INSERT INTO products
          (id, owner_wallet, name, description, resource_url, upstream_url, network, asset_mint, pay_to, price_atomic)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         ON CONFLICT (owner_wallet, id) DO UPDATE SET
           name=EXCLUDED.name, description=EXCLUDED.description,
           resource_url=EXCLUDED.resource_url, upstream_url=EXCLUDED.upstream_url,
           price_atomic=EXCLUDED.price_atomic
         WHERE products.owner_wallet=EXCLUDED.owner_wallet
         RETURNING *`,
        [
          value.id,
          value.payTo,
          value.name,
          value.description,
          value.resource,
          value.upstreamUrl ?? null,
          value.network,
          value.assetMint,
          value.payTo,
          value.priceAtomic,
        ],
      );
      if (!result.rows[0]) throw new Error("PRODUCT_OWNER_CONFLICT");
      const created = mapProduct(result.rows[0]);
      await client.query(
        `UPDATE idempotency_keys SET response_code=201, response_body=$2::jsonb WHERE key=$1`,
        [key, JSON.stringify(created)],
      );
      await client.query("COMMIT");
      return created;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async getByUid(uid: string) {
    const result = await this.pool.query(
      "SELECT * FROM products WHERE uid=$1",
      [uid],
    );
    return result.rows[0] ? mapProduct(result.rows[0]) : null;
  }

  async getByOwnerSlug(ownerWallet: string, slug: string) {
    const result = await this.pool.query(
      "SELECT * FROM products WHERE owner_wallet=$1 AND id=$2",
      [ownerWallet, slug],
    );
    return result.rows[0] ? mapProduct(result.rows[0]) : null;
  }

  async getUniqueBySlug(slug: string) {
    const result = await this.pool.query(
      "SELECT * FROM products WHERE id=$1 ORDER BY created_at ASC LIMIT 2",
      [slug],
    );
    return result.rows.length === 1 && result.rows[0]
      ? mapProduct(result.rows[0])
      : null;
  }

  async listProducts() {
    const result = await this.pool.query(
      "SELECT * FROM products ORDER BY created_at DESC",
    );
    return result.rows.map(mapProduct);
  }

  async listProductsForOwner(ownerWallet: string) {
    const result = await this.pool.query(
      "SELECT * FROM products WHERE owner_wallet=$1 ORDER BY created_at DESC",
      [ownerWallet],
    );
    return result.rows.map(mapProduct);
  }

  async listPaymentsForOwner(ownerWallet: string) {
    const result = await this.pool.query(
      `SELECT p.id, p.product_id, p.payer, p.pay_to, p.mint,
              p.amount_atomic::text, p.network, p.signature, p.settled_at, p.status
       FROM payments p JOIN products product ON product.uid=p.product_uid
       WHERE product.owner_wallet=$1 ORDER BY p.settled_at DESC LIMIT 200`,
      [ownerWallet],
    );
    return result.rows.map(mapPayment);
  }

  async listPaymentsForProduct(productUid: string) {
    const result = await this.pool.query(
      `SELECT id, product_id, payer, pay_to, mint, amount_atomic::text, network,
              signature, settled_at, status
       FROM payments WHERE product_uid=$1 ORDER BY settled_at DESC LIMIT 200`,
      [productUid],
    );
    return result.rows.map(mapPayment);
  }

  async createSession(tokenHash: string, ownerWallet: string, expiresAt: Date) {
    await this.pool.query(
      `INSERT INTO wallet_sessions (token_hash, owner_wallet, expires_at)
       VALUES ($1,$2,$3)
       ON CONFLICT (token_hash) DO NOTHING`,
      [tokenHash, ownerWallet, expiresAt],
    );
  }

  async getSessionOwner(tokenHash: string) {
    const result = await this.pool.query<{ owner_wallet: string }>(
      `SELECT owner_wallet FROM wallet_sessions
       WHERE token_hash=$1 AND expires_at > now()`,
      [tokenHash],
    );
    return result.rows[0]?.owner_wallet ?? null;
  }

  async saveWalletChallenge(
    challenge: WalletChallengeRecord,
    maxActive: number,
  ) {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        "SELECT pg_advisory_xact_lock(hashtextextended($1, 0))",
        [challenge.wallet],
      );
      await client.query(
        "DELETE FROM wallet_challenges WHERE wallet=$1 AND expires_at <= now()",
        [challenge.wallet],
      );
      const active = await client.query<{ count: string }>(
        `SELECT count(*)::text AS count FROM wallet_challenges
         WHERE wallet=$1 AND expires_at > now()`,
        [challenge.wallet],
      );
      if (Number(active.rows[0]?.count ?? 0) >= maxActive) {
        throw new Error("TOO_MANY_ACTIVE_CHALLENGES");
      }
      await client.query(
        `INSERT INTO wallet_challenges
          (nonce_hash, wallet, message, request_hash, idempotency_key, expires_at)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [
          challenge.nonceHash,
          challenge.wallet,
          challenge.message,
          challenge.requestHash,
          challenge.idempotencyKey,
          challenge.expiresAt,
        ],
      );
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async consumeWalletChallenge(nonceHash: string) {
    const result = await this.pool.query(
      `DELETE FROM wallet_challenges
       WHERE nonce_hash=$1
       RETURNING nonce_hash, wallet, message, request_hash, idempotency_key, expires_at`,
      [nonceHash],
    );
    const row = result.rows[0] as Record<string, unknown> | undefined;
    return row
      ? {
          nonceHash: String(row.nonce_hash),
          wallet: String(row.wallet),
          message: String(row.message),
          requestHash: String(row.request_hash),
          idempotencyKey: String(row.idempotency_key),
          expiresAt: new Date(row.expires_at as string | Date),
        }
      : null;
  }

  async cleanupExpired(now = new Date()) {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const challenges = await client.query(
        "DELETE FROM wallet_challenges WHERE expires_at <= $1",
        [now],
      );
      const sessions = await client.query(
        "DELETE FROM wallet_sessions WHERE expires_at <= $1",
        [now],
      );
      const idempotencyKeys = await client.query(
        "DELETE FROM idempotency_keys WHERE expires_at <= $1",
        [now],
      );
      const metadataRequests = await client.query(
        "DELETE FROM hosted_metadata_requests WHERE expires_at <= $1",
        [now],
      );
      const oauthLinkStates = await client.query(
        "DELETE FROM oauth_link_states WHERE expires_at <= $1",
        [now],
      );
      const expiredReservations = await client.query<{
        reservation_id: string;
        allowance_address: string;
        amount_atomic: string;
      }>(
        `SELECT reservation_id,allowance_address,amount_atomic::text
         FROM allowance_spend_reservations
         WHERE status='reserved' AND expires_at <= $1
         ORDER BY expires_at ASC LIMIT 500 FOR UPDATE`,
        [now],
      );
      for (const reservation of expiredReservations.rows) {
        await client.query(
          `UPDATE agent_allowances
           SET reserved_atomic=reserved_atomic-$2
           WHERE address=$1`,
          [reservation.allowance_address, reservation.amount_atomic],
        );
      }
      if (expiredReservations.rows.length) {
        await client.query(
          `UPDATE allowance_spend_reservations SET status='released',updated_at=$2
           WHERE reservation_id=ANY($1::uuid[])`,
          [expiredReservations.rows.map((row) => row.reservation_id), now],
        );
      }
      await client.query("COMMIT");
      return {
        challenges: challenges.rowCount ?? 0,
        sessions: sessions.rowCount ?? 0,
        idempotencyKeys: idempotencyKeys.rowCount ?? 0,
        metadataRequests: metadataRequests.rowCount ?? 0,
        oauthLinkStates: oauthLinkStates.rowCount ?? 0,
        allowanceReservations: expiredReservations.rows.length,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async saveAllowance(allowance: AgentAllowanceRecord) {
    await this.pool.query(
      `INSERT INTO agent_allowances
        (address, owner_wallet, delegate_wallet, mint, max_atomic, per_request_atomic,
         expires_at, revoked_at, signature,recipient_scope,resource_scopes,starts_at,
         observed_commitment,observed_at,revocation_signature,status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
       ON CONFLICT (address) DO UPDATE SET
         delegate_wallet=EXCLUDED.delegate_wallet, mint=EXCLUDED.mint,
         max_atomic=EXCLUDED.max_atomic,per_request_atomic=EXCLUDED.per_request_atomic,
         expires_at=EXCLUDED.expires_at,revoked_at=EXCLUDED.revoked_at,
         signature=EXCLUDED.signature,recipient_scope=EXCLUDED.recipient_scope,
         resource_scopes=EXCLUDED.resource_scopes,observed_commitment=EXCLUDED.observed_commitment,
         observed_at=EXCLUDED.observed_at,revocation_signature=EXCLUDED.revocation_signature,
         status=EXCLUDED.status
       WHERE agent_allowances.owner_wallet=EXCLUDED.owner_wallet`,
      [
        allowance.address,
        allowance.ownerWallet,
        allowance.delegateWallet,
        allowance.mint,
        allowance.maxAtomic,
        allowance.perRequestAtomic ?? allowance.maxAtomic,
        allowance.expiresAt,
        allowance.revokedAt,
        allowance.signature,
        allowance.recipientScope ?? null,
        JSON.stringify(allowance.resourceScopes ?? []),
        allowance.startsAt ?? new Date().toISOString(),
        allowance.observedCommitment ?? "finalized",
        allowance.observedAt ?? new Date().toISOString(),
        allowance.revocationSignature ?? null,
        allowance.status ?? "active",
      ],
    );
  }

  async listAllowancesForOwner(ownerWallet: string) {
    const result = await this.pool.query(
      `SELECT address,owner_wallet,delegate_wallet,mint,max_atomic::text,
              per_request_atomic::text,spent_atomic::text,reserved_atomic::text,
              expires_at,revoked_at,signature,status,recipient_scope,resource_scopes,
              starts_at,observed_commitment,observed_at,revocation_signature
       FROM agent_allowances WHERE owner_wallet=$1 ORDER BY created_at DESC LIMIT 100`,
      [ownerWallet],
    );
    return result.rows.map(mapAllowance);
  }

  async getAllowanceForOwner(ownerWallet: string, allowanceAddress: string) {
    const result = await this.pool.query(
      `SELECT address,owner_wallet,delegate_wallet,mint,max_atomic::text,
              per_request_atomic::text,spent_atomic::text,reserved_atomic::text,
              expires_at,revoked_at,signature,status,recipient_scope,resource_scopes,
              starts_at,observed_commitment,observed_at,revocation_signature
       FROM agent_allowances WHERE owner_wallet=$1 AND address=$2`,
      [ownerWallet, allowanceAddress],
    );
    return result.rows[0] ? mapAllowance(result.rows[0]) : null;
  }

  async deleteAllowanceMetadata(ownerWallet: string, allowanceAddress: string) {
    const result = await this.pool.query(
      "DELETE FROM agent_allowances WHERE owner_wallet=$1 AND address=$2",
      [ownerWallet, allowanceAddress],
    );
    return (result.rowCount ?? 0) > 0;
  }

  async revokeAllowance(
    ownerWallet: string,
    allowanceAddress: string,
    revocationSignature?: string,
  ) {
    const result = await this.pool.query(
      `UPDATE agent_allowances SET revoked_at=now(),status='revoked',
         revocation_signature=COALESCE($3,revocation_signature),
         observed_commitment='finalized',observed_at=now()
       WHERE address=$1 AND owner_wallet=$2 AND revoked_at IS NULL`,
      [allowanceAddress, ownerWallet, revocationSignature ?? null],
    );
    return (result.rowCount ?? 0) > 0;
  }

  async reserveAllowanceSpend(input: AllowanceSpendReservationInput) {
    const amount = BigInt(input.amountAtomic);
    if (amount <= 0n || input.expiresAt <= new Date())
      throw new Error("ALLOWANCE_RESERVATION_INVALID");
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const result = await client.query<{
        max_atomic: string;
        per_request_atomic: string;
        spent_atomic: string;
        reserved_atomic: string;
        expires_at: Date;
        status: string;
      }>(
        `SELECT max_atomic::text, per_request_atomic::text, spent_atomic::text,
                reserved_atomic::text, expires_at, status
         FROM agent_allowances WHERE address=$1 FOR UPDATE`,
        [input.allowanceAddress],
      );
      const allowance = result.rows[0];
      if (!allowance) throw new Error("ALLOWANCE_NOT_FOUND");
      const replay = await client.query(
        "SELECT 1 FROM allowance_spend_reservations WHERE payment_key=$1",
        [input.paymentKey],
      );
      if ((replay.rowCount ?? 0) > 0)
        throw new Error("ALLOWANCE_RESERVATION_REPLAYED");
      if (allowance.status !== "active")
        throw new Error("ALLOWANCE_NOT_ACTIVE");
      if (new Date(allowance.expires_at) <= new Date())
        throw new Error("ALLOWANCE_EXPIRED");
      if (amount > BigInt(allowance.per_request_atomic))
        throw new Error("ALLOWANCE_PER_REQUEST_EXCEEDED");
      if (
        BigInt(allowance.spent_atomic) +
          BigInt(allowance.reserved_atomic) +
          amount >
        BigInt(allowance.max_atomic)
      )
        throw new Error("ALLOWANCE_AGGREGATE_EXCEEDED");
      await client.query(
        `UPDATE agent_allowances SET reserved_atomic=reserved_atomic+$2
         WHERE address=$1`,
        [input.allowanceAddress, input.amountAtomic],
      );
      await client.query(
        `INSERT INTO allowance_spend_reservations
          (reservation_id, allowance_address, payment_key, amount_atomic, status, expires_at)
         VALUES ($1,$2,$3,$4,'reserved',$5)`,
        [
          input.reservationId,
          input.allowanceAddress,
          input.paymentKey,
          input.amountAtomic,
          input.expiresAt,
        ],
      );
      await client.query("COMMIT");
      return { ...input, status: "reserved" as const };
    } catch (error) {
      await client.query("ROLLBACK");
      if (isUniqueViolation(error))
        throw new Error("ALLOWANCE_RESERVATION_REPLAYED");
      throw error;
    } finally {
      client.release();
    }
  }

  async consumeAllowanceSpend(reservationId: string) {
    return this.finishAllowanceReservation(reservationId, "consumed");
  }

  async releaseAllowanceSpend(reservationId: string) {
    return this.finishAllowanceReservation(reservationId, "released");
  }

  async beginAllowanceRevocation(
    ownerWallet: string,
    allowanceAddress: string,
  ) {
    const result = await this.pool.query(
      `UPDATE agent_allowances SET status='revocation_pending'
       WHERE address=$1 AND owner_wallet=$2 AND status='active'`,
      [allowanceAddress, ownerWallet],
    );
    return (result.rowCount ?? 0) > 0;
  }

  async setAllowanceObservationStatus(
    allowanceAddress: string,
    status: "active" | "unknown" | "failed",
  ) {
    const result = await this.pool.query(
      `UPDATE agent_allowances SET status=$2
       WHERE address=$1 AND (
         (status='active' AND $2 IN ('unknown','failed')) OR
         (status='unknown' AND $2 IN ('active','failed'))
       )`,
      [allowanceAddress, status],
    );
    return (result.rowCount ?? 0) > 0;
  }

  async createOAuthLinkState(
    ownerWallet: string,
    stateHash: string,
    expiresAt: Date,
  ) {
    if (!/^[0-9a-f]{64}$/.test(stateHash) || expiresAt <= new Date())
      throw new Error("OAUTH_LINK_STATE_INVALID");
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const userId = await ensureUserForWallet(client, ownerWallet);
      await client.query(
        `INSERT INTO oauth_link_states (state_hash,user_id,provider,expires_at)
         VALUES ($1,$2,'github',$3)`,
        [stateHash, userId, expiresAt],
      );
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async consumeOAuthLinkState(stateHash: string) {
    const result = await this.pool.query<{ wallet: string }>(
      `DELETE FROM oauth_link_states state
       USING user_wallets wallet
       WHERE state.state_hash=$1 AND state.expires_at>now()
         AND wallet.user_id=state.user_id
       RETURNING wallet.wallet`,
      [stateHash],
    );
    return result.rows[0]?.wallet ?? null;
  }

  async linkGitHubIdentity(
    ownerWallet: string,
    identity: GitHubIdentityRecord,
  ) {
    if (
      !/^\d+$/.test(identity.subject) ||
      !/^[A-Za-z0-9-]{1,39}$/.test(identity.login)
    )
      throw new Error("GITHUB_IDENTITY_INVALID");
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const userId = await ensureUserForWallet(client, ownerWallet);
      await client.query(
        `INSERT INTO linked_identities
          (user_id,provider,provider_subject,display_name,avatar_url,linked_at)
         VALUES ($1,'github',$2,$3,$4,$5)
         ON CONFLICT (user_id,provider) DO UPDATE SET
           provider_subject=EXCLUDED.provider_subject,
           display_name=EXCLUDED.display_name,
           avatar_url=EXCLUDED.avatar_url,
           linked_at=EXCLUDED.linked_at`,
        [
          userId,
          identity.subject,
          identity.login,
          identity.avatarUrl,
          identity.linkedAt,
        ],
      );
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      if (isUniqueViolation(error))
        throw new Error("GITHUB_IDENTITY_ALREADY_LINKED");
      throw error;
    } finally {
      client.release();
    }
  }

  async getGitHubIdentity(ownerWallet: string) {
    const result = await this.pool.query<{
      provider_subject: string;
      display_name: string;
      avatar_url: string | null;
      linked_at: Date;
    }>(
      `SELECT identity.provider_subject,identity.display_name,
              identity.avatar_url,identity.linked_at
       FROM linked_identities identity
       JOIN user_wallets wallet ON wallet.user_id=identity.user_id
       WHERE wallet.wallet=$1 AND identity.provider='github'`,
      [ownerWallet],
    );
    const identity = result.rows[0];
    return identity
      ? {
          subject: identity.provider_subject,
          login: identity.display_name,
          avatarUrl: identity.avatar_url,
          linkedAt: new Date(identity.linked_at).toISOString(),
        }
      : null;
  }

  private async finishAllowanceReservation(
    reservationId: string,
    outcome: "consumed" | "released",
  ) {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const result = await client.query<{
        allowance_address: string;
        amount_atomic: string;
        status: string;
      }>(
        `SELECT allowance_address, amount_atomic::text, status
         FROM allowance_spend_reservations WHERE reservation_id=$1 FOR UPDATE`,
        [reservationId],
      );
      const reservation = result.rows[0];
      if (!reservation || reservation.status !== "reserved") {
        await client.query("ROLLBACK");
        return false;
      }
      await client.query(
        `UPDATE agent_allowances SET
          reserved_atomic=reserved_atomic-$2,
          spent_atomic=spent_atomic+CASE WHEN $3='consumed' THEN $2::numeric ELSE 0 END,
          status=CASE
            WHEN $3='consumed' AND spent_atomic+$2=max_atomic THEN 'exhausted'
            ELSE status END
         WHERE address=$1`,
        [reservation.allowance_address, reservation.amount_atomic, outcome],
      );
      await client.query(
        `UPDATE allowance_spend_reservations
         SET status=$2, updated_at=now() WHERE reservation_id=$1`,
        [reservationId, outcome],
      );
      await client.query("COMMIT");
      return true;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async close() {
    await this.pool.end();
  }
}

function mapPayment(row: Record<string, unknown>): PaymentRecord {
  return paymentRecordSchema.parse({
    id: row.id,
    productId: row.product_id,
    payer: row.payer,
    payTo: row.pay_to,
    mint: row.mint,
    amountAtomic: row.amount_atomic,
    network: row.network,
    signature: row.signature,
    settledAt: new Date(row.settled_at as string | Date).toISOString(),
    status: row.status,
  });
}

function mapPublicReceipt(row: Record<string, unknown>): PublicPaymentReceipt {
  return publicPaymentReceiptSchema.parse({
    schemaVersion: 1,
    receiptId: row.receipt_id,
    productId: row.product_id,
    network: row.network,
    assetMint: row.asset_mint,
    amountAtomic: String(row.amount_atomic),
    recipient: row.recipient,
    ...(row.payer ? { payer: row.payer } : {}),
    resource: row.resource_url,
    decision: row.decision,
    settlement: row.settlement,
    ...(row.signature_fingerprint
      ? { signatureFingerprint: row.signature_fingerprint }
      : {}),
    ...(row.explorer_url ? { explorerUrl: row.explorer_url } : {}),
    policyDecisions: row.policy_decisions,
    createdAt: new Date(row.created_at as string | Date).toISOString(),
    updatedAt: new Date(row.updated_at as string | Date).toISOString(),
    reasonCode: row.reason_code,
  });
}

function mapHostedMetadataRequest(
  row: Record<string, unknown> | undefined,
): HostedMetadataRequest {
  if (!row) throw new Error("HOSTED_METADATA_REQUEST_NOT_CREATED");
  return {
    requestId: String(row.request_id),
    ownerWallet: String(row.owner_wallet),
    requestKind: String(
      row.request_kind,
    ) as HostedMetadataRequest["requestKind"],
    status: String(row.status) as HostedMetadataRequest["status"],
    requestedAt: new Date(row.requested_at as string | Date).toISOString(),
    expiresAt: new Date(row.expires_at as string | Date).toISOString(),
  };
}

const SOLANA_DEVNET_NETWORK = "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1";

function mapProduct(row: Record<string, unknown>): PersistedProduct {
  return persistedProductSchema.parse({
    uid: row.uid,
    id: row.id,
    name: row.name,
    description: row.description,
    resource: row.resource_url,
    ...(row.upstream_url ? { upstreamUrl: row.upstream_url } : {}),
    priceAtomic: String(row.price_atomic),
    assetMint: row.asset_mint,
    payTo: row.pay_to,
    network: row.network,
  });
}

function mapAllowance(row: Record<string, unknown>): AgentAllowanceRecord {
  return {
    address: String(row.address),
    ownerWallet: String(row.owner_wallet),
    delegateWallet: String(row.delegate_wallet),
    mint: String(row.mint),
    maxAtomic: String(row.max_atomic),
    expiresAt: new Date(row.expires_at as string | Date).toISOString(),
    revokedAt: row.revoked_at
      ? new Date(row.revoked_at as string | Date).toISOString()
      : null,
    signature: row.signature ? String(row.signature) : null,
    perRequestAtomic: String(row.per_request_atomic),
    spentAtomic: String(row.spent_atomic),
    reservedAtomic: String(row.reserved_atomic),
    status: String(row.status) as NonNullable<AgentAllowanceRecord["status"]>,
    recipientScope: row.recipient_scope ? String(row.recipient_scope) : null,
    resourceScopes: Array.isArray(row.resource_scopes)
      ? row.resource_scopes.map(String)
      : [],
    startsAt: new Date(row.starts_at as string | Date).toISOString(),
    observedCommitment: String(row.observed_commitment) as NonNullable<
      AgentAllowanceRecord["observedCommitment"]
    >,
    observedAt: new Date(row.observed_at as string | Date).toISOString(),
    revocationSignature: row.revocation_signature
      ? String(row.revocation_signature)
      : null,
  };
}

function isUniqueViolation(error: unknown): error is { code: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: unknown }).code === "23505"
  );
}

async function ensureUserForWallet(client: pg.PoolClient, wallet: string) {
  const existing = await client.query<{ user_id: string }>(
    "SELECT user_id FROM user_wallets WHERE wallet=$1",
    [wallet],
  );
  if (existing.rows[0]) return existing.rows[0].user_id;
  const created = await client.query<{ id: string }>(
    "INSERT INTO users DEFAULT VALUES RETURNING id",
  );
  const userId = created.rows[0]?.id;
  if (!userId) throw new Error("USER_NOT_CREATED");
  await client.query(
    "INSERT INTO user_wallets (user_id,wallet) VALUES ($1,$2)",
    [userId, wallet],
  );
  return userId;
}
