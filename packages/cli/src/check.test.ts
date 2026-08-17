import { describe, expect, it } from "vitest";

import { checkEndpoint } from "./check.js";
import { fixturePolicy } from "./test-fixtures.js";

const requirement = {
  x402Version: 2,
  accepts: [
    {
      scheme: "exact",
      network: fixturePolicy.network,
      amount: fixturePolicy.amountAtomic,
      asset: fixturePolicy.mint,
      payTo: fixturePolicy.recipient,
      maxTimeoutSeconds: 300,
    },
  ],
};

describe("meterkit check", () => {
  it("decodes and returns the exact unpaid challenge terms", async () => {
    const result = await checkEndpoint(fixturePolicy.resource, {
      fetch: async () =>
        new Response(null, {
          status: 402,
          headers: {
            "PAYMENT-REQUIRED": Buffer.from(
              JSON.stringify(requirement),
            ).toString("base64"),
          },
        }),
      allowLocalhost: true,
    });

    expect(result).toEqual({
      status: 402,
      x402Version: 2,
      network: fixturePolicy.network,
      mint: fixturePolicy.mint,
      amountAtomic: fixturePolicy.amountAtomic,
      recipient: fixturePolicy.recipient,
      resource: fixturePolicy.resource,
    });
  });

  it("does not treat an ordinary successful response as discovery", async () => {
    await expect(
      checkEndpoint("https://provider.example/premium", {
        fetch: async () => new Response("ok", { status: 200 }),
      }),
    ).rejects.toThrow("expected HTTP 402");
  });

  it("rejects missing payment-required headers", async () => {
    await expect(
      checkEndpoint("https://provider.example/premium", {
        fetch: async () => new Response(null, { status: 402 }),
      }),
    ).rejects.toThrow("PAYMENT-REQUIRED header is missing");
  });
});
