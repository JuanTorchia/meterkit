import { createHash } from "node:crypto";
import { mkdir, open } from "node:fs/promises";
import { resolve } from "node:path";

/**
 * Durable, process-independent replay guard for the demo MCP server.
 * Filenames contain only a SHA-256 digest, not the public transaction signature.
 */
export class FileReceiptGuard {
  constructor(private readonly directory: string) {}

  async claim(signature: string) {
    const digest = createHash("sha256").update(signature).digest("hex");
    const directory = resolve(this.directory);
    await mkdir(directory, { recursive: true, mode: 0o700 });
    try {
      const handle = await open(resolve(directory, `${digest}.receipt`), "wx", 0o600);
      await handle.writeFile(`${new Date().toISOString()}\n`);
      await handle.close();
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "EEXIST") {
        throw new Error("PAYMENT_REPLAYED");
      }
      throw error;
    }
  }
}
