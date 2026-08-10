import { describe, expect, it } from "vitest";
import { productSchema, SOLANA_DEVNET } from "./index.js";

const base = {
  name: "Premium Weather",
  description: "Bounded weather result",
  resource: "https://api.example/v1/products/premium-weather/proxy",
  priceAtomic: "10000",
  assetMint: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
  payTo: "7NXuBzJ3EQV4CuxpSVELD3t1bs5xZ6ocfGvwjFDbCZUE",
  network: SOLANA_DEVNET,
};

describe("product identity", () => {
  it.each(["premium-weather", "a", "a1", "weather-2026"])(
    "accepts canonical slug %s",
    (id) => {
      expect(productSchema.parse({ ...base, id }).id).toBe(id);
    },
  );

  it.each([
    "Premium-Weather",
    "premium_weather",
    "/premium",
    "premium/",
    "-premium",
    "premium-",
    "a".repeat(64),
    "premium--weather/evil",
  ])("rejects an unreachable or ambiguous slug %s", (id) => {
    expect(productSchema.safeParse({ ...base, id }).success).toBe(false);
  });
});
