import { describe, expect, it } from "vitest";
import {
  SOLANA_DEVNET_NETWORK,
  SOLANA_DEVNET_USDC_MINT,
  verifyEndpoint,
} from "./verify.js";

const recipient = "7NXuBzJ3EQV4CuxpSVELD3t1bs5xZ6ocfGvwjFDbCZUE";
const challenge = (overrides: Record<string, unknown> = {}) =>
  Buffer.from(
    JSON.stringify({
      x402Version: 2,
      accepts: [
        {
          scheme: "exact",
          network: SOLANA_DEVNET_NETWORK,
          asset: SOLANA_DEVNET_USDC_MINT,
          amount: "10000",
          payTo: recipient,
          ...overrides,
        },
      ],
    }),
  ).toString("base64");

describe("strict public verifier", () => {
  it("requires every policy value and reports correlation mismatches", async () => {
    const response = async () =>
      new Response(null, {
        status: 402,
        headers: { "payment-required": challenge() },
      });
    const missing = await verifyEndpoint(
      "http://localhost:3000/premium",
      { allowLocalhost: true },
      response,
    );
    expect(missing.passed).toBe(false);
    const mismatch = await verifyEndpoint(
      "http://localhost:3000/premium",
      {
        allowLocalhost: true,
        network: SOLANA_DEVNET_NETWORK,
        mint: SOLANA_DEVNET_USDC_MINT,
        recipient,
        maxAmountAtomic: "9999",
      },
      response,
    );
    expect(mismatch.passed).toBe(false);
    expect(
      mismatch.checks.some(({ error }) => error === "amount exceeds maximum"),
    ).toBe(true);
  });

  it("blocks localhost unless explicitly enabled and rejects credential URLs", async () => {
    expect((await verifyEndpoint("http://127.0.0.1:3000/premium")).passed).toBe(
      false,
    );
    expect(
      (await verifyEndpoint("https://user:pass@example.com/premium")).passed,
    ).toBe(false);
  });
});
