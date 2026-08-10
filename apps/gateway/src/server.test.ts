import { describe, expect, it, vi } from "vitest";
import type { ProductStore } from "@usemeterkit/database";
import {
  deleteHostedAllowanceMetadata,
  exportHostedAllowanceMetadata,
} from "./server.js";

const owner = "8SJE3aVLPpPgh5qsYJppsgdXdWusYUmJy3gfGKDEPsqS";
const allowance = {
  address: "9NXuBzJ3EQV4CuxpSVELD3t1bs5xZ6ocfGvwjFDbCZUG",
  ownerWallet: owner,
  delegateWallet: "8NXuBzJ3EQV4CuxpSVELD3t1bs5xZ6ocfGvwjFDbCZUF",
  mint: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
  maxAtomic: "50000",
  expiresAt: "2030-01-01T00:00:00.000Z",
  revokedAt: null,
  signature: "1".repeat(64),
};

describe("hosted metadata ownership", () => {
  it("requires a session and exports only the resolved owner", async () => {
    const list = vi.fn(async () => [allowance]);
    const store = { listAllowancesForOwner: list } as unknown as ProductStore;
    const resolveOwner = vi.fn(async (authorization?: string) =>
      authorization === "Bearer valid" ? owner : null,
    );
    await expect(
      exportHostedAllowanceMetadata(undefined, store, resolveOwner),
    ).resolves.toEqual({
      status: 401,
      body: { error: "wallet_session_required" },
    });
    const exported = await exportHostedAllowanceMetadata(
      "Bearer valid",
      store,
      resolveOwner,
      () => new Date("2026-08-10T00:00:00.000Z"),
    );
    expect(exported.status).toBe(200);
    expect(exported.body).toMatchObject({
      schemaVersion: 1,
      exportedAt: "2026-08-10T00:00:00.000Z",
    });
    expect(list).toHaveBeenCalledExactlyOnceWith(owner);
  });

  it("deletes only through the authenticated owner and is idempotently absent", async () => {
    const remove = vi.fn(async (candidate: string) => candidate === owner);
    const store = {
      deleteAllowanceMetadata: remove,
    } as unknown as ProductStore;
    const resolveOwner = vi.fn(async () => owner);
    await expect(
      deleteHostedAllowanceMetadata(
        "Bearer valid",
        allowance.address,
        store,
        resolveOwner,
      ),
    ).resolves.toEqual({ status: 204 });
    expect(remove).toHaveBeenCalledExactlyOnceWith(owner, allowance.address);

    remove.mockResolvedValueOnce(false);
    await expect(
      deleteHostedAllowanceMetadata(
        "Bearer valid",
        allowance.address,
        store,
        resolveOwner,
      ),
    ).resolves.toEqual({ status: 404 });
  });

  it("retains expired metadata for export until the owner explicitly deletes it", async () => {
    const expired = {
      ...allowance,
      startsAt: "2026-08-01T00:00:00.000Z",
      expiresAt: "2026-08-09T00:00:00.000Z",
      observedAt: "2026-08-10T00:00:00.000Z",
    };
    const store = {
      listAllowancesForOwner: vi.fn(async () => [expired]),
    } as unknown as ProductStore;
    const result = await exportHostedAllowanceMetadata(
      "Bearer valid",
      store,
      async () => owner,
      () => new Date("2026-08-10T00:00:00.000Z"),
    );
    expect(result.status).toBe(200);
    expect(result.body).toMatchObject({
      authorizations: [expect.objectContaining({ status: "expired" })],
    });
  });
});
