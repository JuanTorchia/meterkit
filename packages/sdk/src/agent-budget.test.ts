import { describe, expect, it, vi } from "vitest";
import { SOLANA_DEVNET, type AgentAuthorizationView } from "@usemeterkit/core";
import { AgentBudgetGuard } from "./agent-budget.js";

const authorization: AgentAuthorizationView = {
  schemaVersion: 1,
  authorizationAddress: "9NXuBzJ3EQV4CuxpSVELD3t1bs5xZ6ocfGvwjFDbCZUG",
  program: "De1egAFMkMWZSN5rYXRj9CAdheBamobVNubTsi9avR44",
  network: SOLANA_DEVNET,
  kind: "fixed",
  owner: "8NXuBzJ3EQV4CuxpSVELD3t1bs5xZ6ocfGvwjFDbCZUF",
  delegate: "7NXuBzJ3EQV4CuxpSVELD3t1bs5xZ6ocfGvwjFDbCZUE",
  assetMint: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
  recipientScope: "6NXuBzJ3EQV4CuxpSVELD3t1bs5xZ6ocfGvwjFDbCZUD",
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

describe("AgentBudgetGuard", () => {
  it("reserves exact scope and returns only sanitized linkage", async () => {
    const reserveAllowanceSpend = vi.fn(async (input) => ({
      ...input,
      status: "reserved" as const,
    }));
    const store = {
      reserveAllowanceSpend,
      consumeAllowanceSpend: vi.fn(async () => true),
      releaseAllowanceSpend: vi.fn(async () => true),
    };
    const guard = new AgentBudgetGuard({
      authorization,
      delegate: authorization.delegate,
      store,
      now: () => new Date("2030-01-03T00:00:00.000Z"),
    });
    const reservation = await guard.reserve({
      payer: authorization.owner,
      network: SOLANA_DEVNET,
      assetMint: authorization.assetMint,
      recipient: authorization.recipientScope!,
      resource: authorization.resourceScopes[0]!,
      amountAtomic: "10000",
      paymentPayload: { payload: { transaction: "must-not-be-returned" } },
    });
    expect(reservation).toMatchObject({
      authorizationFingerprint: expect.stringMatching(/^sha256:[0-9a-f]{16}$/),
      paymentFingerprint: expect.stringMatching(/^sha256:[0-9a-f]{16}$/),
    });
    expect(JSON.stringify(reservation)).not.toContain("must-not-be-returned");
    expect(reserveAllowanceSpend).toHaveBeenCalledOnce();
    await expect(guard.consume(reservation.reservationId)).resolves.toBe(true);
  });

  it("rejects wrong scope, unknown finality and over-budget before persistence", async () => {
    const store = {
      reserveAllowanceSpend: vi.fn(),
      consumeAllowanceSpend: vi.fn(),
      releaseAllowanceSpend: vi.fn(),
    };
    const create = (view = authorization) =>
      new AgentBudgetGuard({
        authorization: view,
        delegate: authorization.delegate,
        store,
        now: () => new Date("2030-01-03T00:00:00.000Z"),
      });
    const request = {
      payer: authorization.owner,
      network: SOLANA_DEVNET,
      assetMint: authorization.assetMint,
      recipient: authorization.recipientScope!,
      resource: "https://api.example.com/premium-evil",
      amountAtomic: "10000",
      paymentPayload: {},
    };
    await expect(create().reserve(request)).rejects.toThrow(
      "RESOURCE_OUT_OF_SCOPE",
    );
    await expect(
      create({
        ...authorization,
        status: "unknown",
        observedCommitment: "unknown",
      }).reserve({
        ...request,
        resource: authorization.resourceScopes[0]!,
      }),
    ).rejects.toThrow("FINALITY_REQUIRED");
    await expect(
      create().reserve({
        ...request,
        resource: authorization.resourceScopes[0]!,
        amountAtomic: "10001",
      }),
    ).rejects.toThrow("PER_REQUEST_LIMIT_EXCEEDED");
    expect(store.reserveAllowanceSpend).not.toHaveBeenCalled();
  });
});
