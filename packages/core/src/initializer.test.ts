import { describe, expect, it } from "vitest";
import { initializerPlanSchema } from "./initializer.js";

const plan = {
  schemaVersion: 1,
  initializerVersion: "0.3.0",
  surface: "express",
  targetDirectory: "/tmp/weather-api",
  packageManager: "pnpm",
  network: "solana-devnet",
  durability: "memory",
  files: [{ path: "src/server.ts", fingerprint: `sha256:${"a".repeat(64)}` }],
  dependencies: {
    "@usemeterkit/sdk": "0.3.0",
    "@usemeterkit/database": "0.3.0",
  },
  environmentKeys: ["MERCHANT_WALLET", "SOLANA_RPC_URL"],
  warnings: ["TEST_ASSETS_REQUIRED"],
} as const;

describe("initializer plans", () => {
  it("accepts deterministic devnet-only plans", () => {
    expect(initializerPlanSchema.parse(plan)).toEqual(plan);
  });

  it.each([
    "../secret",
    "src/../secret",
    "/absolute",
    "src\\server.ts",
    "bad\0name",
  ])("rejects unsafe template path %s", (path) =>
    expect(() =>
      initializerPlanSchema.parse({
        ...plan,
        files: [{ path, fingerprint: `sha256:${"a".repeat(64)}` }],
      }),
    ).toThrow(/normalized and relative/),
  );

  it("rejects mainnet, duplicate files, secret-like keys and unknown fields", () => {
    expect(() =>
      initializerPlanSchema.parse({ ...plan, network: "solana-mainnet" }),
    ).toThrow();
    expect(() =>
      initializerPlanSchema.parse({
        ...plan,
        files: [...plan.files, ...plan.files],
      }),
    ).toThrow(/unique/);
    expect(() =>
      initializerPlanSchema.parse({
        ...plan,
        environmentKeys: ["SOLANA_PRIVATE_KEY"],
      }),
    ).toThrow(/secret-like/);
    expect(() =>
      initializerPlanSchema.parse({ ...plan, privateKey: "no" }),
    ).toThrow();
  });
});
