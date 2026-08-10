import { describe, expect, it, vi } from "vitest";
import { runPaymentPolicies } from "./policy-runner.js";

const input = {
  network: "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1" as const,
  assetMint: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
  amountAtomic: "10000",
  recipient: "11111111111111111111111111111111",
  resource: "https://api.example.com:443/premium",
};

describe("runPaymentPolicies", () => {
  it("preserves ordered decisions and denies enforced deny", async () => {
    const first = {
      id: "first",
      evaluate: vi.fn(async () => ({
        policyId: "first",
        provider: "fixture",
        outcome: "allow" as const,
        reasonCodes: ["OK"],
        evaluatedAt: new Date().toISOString(),
      })),
    };
    const second = {
      id: "second",
      evaluate: vi.fn(async () => ({
        policyId: "second",
        provider: "fixture",
        outcome: "deny" as const,
        reasonCodes: ["RISK_HIGH"],
        evaluatedAt: new Date().toISOString(),
      })),
    };
    const result = await runPaymentPolicies(input, [
      { evaluator: first, configuration: { id: "first" } },
      { evaluator: second, configuration: { id: "second" } },
    ]);
    expect(result.allowed).toBe(false);
    expect(result.decisions.map((item) => item.policyId)).toEqual([
      "first",
      "second",
    ]);
  });

  it("applies explicit error policy on timeout", async () => {
    const evaluator = {
      id: "slow",
      evaluate: vi.fn(
        async (_input: unknown, signal: AbortSignal) =>
          new Promise<never>((_resolve, reject) =>
            signal.addEventListener("abort", () => reject(signal.reason)),
          ),
      ),
    };
    const result = await runPaymentPolicies(input, [
      {
        evaluator,
        configuration: { id: "slow", timeoutMs: 100, onError: "allow" },
      },
    ]);
    expect(result.allowed).toBe(true);
    expect(result.decisions[0]).toMatchObject({
      outcome: "error",
      onErrorApplied: "allow",
    });
  });
});
