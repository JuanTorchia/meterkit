import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import pg from "pg";
import {
  paymentRecordSchema,
  productSchema,
  type PaymentRecord,
  type PaymentStore,
  type Product,
} from "@meterkit/core";

const { Pool } = pg;

export interface ProductStore {
  create(product: Product): Promise<Product>;
  createIdempotent(product: Product, key: string, requestHash: string): Promise<Product>;
  get(id: string): Promise<Product | null>;
  listProducts(): Promise<readonly Product[]>;
  listProductsForOwner(ownerWallet: string): Promise<readonly Product[]>;
  listPaymentsForOwner(ownerWallet: string): Promise<readonly PaymentRecord[]>;
  listPaymentsForProduct(productId: string): Promise<readonly PaymentRecord[]>;
  createSession(tokenHash: string, ownerWallet: string, expiresAt: Date): Promise<void>;
  getSessionOwner(tokenHash: string): Promise<string | null>;
  saveWalletChallenge(challenge: WalletChallengeRecord, maxActive: number): Promise<void>;
  consumeWalletChallenge(nonceHash: string): Promise<WalletChallengeRecord | null>;
  cleanupExpired(now?: Date): Promise<{ challenges: number; sessions: number; idempotencyKeys: number }>;
  saveAllowance(allowance: AgentAllowanceRecord): Promise<void>;
  listAllowancesForOwner(ownerWallet: string): Promise<readonly AgentAllowanceRecord[]>;
  revokeAllowance(ownerWallet: string, address: string): Promise<boolean>;
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
};

export interface FinalityStore {
  listConfirmedSignatures(limit?: number): Promise<readonly string[]>;
  markFinalized(signature: string): Promise<boolean>;
  markFailed(signature: string): Promise<boolean>;
}

export class PostgresStore implements PaymentStore, ProductStore, FinalityStore {
  constructor(readonly pool: pg.Pool) {}

  static connect(connectionString: string) {
    return new PostgresStore(new Pool({
      connectionString,
      max: 10,
      connectionTimeoutMillis: 5_000,
      idleTimeoutMillis: 30_000,
    }));
  }

