import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { SOLANA_DEVNET, paymentRecordSchema, productSchema } from "@meterkit/core";
import { PostgresStore } from "./index.js";

const url = process.env.DATABASE_TEST_URL;
const suite = url ? describe : describe.skip;
let store: PostgresStore;

suite("PostgresStore integration", () => {
  beforeAll(async () => {
    store = PostgresStore.connect(url!);
    await store.migrate();
    await store.pool.query("TRUNCATE payments, products CASCADE");
  });
  afterAll(async () => {
    await store.pool.query("TRUNCATE payments, products CASCADE");
    await store.close();
  });

  it("persists products and atomically rejects payment replay", async () => {
    const product = productSchema.parse({
      id: "premium-weather",
      name: "Premium Weather API",
      description: "Test",
      resource: "http://localhost:3402/v1/weather/premium",
      priceAtomic: "10000",
      assetMint: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
      payTo: "7NXuBzJ3EQV4CuxpSVELD3t1bs5xZ6ocfGvwjFDbCZUE",
      network: SOLANA_DEVNET,
    });
    await store.create(product);
    expect(await store.get(product.id)).toEqual(product);

    const payment = paymentRecordSchema.parse({
      id: crypto.randomUUID(),
      productId: product.id,
      payer: "8NXuBzJ3EQV4CuxpSVELD3t1bs5xZ6ocfGvwjFDbCZUF",
      payTo: product.payTo,
      mint: product.assetMint,
      amountAtomic: product.priceAtomic,
      network: SOLANA_DEVNET,
      signature: "integration-signature",
      settledAt: new Date().toISOString(),
      status: "confirmed",
    });
    const concurrent = await Promise.allSettled([
      store.save(payment),
      store.save({ ...payment, id: crypto.randomUUID() }),
    ]);
    expect(concurrent.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(concurrent.filter((result) => result.status === "rejected")).toHaveLength(1);
    expect(await store.has(payment.signature)).toBe(true);
    await expect(store.save({ ...payment, id: crypto.randomUUID() })).rejects.toThrow("PAYMENT_REPLAYED");
    expect(await store.list()).toHaveLength(1);
    expect(await store.listConfirmedSignatures()).toEqual([payment.signature]);
    expect(await store.markFinalized(payment.signature)).toBe(true);
    expect((await store.list())[0]?.status).toBe("finalized");

    const idempotencyKey = "product-request-0001";
    const first = await store.createIdempotent(product, idempotencyKey, "same-hash");
    const repeated = await store.createIdempotent(product, idempotencyKey, "same-hash");
    expect(repeated).toEqual(first);
    await expect(store.createIdempotent(
      { ...product, name: "Changed product" },
      idempotencyKey,
      "different-hash",
    )).rejects.toThrow("IDEMPOTENCY_KEY_CONFLICT");
  });
});
