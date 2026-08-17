import { createHash } from "node:crypto";
import pg from "pg";
import {
  SOLANA_DEVNET,
  fingerprintSignature,
  paymentRecordSchema,
  type PaymentRecord,
  type PaymentStore,
} from "@usemeterkit/core";
import { migrateStandalonePaymentStore } from "./standalone-migrations.js";

const { Pool } = pg;
function signatureHash(signature: string) {
  return createHash("sha256").update(signature).digest("hex");
}

export class StandalonePostgresPaymentStore implements PaymentStore {
  constructor(readonly pool: pg.Pool) {}

  static connect(connectionString: string) {
    if (!connectionString.trim()) throw new Error("DATABASE_URL_REQUIRED");
    return new StandalonePostgresPaymentStore(
      new Pool({
        connectionString,
        max: 10,
        connectionTimeoutMillis: 5_000,
        idleTimeoutMillis: 30_000,
      }),
    );
  }

  async migrate() {
    await migrateStandalonePaymentStore(this.pool);
  }

  async has(signature: string) {
    const result = await this.pool.query<{ exists: boolean }>(
      "SELECT EXISTS(SELECT 1 FROM meterkit_consumed_payments WHERE network=$1 AND signature_hash=$2) AS exists",
      [SOLANA_DEVNET, signatureHash(signature)],
    );
    return result.rows[0]?.exists ?? false;
  }

  async save(record: PaymentRecord) {
    const value = paymentRecordSchema.parse(record);
    try {
      await this.pool.query(
        `INSERT INTO meterkit_consumed_payments
          (network, signature_hash, signature_fingerprint, product_id, amount_atomic, recipient, accepted_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [
          value.network,
          signatureHash(value.signature),
          fingerprintSignature(value.signature),
          value.productId,
          value.amountAtomic,
          value.payTo,
          value.settledAt,
        ],
      );
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === "23505"
      )
        throw new Error("PAYMENT_REPLAYED");
      throw error;
    }
  }

  async list() {
    return [] as PaymentRecord[];
  }

  async reserveAuthorization(fingerprint: string) {
    if (!/^[a-f0-9]{64}$/.test(fingerprint))
      throw new Error("PAYMENT_FINGERPRINT_INVALID");
    const result = await this.pool.query(
      `INSERT INTO meterkit_authorization_reservations
        (network, proof_fingerprint)
       VALUES ($1,$2)
       ON CONFLICT DO NOTHING
       RETURNING proof_fingerprint`,
      [SOLANA_DEVNET, fingerprint],
    );
    return result.rowCount === 1;
  }

  async close() {
    await this.pool.end();
  }
}
