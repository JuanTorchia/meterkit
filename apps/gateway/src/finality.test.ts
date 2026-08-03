import { describe, expect, it, vi } from "vitest";
import type { FinalityStore } from "@meterkit/database";
import { SolanaFinalityReconciler } from "./finality.js";

describe("SolanaFinalityReconciler", () => {
  it("promotes only successful finalized signatures", async () => {
    const markFinalized = vi.fn(async () => true);
    const store: FinalityStore = {
      listConfirmedSignatures: async () => ["final", "confirmed", "failed"],
      markFinalized,
    };
    const request = vi.fn(async () => new Response(JSON.stringify({
      result: { value: [
        { confirmationStatus: "finalized", err: null },
        { confirmationStatus: "confirmed", err: null },
        { confirmationStatus: "finalized", err: { InstructionError: [0, "Custom"] } },
      ] },
    }), { status: 200 }));
    const result = await new SolanaFinalityReconciler(store, "https://rpc.example", request).reconcile();
    expect(result).toEqual({ checked: 3, finalized: 1 });
    expect(markFinalized).toHaveBeenCalledExactlyOnceWith("final");
  });

  it("does not call RPC without pending receipts", async () => {
    const request = vi.fn();
    const reconciler = new SolanaFinalityReconciler({
      listConfirmedSignatures: async () => [],
      markFinalized: async () => false,
    }, "https://rpc.example", request);
    await expect(reconciler.reconcile()).resolves.toEqual({ checked: 0, finalized: 0 });
    expect(request).not.toHaveBeenCalled();
  });
});
