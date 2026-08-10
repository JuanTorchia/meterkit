import { describe, expect, it } from "vitest";
import type { AgentAuthorizationView } from "@usemeterkit/core";
import { evaluateAgentSpend } from "./policy.js";

const owner = "11111111111111111111111111111111";
const delegate = "7NXuBzJ3EQV4CuxpSVELD3t1bs5xZ6ocfGvwjFDbCZUE";
const mint = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
const recipient = "8NXuBzJ3EQV4CuxpSVELD3t1bs5xZ6ocfGvwjFDbCZUF";
const authorization: AgentAuthorizationView = {
  schemaVersion: 1,
  authorizationAddress: "9NXuBzJ3EQV4CuxpSVELD3t1bs5xZ6ocfGvwjFDbCZUG",
  program: "De1egAFMkMWZSN5rYXRj9CAdheBamobVNubTsi9avR44",
  network: "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1",
  kind: "fixed",
  owner,
  delegate,
  assetMint: mint,
  recipientScope: recipient,
  resourceScopes: ["https://api.example.com/premium"],
  perRequestLimitAtomic: "10000",
  aggregateLimitAtomic: "50000",
  spentAtomic: "10000",
  startsAt: "2030-01-01T00:00:00.000Z",
  expiresAt: "2030-02-01T00:00:00.000Z",
  status: "active",
  observedCommitment: "finalized",
  observedAt: "2030-01-02T00:00:00.000Z",
};
const request = {
  owner,
  delegate,
  network: authorization.network,
  assetMint: mint,
  recipient,
  resource: "https://api.example.com/premium",
  amountAtomic: 10_000n,
  now: new Date("2030-01-03T00:00:00.000Z"),
};

describe("bounded agent spending policy", () => {
  it("accepts an exact finalized spend inside both limits", () => {
    expect(evaluateAgentSpend(authorization, request)).toEqual({
      allowed: true,
      code: "AUTHORIZED",
      remainingAtomic: 30_000n,
    });
  });

  it.each([
    ["owner", { owner: delegate }, "OWNER_MISMATCH"],
    ["delegate", { delegate: owner }, "DELEGATE_MISMATCH"],
    ["network", { network: "solana:mainnet" }, "NETWORK_MISMATCH"],
    ["mint", { assetMint: recipient }, "ASSET_MISMATCH"],
    ["recipient", { recipient: owner }, "RECIPIENT_MISMATCH"],
    [
      "resource prefix",
      { resource: "https://api.example.com/premium-evil" },
      "RESOURCE_OUT_OF_SCOPE",
    ],
    [
      "origin",
      { resource: "https://evil.example/premium" },
      "RESOURCE_OUT_OF_SCOPE",
    ],
    [
      "port",
      { resource: "https://api.example.com:444/premium" },
      "RESOURCE_OUT_OF_SCOPE",
    ],
    ["per request", { amountAtomic: 10_001n }, "PER_REQUEST_LIMIT_EXCEEDED"],
  ])("rejects %s mismatch", (_name, override, code) => {
    expect(
      evaluateAgentSpend(authorization, { ...request, ...override }),
    ).toMatchObject({
      allowed: false,
      code,
    });
  });

  it("rejects expiry, aggregate overspend, revocation and unknown finality", () => {
    expect(
      evaluateAgentSpend(authorization, {
        ...request,
        now: new Date(authorization.expiresAt),
      }),
    ).toMatchObject({ code: "AUTHORIZATION_EXPIRED" });
    expect(
      evaluateAgentSpend(
        { ...authorization, spentAtomic: "45000" },
        { ...request, amountAtomic: 6_000n },
      ),
    ).toMatchObject({ code: "AGGREGATE_LIMIT_EXCEEDED" });
    expect(
      evaluateAgentSpend(
        {
          ...authorization,
          status: "revoked",
          revocationTransaction: "1".repeat(64),
        },
        request,
      ),
    ).toMatchObject({ code: "AUTHORIZATION_REVOKED" });
    expect(
      evaluateAgentSpend(
        { ...authorization, observedCommitment: "unknown", status: "unknown" },
        request,
      ),
    ).toMatchObject({ code: "FINALITY_REQUIRED" });
  });
});
