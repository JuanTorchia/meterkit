import { describe, expect, it, vi } from "vitest";
import { createWebacyPolicy } from "./index.js";

const input = {
  network: "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1" as const,
  assetMint: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
  amountAtomic: "10000",
  recipient: "7YttLkHDoNj9wyDur5zto7qLQyHQVwMkwXU88HZ6sW9",
  payer: "6YttLkHDoNj9wyDur5zto7qLQyHQVwMkwXU88HZ6sW8",
  resource: "https://api.example.test/premium",
};

function response(overallRisk: number, issues: unknown[] = []) {
  return new Response(
    JSON.stringify({
      overallRisk,
      issues,
      analyzed_at: "2026-08-10T00:00:00.000Z",
    }),
    {
      headers: { "content-type": "application/json" },
    },
  );
}

describe("createWebacyPolicy", () => {
  it.each([
    [10, "allow"],
    [40, "warn"],
    [80, "deny"],
  ] as const)("maps score %s to %s", async (score, outcome) => {
    const fetch = vi.fn(async () =>
      response(score, score ? [{ severity: "high" }] : []),
    );
    const policy = createWebacyPolicy({
      id: "webacy",
      apiKey: "never-log-me",
      fetch,
    });
    const decision = await policy.evaluate(input, new AbortController().signal);

    expect(decision.outcome).toBe(outcome);
    expect(decision.metadata).toMatchObject({ overallRisk: score });
    expect(fetch).toHaveBeenCalledWith(
      expect.stringMatching(/^https:\/\/api\.webacy\.com\/addresses\//),
      expect.objectContaining({ headers: { "x-api-key": "never-log-me" } }),
    );
    expect(JSON.stringify(decision)).not.toContain("never-log-me");
  });

  it("rejects a non-HTTPS or unapproved API origin", () => {
    expect(() =>
      createWebacyPolicy({
        id: "webacy",
        apiKey: "x",
        baseUrl: "http://api.webacy.com",
      }),
    ).toThrow("WEBACY_ORIGIN_INVALID");
    expect(() =>
      createWebacyPolicy({
        id: "webacy",
        apiKey: "x",
        baseUrl: "https://evil.example",
      }),
    ).toThrow("WEBACY_ORIGIN_INVALID");
  });

  it("bounds the response body", async () => {
    const fetch = vi.fn(async () => new Response("x".repeat(2_000)));
    const policy = createWebacyPolicy({
      id: "webacy",
      apiKey: "x",
      maxResponseBytes: 1_024,
      fetch,
    });
    await expect(
      policy.evaluate(input, new AbortController().signal),
    ).rejects.toThrow("WEBACY_RESPONSE_TOO_LARGE");
  });

  it("fails closed at the adapter boundary when payer is unavailable", async () => {
    const policy = createWebacyPolicy({
      id: "webacy",
      apiKey: "x",
      fetch: vi.fn(),
    });
    await expect(
      policy.evaluate(
        { ...input, payer: undefined },
        new AbortController().signal,
      ),
    ).rejects.toThrow("WEBACY_ADDRESS_UNAVAILABLE");
  });
});
