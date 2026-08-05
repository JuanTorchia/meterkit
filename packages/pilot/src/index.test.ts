import { describe, expect, it } from "vitest";
import {
  parsePolicy,
  SOLANA_DEVNET_NETWORK,
  SOLANA_DEVNET_USDC_MINT,
  verifyEndpoint,
} from "./index.js";

const requirement = {
  x402Version: 2,
  accepts: [{
    scheme: "exact",
    network: SOLANA_DEVNET_NETWORK,
    amount: "10000",
    asset: SOLANA_DEVNET_USDC_MINT,
    payTo: "9a4xvgAdtPxJf7eifkCTpUwwqd8Q8u8L6QJzwCCeaiR5",
    maxTimeoutSeconds: 300,
  }],
};
const acceptedRequirement = requirement.accepts[0]!;

describe("pilot endpoint verifier", () => {
  it("accepts a policy-matching x402 endpoint", async () => {
    const report = await verifyEndpoint("https://api.example.test/premium", {
      network: acceptedRequirement.network,
      mint: acceptedRequirement.asset,
      recipient: acceptedRequirement.payTo,
      maxAmountAtomic: "10000",
    }, async () => new Response(null, {
      status: 402,
      headers: { "PAYMENT-REQUIRED": Buffer.from(JSON.stringify(requirement)).toString("base64") },
    }));
    expect(report.passed).toBe(true);
    expect(report.requirement?.amountAtomic).toBe("10000");
  });

  it("fails closed when amount or recipient violates policy", async () => {
    const report = await verifyEndpoint("https://api.example.test/premium", {
      network: acceptedRequirement.network,
      mint: acceptedRequirement.asset,
      recipient: "7NXuBzJ3EQV4CuxpSVELD3t1bs5xZ6ocfGvwjFDbCZUE",
      maxAmountAtomic: "9999",
    }, async () => new Response(null, {
      status: 402,
      headers: { "PAYMENT-REQUIRED": Buffer.from(JSON.stringify(requirement)).toString("base64") },
    }));
    expect(report.passed).toBe(false);
    expect(report.checks.filter((check) => !check.ok)).toHaveLength(2);
  });

  it("rejects a non-402 endpoint without throwing", async () => {
    const report = await verifyEndpoint("https://api.example.test/open", {}, async () =>
      new Response("ok", { status: 200 }));
    expect(report.passed).toBe(false);
    expect(report.checks[0]?.error).toContain("expected 402");
  });

  it("does not pass when required policy values are omitted", async () => {
    const report = await verifyEndpoint("https://api.example.test/premium", {}, async () =>
      new Response(null, {
        status: 402,
        headers: { "PAYMENT-REQUIRED": Buffer.from(JSON.stringify(requirement)).toString("base64") },
      }));
    expect(report.passed).toBe(false);
    expect(report.checks.filter((check) => check.evidence?.enforced === false)).toHaveLength(4);
    expect(report.checks.filter((check) => check.evidence?.enforced === false).every((check) => !check.ok)).toBe(true);
  });

  it("requires the exact payment scheme", async () => {
    const invalid = {
      ...requirement,
      accepts: [{ ...acceptedRequirement, scheme: "upto" }],
    };
    const report = await verifyEndpoint("https://api.example.test/premium", {
      network: acceptedRequirement.network,
      mint: acceptedRequirement.asset,
      recipient: acceptedRequirement.payTo,
      maxAmountAtomic: "10000",
    }, async () => new Response(null, {
      status: 402,
      headers: { "PAYMENT-REQUIRED": Buffer.from(JSON.stringify(invalid)).toString("base64") },
    }));
    expect(report.passed).toBe(false);
    expect(report.checks.find((check) => check.name === "payment scheme is exact")?.ok).toBe(false);
  });

  it("rejects a policy and challenge outside supported Solana devnet USDC", async () => {
    const unsupported = {
      ...requirement,
      accepts: [{ ...acceptedRequirement, network: "not-solana", asset: acceptedRequirement.payTo }],
    };
    const report = await verifyEndpoint("https://api.example.test/premium", {
      network: "not-solana",
      mint: acceptedRequirement.payTo,
      recipient: acceptedRequirement.payTo,
      maxAmountAtomic: "10000",
    }, async () => new Response(null, {
      status: 402,
      headers: { "PAYMENT-REQUIRED": Buffer.from(JSON.stringify(unsupported)).toString("base64") },
    }));
    expect(report.passed).toBe(false);
    expect(report.checks.find((check) => check.name === "network is supported Solana devnet")?.ok).toBe(false);
    expect(report.checks.find((check) => check.name === "asset is supported devnet USDC")?.ok).toBe(false);
  });

  it("selects a later accepted method that satisfies the complete policy", async () => {
    const alternatives = {
      ...requirement,
      accepts: [
        { ...acceptedRequirement, amount: "20000" },
        acceptedRequirement,
      ],
    };
    const report = await verifyEndpoint("https://api.example.test/premium", {
      network: acceptedRequirement.network,
      mint: acceptedRequirement.asset,
      recipient: acceptedRequirement.payTo,
      maxAmountAtomic: "10000",
    }, async () => new Response(null, {
      status: 402,
      headers: { "PAYMENT-REQUIRED": Buffer.from(JSON.stringify(alternatives)).toString("base64") },
    }));
    expect(report.passed).toBe(true);
    expect(report.requirement?.amountAtomic).toBe("10000");
  });

  it("ignores malformed alternatives when a later method satisfies policy", async () => {
    const alternatives = {
      ...requirement,
      accepts: [
        { scheme: "exact", amount: "not-atomic" },
        acceptedRequirement,
      ],
    };
    const report = await verifyEndpoint("https://api.example.test/premium", {
      network: acceptedRequirement.network,
      mint: acceptedRequirement.asset,
      recipient: acceptedRequirement.payTo,
      maxAmountAtomic: "10000",
    }, async () => new Response(null, {
      status: 402,
      headers: { "PAYMENT-REQUIRED": Buffer.from(JSON.stringify(alternatives)).toString("base64") },
    }));
    expect(report.passed).toBe(true);
    expect(report.requirement?.recipient).toBe(acceptedRequirement.payTo);
  });

  it.each([
    "http://127.0.0.1:3402/premium",
    "http://10.0.0.1/premium",
    "http://169.254.169.254/latest/meta-data",
    "http://[::1]/premium",
    "http://[fd00::1]/premium",
  ])("blocks unsafe endpoint %s before fetch", async (endpoint) => {
    let fetched = false;
    const report = await verifyEndpoint(endpoint, {
      network: acceptedRequirement.network,
      mint: acceptedRequirement.asset,
      recipient: acceptedRequirement.payTo,
      maxAmountAtomic: "10000",
    }, async () => {
      fetched = true;
      return new Response();
    });
    expect(report.passed).toBe(false);
    expect(fetched).toBe(false);
    expect(report.checks.at(-1)?.name).toBe("endpoint can be verified safely");
  });

  it("rejects plain HTTP for non-local endpoints", async () => {
    const report = await verifyEndpoint("http://api.example.test/premium", {
      network: acceptedRequirement.network,
      mint: acceptedRequirement.asset,
      recipient: acceptedRequirement.payTo,
      maxAmountAtomic: "10000",
    }, async () => new Response());
    expect(report.passed).toBe(false);
    expect(report.checks.at(-1)?.error).toContain("must use https");
  });

  it("allows localhost only with the explicit development flag", async () => {
    const policy = {
      network: acceptedRequirement.network,
      mint: acceptedRequirement.asset,
      recipient: acceptedRequirement.payTo,
      maxAmountAtomic: "10000",
      allowLocalhost: true,
    };
    const report = await verifyEndpoint("http://localhost:3402/premium", policy, async () =>
      new Response(null, {
        status: 402,
        headers: { "PAYMENT-REQUIRED": Buffer.from(JSON.stringify(requirement)).toString("base64") },
      }));
    expect(report.passed).toBe(true);
  });

  it("allows an IPv4 loopback endpoint only with the explicit development flag", async () => {
    const report = await verifyEndpoint("http://127.0.0.1:3402/premium", {
      network: acceptedRequirement.network,
      mint: acceptedRequirement.asset,
      recipient: acceptedRequirement.payTo,
      maxAmountAtomic: "10000",
      allowLocalhost: true,
    }, async () => new Response(null, {
      status: 402,
      headers: { "PAYMENT-REQUIRED": Buffer.from(JSON.stringify(requirement)).toString("base64") },
    }));
    expect(report.passed).toBe(true);
  });

  it("parses only known, correctly typed policy fields", () => {
    expect(parsePolicy({
      network: acceptedRequirement.network,
      mint: acceptedRequirement.asset,
      recipient: acceptedRequirement.payTo,
      maxAmountAtomic: "10000",
      allowLocalhost: true,
    })).toEqual({
      network: acceptedRequirement.network,
      mint: acceptedRequirement.asset,
      recipient: acceptedRequirement.payTo,
      maxAmountAtomic: "10000",
      allowLocalhost: true,
    });
    expect(() => parsePolicy({ allowLocalhost: "yes" })).toThrow("allowLocalhost must be a boolean");
    expect(() => parsePolicy({ typo: true })).toThrow("unknown field");
  });
});
