import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  SOLANA_DEVNET,
  publicPaymentReceiptSchema,
  paymentRecordSchema,
  productSchema,
} from "@usemeterkit/core";
import { PostgresStore } from "./index.js";

const url = process.env.DATABASE_TEST_URL;
const suite = url ? describe : describe.skip;
let store: PostgresStore;

suite("PostgresStore integration", () => {
  beforeAll(async () => {
    store = PostgresStore.connect(url!);
    await store.migrate();
    await store.pool.query(
      "TRUNCATE payments, products, wallet_sessions, wallet_challenges, idempotency_keys, agent_allowances CASCADE",
    );
  });
  afterAll(async () => {
    await store.pool.query(
      "TRUNCATE payments, products, wallet_sessions, wallet_challenges, idempotency_keys, agent_allowances CASCADE",
    );
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
    const created = await store.create(product);
    expect(created.uid).toMatch(/^[0-9a-f-]{36}$/);
    expect(await store.getByUid(created.uid)).toEqual(created);
    expect(await store.getByOwnerSlug(product.payTo, product.id)).toEqual(
      created,
    );
    expect(await store.getUniqueBySlug(product.id)).toEqual(created);
    expect(await store.listProductsForOwner(product.payTo)).toEqual([created]);
    expect(
      await store.listProductsForOwner("11111111111111111111111111111111"),
    ).toEqual([]);

    const secondOwner = "6NXuBzJ3EQV4CuxpSVELD3t1bs5xZ6ocfGvwjFDbCZUD";
    const second = await store.create({ ...product, payTo: secondOwner });
    expect(second.id).toBe(product.id);
    expect(second.uid).not.toBe(created.uid);
    expect(await store.getByOwnerSlug(secondOwner, product.id)).toEqual(second);
    expect(await store.getUniqueBySlug(product.id)).toBeNull();

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
    expect(
      concurrent.filter((result) => result.status === "fulfilled"),
    ).toHaveLength(1);
    expect(
      concurrent.filter((result) => result.status === "rejected"),
    ).toHaveLength(1);
    expect(await store.has(payment.signature)).toBe(true);
    await expect(
      store.save({ ...payment, id: crypto.randomUUID() }),
    ).rejects.toThrow("PAYMENT_REPLAYED");
    expect(await store.list()).toHaveLength(1);
    expect(await store.listPaymentsForOwner(product.payTo)).toHaveLength(1);
    expect(
      await store.listPaymentsForOwner("11111111111111111111111111111111"),
    ).toEqual([]);
    expect(await store.listPaymentsForProduct(created.uid)).toHaveLength(1);
    expect(await store.listConfirmedSignatures()).toEqual([payment.signature]);
    expect(await store.markFinalized(payment.signature)).toBe(true);
    expect((await store.list())[0]?.status).toBe("finalized");

    await store.createSession(
      "session-token-hash",
      product.payTo,
      new Date(Date.now() + 60_000),
    );
    expect(await store.getSessionOwner("session-token-hash")).toBe(
      product.payTo,
    );
    await store.createSession(
      "expired-token-hash",
      product.payTo,
      new Date(Date.now() - 1),
    );
    expect(await store.getSessionOwner("expired-token-hash")).toBeNull();

    const idempotencyKey = "product-request-0001";
    const first = await store.createIdempotent(
      product,
      idempotencyKey,
      "same-hash",
    );
    const repeated = await store.createIdempotent(
      product,
      idempotencyKey,
      "same-hash",
    );
    expect(repeated).toEqual(first);
    await expect(
      store.createIdempotent(
        { ...product, name: "Changed product" },
        idempotencyKey,
        "different-hash",
      ),
    ).rejects.toThrow("IDEMPOTENCY_KEY_CONFLICT");

    const challenge = {
      nonceHash: "nonce-hash",
      wallet: product.payTo,
      message: "bounded signed message",
      requestHash: "request-hash",
      idempotencyKey: "challenge-request",
      expiresAt: new Date(Date.now() + 60_000),
    };
    await store.saveWalletChallenge(challenge, 2);
    const consumed = await Promise.all([
      store.consumeWalletChallenge(challenge.nonceHash),
      store.consumeWalletChallenge(challenge.nonceHash),
    ]);
    expect(consumed.filter(Boolean)).toHaveLength(1);
    expect(await store.consumeWalletChallenge(challenge.nonceHash)).toBeNull();

    await store.saveWalletChallenge(
      { ...challenge, nonceHash: "expired", expiresAt: new Date(0) },
      2,
    );
    const cleanup = await store.cleanupExpired();
    expect(cleanup.challenges).toBeGreaterThanOrEqual(1);
    expect(cleanup.sessions).toBeGreaterThanOrEqual(1);
    expect(await store.getSessionOwner("session-token-hash")).toBe(
      product.payTo,
    );

    const allowance = {
      address: "9NXuBzJ3EQV4CuxpSVELD3t1bs5xZ6ocfGvwjFDbCZUG",
      ownerWallet: product.payTo,
      delegateWallet: "8NXuBzJ3EQV4CuxpSVELD3t1bs5xZ6ocfGvwjFDbCZUF",
      mint: product.assetMint,
      maxAtomic: "1000000",
      expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
      revokedAt: null,
      signature:
        "7NXuBzJ3EQV4CuxpSVELD3t1bs5xZ6ocfGvwjFDbCZUE7NXuBzJ3EQV4CuxpSVELD3t1bs5",
    };
    await store.saveAllowance(allowance);
    expect(await store.listAllowancesForOwner(product.payTo)).toEqual([
      allowance,
    ]);
    expect(
      await store.listAllowancesForOwner("11111111111111111111111111111111"),
    ).toEqual([]);
    expect(
      await store.revokeAllowance(
        "11111111111111111111111111111111",
        allowance.address,
      ),
    ).toBe(false);
    expect(await store.revokeAllowance(product.payTo, allowance.address)).toBe(
      true,
    );
    expect(
      (await store.listAllowancesForOwner(product.payTo))[0]?.revokedAt,
    ).not.toBeNull();

    const timestamp = new Date().toISOString();
    const receipt = publicPaymentReceiptSchema.parse({
      schemaVersion: 1,
      receiptId: crypto.randomUUID(),
      productId: product.id,
      network: SOLANA_DEVNET,
      assetMint: product.assetMint,
      amountAtomic: product.priceAtomic,
      recipient: product.payTo,
      payer: payment.payer,
      resource: product.resource,
      decision: "accepted",
      settlement: "confirmed",
      signatureFingerprint: "sha256:0123456789abcdef",
      policyDecisions: [],
      createdAt: timestamp,
      updatedAt: timestamp,
      reasonCode: "SETTLEMENT_CONFIRMED",
    });
    await store.savePublicReceipt(receipt);
    expect(await store.getPublicReceipt(receipt.receiptId)).toEqual(receipt);
    const finalized = { ...receipt, settlement: "finalized" as const, updatedAt: new Date(Date.now() + 1_000).toISOString(), reasonCode: "SETTLEMENT_FINALIZED" };
    await store.savePublicReceipt(finalized);
    await expect(store.savePublicReceipt({ ...receipt, updatedAt: new Date(Date.now() + 2_000).toISOString() })).rejects.toThrow("RECEIPT_TRANSITION_REJECTED");
    const concurrentReceipts = await Promise.allSettled([
      store.savePublicReceipt({ ...finalized, updatedAt: new Date(Date.now() + 3_000).toISOString() }),
      store.savePublicReceipt({ ...finalized, settlement: "failed", updatedAt: new Date(Date.now() + 4_000).toISOString(), reasonCode: "SETTLEMENT_FAILED" }),
    ]);
    expect(concurrentReceipts.filter((item) => item.status === "fulfilled")).toHaveLength(1);
  });
});
