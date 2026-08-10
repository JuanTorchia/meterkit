import { describe, expect, it, vi } from "vitest";
import {
  MemoryPaymentStore,
  SOLANA_DEVNET,
  productSchema,
} from "@meterkit/core";
import {
  createMeterKitMiddleware,
  parseProductScope,
  SolanaSettlementValidator,
  type Facilitator,
  type Settlement,
} from "./index.js";
import { createX402Middleware } from "./index.js";
import type { FacilitatorClient } from "@x402/core/server";
import express from "express";

describe("tenant-scoped product routes", () => {
  const owner = "7NXuBzJ3EQV4CuxpSVELD3t1bs5xZ6ocfGvwjFDbCZUE";

  it("parses owner and slug without conflating tenants", () => {
    expect(
      parseProductScope(`/v1/products/${owner}/premium-weather/proxy`),
    ).toEqual({
      owner,
      slug: "premium-weather",
    });
    expect(parseProductScope("/v1/products/premium-weather/proxy")).toEqual({
      owner: null,
      slug: "premium-weather",
    });
  });

  it.each([
    `/v1/products/${owner}/premium-weather-evil/proxy/extra`,
    `/v1/products/${owner}/Premium-Weather/proxy`,
    `/v1/products/${owner}/premium%2Fweather/proxy`,
    "/v1/products/not-a-wallet/premium-weather/proxy",
  ])("rejects invalid scoped route %s", (path) => {
    expect(() => parseProductScope(path)).toThrow("PRODUCT_ROUTE_INVALID");
  });
});

const product = productSchema.parse({
  id: "weather",
  name: "Premium Weather API",
  description: "Paid weather",
  resource: "http://localhost:3402/premium",
  priceAtomic: "10000",
  assetMint: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
  payTo: "7NXuBzJ3EQV4CuxpSVELD3t1bs5xZ6ocfGvwjFDbCZUE",
  network: SOLANA_DEVNET,
});

describe("official x402 v2 middleware", () => {
  it("challenges, settles once, records receipt and rejects replay", async () => {
    let used = false;
    const officialFacilitator: FacilitatorClient = {
      async getSupported() {
        return {
          kinds: [
            {
              x402Version: 2,
              scheme: "exact",
              network: SOLANA_DEVNET,
              extra: {
                feePayer: "CKPKJWNdJEqa81x7CkZ14BVPiY6y16Sxs7owznqtWYp5",
              },
            },
          ],
          extensions: [],
          signers: {
            "solana:*": ["CKPKJWNdJEqa81x7CkZ14BVPiY6y16Sxs7owznqtWYp5"],
          },
        };
      },
      async verify() {
        if (used)
          return { isValid: false, invalidReason: "payment_already_settled" };
        return { isValid: true, payer: product.payTo };
      },
      async settle(_payload, requirements) {
        used = true;
        return {
          success: true,
          payer: product.payTo,
          transaction: "official-signature",
          network: SOLANA_DEVNET,
          amount: requirements.amount,
        };
      },
    };
    const store = new MemoryPaymentStore();
    const app = express();
    app.get(
      "/premium",
      createX402Middleware({
        product,
        store,
        facilitatorClient: officialFacilitator,
        rpcUrl: false,
      }),
      (_request, response) => response.json({ protected: true }),
    );
    const listener = app.listen(0);
    await new Promise<void>((resolve) => listener.once("listening", resolve));
    const address = listener.address();
    if (!address || typeof address === "string")
      throw new Error("test listener unavailable");
    const url = `http://127.0.0.1:${address.port}/premium`;
    try {
      const challenge = await fetch(url);
      expect(challenge.status).toBe(402);
      const requiredHeader = challenge.headers.get("PAYMENT-REQUIRED");
      expect(requiredHeader).toBeTruthy();
      const required = JSON.parse(
        Buffer.from(requiredHeader!, "base64").toString("utf8"),
      );
      expect(required.accepts[0]).toMatchObject({
        network: SOLANA_DEVNET,
        amount: "10000",
        asset: product.assetMint,
        payTo: product.payTo,
      });
      const signature = Buffer.from(
        JSON.stringify({
          x402Version: 2,
          resource: required.resource,
          accepted: required.accepts[0],
          payload: { transaction: "client-signed-transaction" },
        }),
      ).toString("base64");
      const paid = await fetch(url, {
        headers: { "PAYMENT-SIGNATURE": signature },
      });
      expect(paid.status).toBe(200);
      expect(paid.headers.get("PAYMENT-RESPONSE")).toBeTruthy();
      expect(await store.has("official-signature")).toBe(true);
      const replay = await fetch(url, {
        headers: { "PAYMENT-SIGNATURE": signature },
      });
      expect(replay.status).toBe(402);
    } finally {
      await new Promise<void>((resolve, reject) =>
        listener.close((error) => (error ? reject(error) : resolve())),
      );
    }
  });
});

