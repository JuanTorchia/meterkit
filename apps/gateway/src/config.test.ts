import { describe, expect, it } from "vitest";
import { loadGatewayConfig, requirePersistentMerchant } from "./config.js";

const merchant = "9a4xvgAdtPxJf7eifkCTpUwwqd8Q8u8L6QJzwCCeaiR5";

describe("hosted gateway configuration", () => {
  it("uses the hosting PORT and public HTTPS resource in the x402 challenge", () => {
    const config = loadGatewayConfig({
      METERKIT_NETWORK: "solana-devnet",
      PORT: "8080",
      TRUST_PROXY_HOPS: "1",
      PUBLIC_GATEWAY_URL: "https://api.demo.meterkit.dev/",
      MERCHANT_WALLET: merchant,
    });

    expect(config.port).toBe(8080);
    expect(config.trustProxyHops).toBe(1);
    expect(config.product.resource).toBe(
      "https://api.demo.meterkit.dev/v1/weather/premium",
    );
    expect(config.product.payTo).toBe(merchant);
  });

  it("fails closed for mainnet, unsafe public HTTP and invalid ports", () => {
    expect(() => loadGatewayConfig({ METERKIT_NETWORK: "solana-mainnet" }))
      .toThrow(/only supports solana-devnet/);
    expect(() => loadGatewayConfig({
      PUBLIC_GATEWAY_URL: "http://api.demo.meterkit.dev",
    })).toThrow(/must use HTTPS/);
    expect(() => loadGatewayConfig({ PORT: "70000" })).toThrow(/PORT/);
    expect(() => loadGatewayConfig({ TRUST_PROXY_HOPS: "many" }))
      .toThrow(/TRUST_PROXY_HOPS/);
  });

  it("requires an explicit provider wallet when persistence is enabled", () => {
    expect(() => requirePersistentMerchant({
      DATABASE_URL: "postgresql://example",
    })).toThrow(/MERCHANT_WALLET/);
    expect(() => requirePersistentMerchant({
      DATABASE_URL: "postgresql://example",
      MERCHANT_WALLET: merchant,
    })).not.toThrow();
  });
});
