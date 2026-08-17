import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { SOLANA_DEVNET, paymentRecordSchema } from "@usemeterkit/core";
import { StandalonePostgresPaymentStore } from "./standalone-payment-store.js";

const url = process.env.DATABASE_TEST_URL;
const suite = url ? describe : describe.skip;
let store: StandalonePostgresPaymentStore;

const payment = paymentRecordSchema.parse({
  id: crypto.randomUUID(),
  productId: "standalone",
  payer: "8NXuBzJ3EQV4CuxpSVELD3t1bs5xZ6ocfGvwjFDbCZUF",
  payTo: "7NXuBzJ3EQV4CuxpSVELD3t1bs5xZ6ocfGvwjFDbCZUE",
  mint: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
  amountAtomic: "10000",
  network: SOLANA_DEVNET,
  signature: "standalone-secret-signature",
  settledAt: new Date().toISOString(),
  status: "confirmed",
});

suite("StandalonePostgresPaymentStore", () => {
  beforeAll(async () => {
    store = StandalonePostgresPaymentStore.connect(url!);
    await store.migrate();
    await store.migrate();
    await store.pool.query(
      "TRUNCATE meterkit_authorization_reservations, meterkit_consumed_payments",
    );
  });
  afterAll(async () => {
    await store.pool.query(
      "TRUNCATE meterkit_authorization_reservations, meterkit_consumed_payments",
    );
    await store.close();
  });

  it("atomically consumes once and stores no full signature or payer", async () => {
    const outcomes = await Promise.allSettled([
      store.save(payment),
      store.save({ ...payment, id: crypto.randomUUID() }),
    ]);
    expect(
      outcomes.filter(({ status }) => status === "fulfilled"),
    ).toHaveLength(1);
    expect(outcomes.filter(({ status }) => status === "rejected")).toHaveLength(
      1,
    );
    const rows = await store.pool.query(
      "SELECT * FROM meterkit_consumed_payments",
    );
    expect(rows.rows).toHaveLength(1);
    expect(JSON.stringify(rows.rows[0])).not.toContain(payment.signature);
    expect(JSON.stringify(rows.rows[0])).not.toContain(payment.payer);
  });

  it("rejects replay after the store is recreated", async () => {
    const restarted = StandalonePostgresPaymentStore.connect(url!);
    try {
      expect(await restarted.has(payment.signature)).toBe(true);
      await expect(
        restarted.save({ ...payment, id: crypto.randomUUID() }),
      ).rejects.toThrow("PAYMENT_REPLAYED");
    } finally {
      await restarted.close();
    }
  });

  it("reserves one authorization atomically across concurrent requests", async () => {
    const fingerprint = "a".repeat(64);
    const outcomes = await Promise.all([
      store.reserveAuthorization(fingerprint),
      store.reserveAuthorization(fingerprint),
    ]);
    expect(outcomes.sort()).toEqual([false, true]);
  });
});