describe("independent Solana settlement validation", () => {
  const payer = "8NXuBzJ3EQV4CuxpSVELD3t1bs5xZ6ocfGvwjFDbCZUF";
  const transaction = (overrides?: {
    mint?: string;
    recipient?: string;
    credited?: string;
    err?: unknown;
  }) => ({
    result: {
      meta: {
        err: overrides?.err ?? null,
        preTokenBalances: [
          {
            accountIndex: 1,
            mint: product.assetMint,
            owner: payer,
            uiTokenAmount: { amount: "20000" },
          },
          {
            accountIndex: 2,
            mint: overrides?.mint ?? product.assetMint,
            owner: overrides?.recipient ?? product.payTo,
            uiTokenAmount: { amount: "5000" },
          },
        ],
        postTokenBalances: [
          {
            accountIndex: 1,
            mint: product.assetMint,
            owner: payer,
            uiTokenAmount: { amount: "10000" },
          },
          {
            accountIndex: 2,
            mint: overrides?.mint ?? product.assetMint,
            owner: overrides?.recipient ?? product.payTo,
            uiTokenAmount: { amount: overrides?.credited ?? "15000" },
          },
        ],
      },
    },
  });
  const validate = async (body: unknown) =>
    new SolanaSettlementValidator(
      "https://rpc.example",
      vi.fn(async () => new Response(JSON.stringify(body), { status: 200 })),
      1,
    ).validate({
      signature: "signature",
      payer,
      payTo: product.payTo,
      mint: product.assetMint,
      amountAtomic: product.priceAtomic,
    });

  it("accepts an exact USDC balance transfer from payer to recipient", async () => {
    await expect(validate(transaction())).resolves.toBeUndefined();
  });

  it.each([
    ["wrong amount", transaction({ credited: "14999" })],
    [
      "wrong mint",
      transaction({ mint: "WrongMint111111111111111111111111111111111" }),
    ],
    [
      "wrong recipient",
      transaction({ recipient: "WrongRecipient1111111111111111111111111111" }),
    ],
    [
      "failed transaction",
      transaction({ err: { InstructionError: [0, "Custom"] } }),
    ],
  ])("rejects %s from parsed onchain balances", async (_name, body) => {
    await expect(validate(body)).rejects.toThrow(/SETTLEMENT_/);
  });
});

function harness(settlement: Settlement) {
  const store = new MemoryPaymentStore();
  const facilitator: Facilitator = {
    settle: vi.fn(async (_header, requirements) => {
      expect(requirements.amount).toBe("10000");
      expect(requirements.asset).toBe(product.assetMint);
      expect(requirements.payTo).toBe(product.payTo);
      return settlement;
    }),
  };
  const middleware = createMeterKitMiddleware({ product, facilitator, store });
  const request = {
    header: vi.fn(() => Buffer.from('{"payment":"signed"}').toString("base64")),
  } as any;
  const response = {
    code: 200,
    body: undefined as any,
    headers: {} as Record<string, unknown>,
    status(code: number) {
      this.code = code;
      return this;
    },
    json(body: unknown) {
      this.body = body;
      return this;
    },
    set(name: string, value: unknown) {
      this.headers[name] = value;
      return this;
    },
  } as any;
  return { middleware, request, response, store };
}

describe("MeterKit middleware security", () => {
  it("returns an x402 v2 challenge without payment", async () => {
    const h = harness({ success: false });
    h.request.header.mockReturnValue(undefined);
    await h.middleware(h.request, h.response, vi.fn());
    expect(h.response.code).toBe(402);
    expect(h.response.headers["PAYMENT-REQUIRED"]).toBeTypeOf("string");
  });

  it("settles once and rejects a duplicate receipt", async () => {
    const h = harness({
      success: true,
      transaction: "sig-1",
      payer: product.payTo,
      network: SOLANA_DEVNET,
    });
    const next = vi.fn();
    await h.middleware(h.request, h.response, next);
    expect(next).toHaveBeenCalledOnce();
    await h.middleware(h.request, h.response, next);
    expect(h.response.code).toBe(409);
    expect(h.response.body.error).toBe("payment_replayed");
  });

  it.each(["wrong amount", "wrong mint", "wrong recipient"])(
    "rejects %s reported by facilitator",
    async () => {
      const h = harness({ success: false });
      await h.middleware(h.request, h.response, vi.fn());
      expect(h.response.code).toBe(402);
    },
  );

  it("rejects wrong network", async () => {
    const h = harness({
      success: true,
      transaction: "sig-2",
      payer: product.payTo,
      network: "solana:mainnet",
    });
    await h.middleware(h.request, h.response, vi.fn());
    expect(h.response.body.error).toBe("wrong_network");
  });

  it("rejects expired/invalid settlement", async () => {
    const h = harness({ success: false });
    await h.middleware(h.request, h.response, vi.fn());
    expect(h.response.body.error).toBe("payment_invalid");
  });
});
