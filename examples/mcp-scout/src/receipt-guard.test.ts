import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { FileReceiptGuard } from "./receipt-guard.js";

const directories: string[] = [];

afterEach(async () => {
  await Promise.all(directories.splice(0).map((directory) =>
    rm(directory, { recursive: true, force: true })));
});

describe("FileReceiptGuard", () => {
  it("atomically rejects a receipt reused by concurrent calls", async () => {
    const directory = await mkdtemp(join(tmpdir(), "meterkit-receipts-"));
    directories.push(directory);
    const guard = new FileReceiptGuard(directory);
    const results = await Promise.allSettled([
      guard.claim("same-transaction"),
      guard.claim("same-transaction"),
    ]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    const rejected = results.find((result) => result.status === "rejected");
    expect(rejected).toMatchObject({
      status: "rejected",
      reason: expect.objectContaining({ message: "PAYMENT_REPLAYED" }),
    });
  });
});