  async migrate() {
    const migration = await readFile(
      fileURLToPath(new URL("../migrations/001_init.sql", import.meta.url)),
      "utf8",
    );
    await this.pool.query(migration);
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
          (id, product_id, payer, pay_to, mint, amount_atomic, network, signature, status, settled_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [
          value.id, value.productId, value.payer, value.payTo, value.mint,
          value.amountAtomic, value.network, value.signature, "confirmed", value.settledAt,
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

  async create(product: Product) {
    const value = productSchema.parse(product);
    const result = await this.pool.query(
        `INSERT INTO products
          (id, owner_wallet, name, description, resource_url, upstream_url, network, asset_mint, pay_to, price_atomic)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         ON CONFLICT (id) DO UPDATE SET
           name=EXCLUDED.name, description=EXCLUDED.description,
           resource_url=EXCLUDED.resource_url, upstream_url=EXCLUDED.upstream_url,
           price_atomic=EXCLUDED.price_atomic
         WHERE products.owner_wallet=EXCLUDED.owner_wallet
         RETURNING *`,
      [
        value.id, value.payTo, value.name, value.description, value.resource,
        value.upstreamUrl ?? null, value.network, value.assetMint, value.payTo,
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
        if (!row || row.request_hash !== requestHash) throw new Error("IDEMPOTENCY_KEY_CONFLICT");
        if (!row.response_body) throw new Error("IDEMPOTENCY_REQUEST_INCOMPLETE");
        await client.query("COMMIT");
        return productSchema.parse(row.response_body);
      }
      const result = await client.query(
        `INSERT INTO products
          (id, owner_wallet, name, description, resource_url, upstream_url, network, asset_mint, pay_to, price_atomic)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         ON CONFLICT (id) DO UPDATE SET
           name=EXCLUDED.name, description=EXCLUDED.description,
           resource_url=EXCLUDED.resource_url, upstream_url=EXCLUDED.upstream_url,
           price_atomic=EXCLUDED.price_atomic
         WHERE products.owner_wallet=EXCLUDED.owner_wallet
         RETURNING *`,
        [
          value.id, value.payTo, value.name, value.description, value.resource,
          value.upstreamUrl ?? null, value.network, value.assetMint, value.payTo,
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

  async get(id: string) {
    const result = await this.pool.query("SELECT * FROM products WHERE id=$1", [id]);
    return result.rows[0] ? mapProduct(result.rows[0]) : null;
  }

  async listProducts() {
    const result = await this.pool.query("SELECT * FROM products ORDER BY created_at DESC");
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
       FROM payments p JOIN products product ON product.id=p.product_id
       WHERE product.owner_wallet=$1 ORDER BY p.settled_at DESC LIMIT 200`,
      [ownerWallet],
    );
    return result.rows.map(mapPayment);
  }

  async listPaymentsForProduct(productId: string) {
    const result = await this.pool.query(
      `SELECT id, product_id, payer, pay_to, mint, amount_atomic::text, network,
              signature, settled_at, status
       FROM payments WHERE product_id=$1 ORDER BY settled_at DESC LIMIT 200`,
      [productId],
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

  async saveWalletChallenge(challenge: WalletChallengeRecord, maxActive: number) {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1, 0))", [challenge.wallet]);
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
          challenge.nonceHash, challenge.wallet, challenge.message,
          challenge.requestHash, challenge.idempotencyKey, challenge.expiresAt,
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
    return row ? {
      nonceHash: String(row.nonce_hash),
      wallet: String(row.wallet),
      message: String(row.message),
      requestHash: String(row.request_hash),
      idempotencyKey: String(row.idempotency_key),
      expiresAt: new Date(row.expires_at as string | Date),
    } : null;
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
      await client.query("COMMIT");
      return {
        challenges: challenges.rowCount ?? 0,
        sessions: sessions.rowCount ?? 0,
        idempotencyKeys: idempotencyKeys.rowCount ?? 0,
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
        (address, owner_wallet, delegate_wallet, mint, max_atomic, expires_at, revoked_at, signature)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (address) DO UPDATE SET
         delegate_wallet=EXCLUDED.delegate_wallet, mint=EXCLUDED.mint,
         max_atomic=EXCLUDED.max_atomic, expires_at=EXCLUDED.expires_at,
         revoked_at=EXCLUDED.revoked_at, signature=EXCLUDED.signature
       WHERE agent_allowances.owner_wallet=EXCLUDED.owner_wallet`,
      [
        allowance.address, allowance.ownerWallet, allowance.delegateWallet,
        allowance.mint, allowance.maxAtomic, allowance.expiresAt,
        allowance.revokedAt, allowance.signature,
      ],
    );
  }

  async listAllowancesForOwner(ownerWallet: string) {
    const result = await this.pool.query(
      `SELECT address, owner_wallet, delegate_wallet, mint, max_atomic::text,
              expires_at, revoked_at, signature
       FROM agent_allowances WHERE owner_wallet=$1 ORDER BY created_at DESC LIMIT 100`,
      [ownerWallet],
    );
    return result.rows.map(mapAllowance);
  }

  async revokeAllowance(ownerWallet: string, allowanceAddress: string) {
    const result = await this.pool.query(
      `UPDATE agent_allowances SET revoked_at=now()
       WHERE address=$1 AND owner_wallet=$2 AND revoked_at IS NULL`,
      [allowanceAddress, ownerWallet],
    );
    return (result.rowCount ?? 0) > 0;
  }

  async close() { await this.pool.end(); }
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

const SOLANA_DEVNET_NETWORK = "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1";

function mapProduct(row: Record<string, unknown>): Product {
  return productSchema.parse({
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
  };
}

function isUniqueViolation(error: unknown): error is { code: string } {
  return typeof error === "object" && error !== null && "code" in error &&
    (error as { code: unknown }).code === "23505";
}
