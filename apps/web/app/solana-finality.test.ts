import { describe, expect, it, vi } from "vitest";
import { waitForFinalizedSignature } from "./solana-finality.js";

function rpcResponse(status: string | null, err: unknown = null) {
  return new Response(
    JSON.stringify({
      jsonrpc: "2.0",
      result: {
        value: status ? [{ confirmationStatus: status, err }] : [null],
      },
    }),
    { status: 200, headers: { "content-type": "application/json" } },
  );
}

describe("revocation finality", () => {
  it("waits until the signature is finalized", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(rpcResponse("confirmed"))
      .mockResolvedValueOnce(rpcResponse("finalized"));
    await expect(
      waitForFinalizedSignature("signature", "https://rpc.test", fetcher, {
        attempts: 2,
        intervalMs: 0,
      }),
    ).resolves.toBeUndefined();
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("fails when the transaction has an onchain error", async () => {
    await expect(
      waitForFinalizedSignature(
        "signature",
        "https://rpc.test",
        async () =>
          rpcResponse("finalized", { InstructionError: [0, "Custom"] }),
        { attempts: 1 },
      ),
    ).rejects.toThrow("failed onchain");
  });

  it("does not claim success when finality times out", async () => {
    await expect(
      waitForFinalizedSignature(
        "signature",
        "https://rpc.test",
        async () => rpcResponse("confirmed"),
        { attempts: 2, intervalMs: 0 },
      ),
    ).rejects.toThrow("finality was not reached");
  });
});
