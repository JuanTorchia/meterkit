import { describe, expect, it } from "vitest";
import { MemoryPaymentStore, SOLANA_DEVNET } from "@usemeterkit/core";
import { protect } from "./protect.js";

const product = {
  id: "weather",
  name: "Premium Weather API",
  description: "Paid weather data",
  resource: "https://api.example.com/premium",
  priceAtomic: "10000",
  assetMint: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
  payTo: "11111111111111111111111111111111",
  network: SOLANA_DEVNET,
};

describe("protect", () => {
  it("validates configuration synchronously", () => {
    expect(() => protect({ product: { ...product, resource: "javascript:alert(1)" }, store: new MemoryPaymentStore() })).toThrow("CONFIG_INVALID");
    expect(() => protect({ product, store: new MemoryPaymentStore(), rpcUrl: false })).not.toThrow();
  });
});
