import { afterAll, beforeAll, describe, expect, it } from "vitest";
import express from "express";
import { StandalonePostgresPaymentStore } from "@usemeterkit/database";
import { SOLANA_DEVNET, productSchema } from "@usemeterkit/core";
import { createMeterKitMiddleware, type Facilitator } from "./index.js";

const databaseUrl = process.env.DATABASE_TEST_URL;
const suite = databaseUrl ? describe : describe.skip;
const signature = "durable-concurrent-payment-signature";
const paymentHeader = Buffer.from("a-valid-looking-payment-proof").toString(
  "base64",
);
const product = productSchema.parse({
  id: "durable-route",
  name: "Durable route",
  description: "Replay-safe generated route",
  resource: "http://127.0.0.1/premium",
  priceAtomic: "10000",
  assetMint: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
  payTo: "7NXuBzJ3EQV4CuxpSVELD3t1bs5xZ6ocfGvwjFDbCZUE",
  network: SOLANA_DEVNET,
});
const facilitator: Facilitator = {
  async settle() {
    return {
      success: true,
      transaction: signature,
      payer: "8NXuBzJ3EQV4CuxpSVELD3t1bs5xZ6ocfGvwjFDbCZUF",
      network: SOLANA_DEVNET,
    };
  },
};

async function startServer(store: StandalonePostgresPaymentStore) {
  let protectedExecutions = 0;
  const app = express();
  app.get(
    "/premium",
    createMeterKitMiddleware({ product, facilitator, store }),
    (_request, response) => {
      protectedExecutions += 1;
      response.json({ protected: true });
    },
  );
  const listener = app.listen(0);
  await new Promise<void>((resolve) => listener.once("listening", resolve));
  const address = listener.address();
  if (!address || typeof address === "string")
    throw new Error("TEST_LISTENER_UNAVAILABLE");
  return {
    url: `http://127.0.0.1:${address.port}/premium`,
    protectedExecutions: () => protectedExecutions,
    close: () =>
      new Promise<void>((resolve, reject) =>
        listener.close((error) => (error ? reject(error) : resolve())),
      ),
  };
}

suite("durable middleware replay protection", () => {
  let store: StandalonePostgresPaymentStore;

  beforeAll(async () => {
    store = StandalonePostgresPaymentStore.connect(databaseUrl!);
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

  it("executes the protected handler once under concurrency and blocks after restart", async () => {
    const firstServer = await startServer(store);
    try {
      const responses = await Promise.all([
        fetch(firstServer.url, {
          headers: { "PAYMENT-SIGNATURE": paymentHeader },
        }),
        fetch(firstServer.url, {
          headers: { "PAYMENT-SIGNATURE": paymentHeader },
        }),
      ]);
      expect(responses.map(({ status }) => status).sort()).toEqual([200, 409]);
      expect(firstServer.protectedExecutions()).toBe(1);
    } finally {
      await firstServer.close();
    }

    const restartedStore = StandalonePostgresPaymentStore.connect(databaseUrl!);
    const restartedServer = await startServer(restartedStore);
    try {
      const replay = await fetch(restartedServer.url, {
        headers: { "PAYMENT-SIGNATURE": paymentHeader },
      });
      expect(replay.status).toBe(409);
      expect(await replay.json()).toEqual({ error: "payment_replayed" });
      expect(restartedServer.protectedExecutions()).toBe(0);
    } finally {
      await restartedServer.close();
      await restartedStore.close();
    }
  });
});
