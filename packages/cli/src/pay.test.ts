import { chmod, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { SOLANA_DEVNET } from "@usemeterkit/core";
import {
  parsePaymentResponse,
  readKeypairFile,
  validatePaymentTerms,
} from "./pay.js";

const recipient = "7NXuBzJ3EQV4CuxpSVELD3t1bs5xZ6ocfGvwjFDbCZUE";
const mint = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
const options = {
  endpoint: "http://localhost:3000/premium",
  recipient,
  mint,
  maxAmountAtomic: "10000",
  maxSessionAtomic: "20000",
  replay: true,
};

describe("bounded devnet payment", () => {
  it("accepts only the exact policy and spend limit", () => {
    expect(() =>
      validatePaymentTerms(
        {
          network: SOLANA_DEVNET,
          asset: mint,
          payTo: recipient,
          amount: "10000",
          resource: { url: options.endpoint },
        },
        options,
      ),
    ).not.toThrow();
    expect(() =>
      validatePaymentTerms(
        {
          network: SOLANA_DEVNET,
          asset: mint,
          payTo: recipient,
          amount: "10001",
          resource: { url: options.endpoint },
        },
        options,
      ),
    ).toThrow("PAYMENT_AMOUNT_EXCEEDS_LIMIT");
    expect(() =>
      validatePaymentTerms(
        {
          network: "solana:mainnet",
          asset: mint,
          payTo: recipient,
          amount: "1",
          resource: { url: options.endpoint },
        },
        options,
      ),
    ).toThrow("PAYMENT_NETWORK_NOT_ALLOWED");
  });

  it("reads a local 0600 keypair without returning its bytes in errors", async () => {
    const directory = await mkdtemp(join(tmpdir(), "meterkit-pay-"));
    const path = join(directory, "payer.json");
    await writeFile(
      path,
      JSON.stringify(Array.from({ length: 64 }, (_, index) => index)),
      { mode: 0o600 },
    );
    expect(await readKeypairFile(path)).toHaveLength(64);
    if (process.platform !== "win32") {
      await chmod(path, 0o644);
      await expect(readKeypairFile(path)).rejects.toThrow("0600");
    }
  });

  it("requires a correlated devnet settlement response before success", () => {
    const header = Buffer.from(
      JSON.stringify({
        success: true,
        transaction: "settlement-signature",
        network: SOLANA_DEVNET,
      }),
    ).toString("base64");
    expect(parsePaymentResponse(header)).toMatchObject({
      transaction: "settlement-signature",
      network: SOLANA_DEVNET,
    });
    expect(() => parsePaymentResponse(null)).toThrow(
      "PAYMENT_RESPONSE_MISSING",
    );
    expect(() =>
      parsePaymentResponse(
        Buffer.from(
          JSON.stringify({
            success: true,
            transaction: "settlement-signature",
            network: "solana:mainnet",
          }),
        ).toString("base64"),
      ),
    ).toThrow("PAYMENT_RESPONSE_INVALID");
  });
});
