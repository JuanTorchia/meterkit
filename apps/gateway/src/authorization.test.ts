import { describe, expect, it } from "vitest";
import { toHostedAuthorization } from "./authorization.js";

const record = {
  address: "9NXuBzJ3EQV4CuxpSVELD3t1bs5xZ6ocfGvwjFDbCZUG",
  ownerWallet: "8NXuBzJ3EQV4CuxpSVELD3t1bs5xZ6ocfGvwjFDbCZUF",
  delegateWallet: "7NXuBzJ3EQV4CuxpSVELD3t1bs5xZ6ocfGvwjFDbCZUE",
  mint: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
  maxAtomic: "50000",
  perRequestAtomic: "10000",
  spentAtomic: "10000",
  reservedAtomic: "5000",
  expiresAt: "2030-02-01T00:00:00.000Z",
  startsAt: "2030-01-01T00:00:00.000Z",
  revokedAt: null,
  signature: "1".repeat(64),
  status: "unknown" as const,
  recipientScope: "6NXuBzJ3EQV4CuxpSVELD3t1bs5xZ6ocfGvwjFDbCZUD",
  resourceScopes: ["https://api.example.com/premium"],
  observedCommitment: "unknown" as const,
  observedAt: "2030-01-03T00:00:00.000Z",
  revocationSignature: null,
};

describe("hosted authorization projection", () => {
  it("exposes bounded capacity without persistence internals", () => {
    expect(toHostedAuthorization(record)).toMatchObject({
      authorizationAddress: record.address,
      aggregateLimitAtomic: "50000",
      spentAtomic: "10000",
      reservedAtomic: "5000",
      remainingCapacityAtomic: "35000",
      status: "unknown",
      observedCommitment: "unknown",
    });
  });

  it("requires public evidence before reporting revoked", () => {
    expect(() =>
      toHostedAuthorization({
        ...record,
        status: "revoked",
        revokedAt: "2030-01-04T00:00:00.000Z",
      }),
    ).toThrow(/transaction evidence/);
    expect(
      toHostedAuthorization({
        ...record,
        status: "revoked",
        revokedAt: "2030-01-04T00:00:00.000Z",
        revocationSignature: "2".repeat(64),
        observedCommitment: "finalized",
      }).status,
    ).toBe("revoked");
  });
});
