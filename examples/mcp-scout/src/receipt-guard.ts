import { createHash } from "node:crypto";
import { mkdir, open, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { publicPaymentReceiptSchema, type PublicPaymentReceipt } from "@usemeterkit/core";

/**
 * Durable, process-independent replay guard for the demo MCP server.
 * Filenames contain only a SHA-256 digest, not the public transaction signature.
 */
export class FileReceiptGuard {
  constructor(private readonly directory: string) {}

  async claim(signature: string) {
    return this.claimOnce("receipt", signature, "PAYMENT_REPLAYED");
  }

  async claimPreview(scope: string) {
    return this.claimOnce("preview", scope, "PREVIEW_ALREADY_USED");
  }

  async savePublicReceipt(raw: PublicPaymentReceipt) {
    const receipt = publicPaymentReceiptSchema.parse(raw);
    const directory = resolve(this.directory);
    await mkdir(directory, { recursive: true, mode: 0o700 });
    await writeFile(resolve(directory, `${receipt.receiptId}.receipt.json`), `${JSON.stringify(receipt, null, 2)}\n`, { flag: "wx", mode: 0o600 });
  }

  private async claimOnce(namespace: string, value: string, duplicateError: string) {
    const digest = createHash("sha256").update(`${namespace}:${value}`).digest("hex");
    const directory = resolve(this.directory);
    await mkdir(directory, { recursive: true, mode: 0o700 });
    try {
      const handle = await open(resolve(directory, `${digest}.${namespace}`), "wx", 0o600);
      await handle.writeFile(`${new Date().toISOString()}\n`);
      await handle.close();
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "EEXIST") {
        throw new Error(duplicateError);
      }
      throw error;
    }
  }
}
