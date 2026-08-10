import { describe, expect, it } from "vitest";
import { agentAuthorizationViewSchema } from "./authorization.js";

const address = "11111111111111111111111111111111";
const transaction = "1".repeat(64);
const view = {
  schemaVersion: 1,
  authorizationAddress: address,
  program: "De1egAFMkMWZSN5rYXRj9CAdheBamobVNubTsi9avR44",
  network: "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1",
  kind: "fixed",
  owner: address,
  delegate: address,
  assetMint: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
  recipientScope: address,
  resourceScopes: ["https://api.example.com/premium"],
  perRequestLimitAtomic: "10000",
  aggregateLimitAtomic: "50000",
  spentAtomic: "10000",
  startsAt: "2026-08-10T00:00:00.000Z",
  expiresAt: "2026-09-10T00:00:00.000Z",
  status: "active",
  creationTransaction: transaction,
  observedCommitment: "finalized",
  observedAt: "2026-08-10T00:01:00.000Z",
} as const;

describe("agent authorization views", () => {
  it("accepts bounded inspectable authorizations", () => {
    expect(agentAuthorizationViewSchema.parse(view)).toEqual(view);
  });

  it("rejects overspend, inverted limits, invalid expiry and unsupported networks", () => {
    expect(() =>
      agentAuthorizationViewSchema.parse({ ...view, spentAtomic: "50001" }),
    ).toThrow(/exceeds aggregate/);
    expect(() =>
      agentAuthorizationViewSchema.parse({
        ...view,
        perRequestLimitAtomic: "50001",
      }),
    ).toThrow(/per-request/);
    expect(() =>
      agentAuthorizationViewSchema.parse({ ...view, expiresAt: view.startsAt }),
    ).toThrow(/expiry/);
    expect(() =>
      agentAuthorizationViewSchema.parse({
        ...view,
        network: "solana-mainnet",
      }),
    ).toThrow();
  });

  it("requires coherent exhausted and revoked evidence", () => {
    expect(() =>
      agentAuthorizationViewSchema.parse({ ...view, status: "exhausted" }),
    ).toThrow(/consume/);
    expect(() =>
      agentAuthorizationViewSchema.parse({ ...view, status: "revoked" }),
    ).toThrow(/transaction evidence/);
    expect(
      agentAuthorizationViewSchema.parse({
        ...view,
        status: "revoked",
        revocationTransaction: transaction,
      }).status,
    ).toBe("revoked");
  });
});
