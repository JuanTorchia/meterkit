import { Buffer } from "node:buffer";
import { describe, expect, it } from "vitest";
import { MemoryPaymentStore, SOLANA_DEVNET } from "@usemeterkit/core";
import type { FacilitatorClient } from "@x402/core/server";
import { createApp } from "./server.js";

const wallet = "7NXuBzJ3EQV4CuxpSVELD3t1bs5xZ6ocfGvwjFDbCZUE";

describe("Hono x402 parity", () => {
  it("returns the canonical Solana devnet challenge", async () => {
    const response = await createApp(wallet).request(
      "http://localhost/premium",
    );
    expect(response.status).toBe(402);
    const encoded = response.headers.get("PAYMENT-REQUIRED");
    expect(encoded).toBeTruthy();
    const challenge = JSON.parse(
      Buffer.from(encoded!, "base64").toString("utf8"),
    );
    expect(challenge.accepts[0]).toMatchObject({
      network: SOLANA_DEVNET,
      amount: "10000",
      payTo: wallet,
    });
  });

  it("settles once, returns a receipt and rejects replay", async () => {
    let settled = false;
    const facilitatorClient: FacilitatorClient = {
      async getSupported() {
        return {
          kinds: [
            {
              x402Version: 2,
              scheme: "exact",
              network: SOLANA_DEVNET,
              extra: { feePayer: wallet },
            },
          ],
          extensions: [],
          signers: { "solana:*": [wallet] },
        };
      },
      async verify() {
        return settled
          ? { isValid: false, invalidReason: "payment_already_settled" }
          : { isValid: true, payer: wallet };
      },
      async settle(_payload, requirements) {
        settled = true;
        return {
          success: true,
          payer: wallet,
          transaction: "hono-official-signature",
          network: SOLANA_DEVNET,
          amount: requirements.amount,
        };
      },
    };
    const store = new MemoryPaymentStore();
    const app = createApp(wallet, { facilitatorClient, store, rpcUrl: false });
    const challengeResponse = await app.request("http://localhost/premium");
    const challenge = JSON.parse(
      Buffer.from(
        challengeResponse.headers.get("PAYMENT-REQUIRED")!,
        "base64",
      ).toString("utf8"),
    );
    const payment = Buffer.from(
      JSON.stringify({
        x402Version: 2,
        resource: challenge.resource,
        accepted: challenge.accepts[0],
        payload: { transaction: "client-signed-transaction" },
      }),
    ).toString("base64");
    const paid = await app.request("http://localhost/premium", {
      headers: { "PAYMENT-SIGNATURE": payment },
    });
    expect(paid.status).toBe(200);
    expect(paid.headers.get("PAYMENT-RESPONSE")).toBeTruthy();
    expect(await store.has("hono-official-signature")).toBe(true);
    const replay = await app.request("http://localhost/premium", {
      headers: { "PAYMENT-SIGNATURE": payment },
    });
    expect(replay.status).toBe(402);
  });
});
