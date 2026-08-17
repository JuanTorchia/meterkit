import { chmod, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  assertPrivateFilePermissions,
  parseAtomicLimit,
  parsePublicUrl,
  parseSolanaAddress,
} from "./config.js";

describe("CLI configuration validation", () => {
  it("accepts a real Solana public key and rejects malformed base58", () => {
    expect(
      parseSolanaAddress("7NXuBzJ3EQV4CuxpSVELD3t1bs5xZ6ocfGvwjFDbCZUE"),
    ).toBe("7NXuBzJ3EQV4CuxpSVELD3t1bs5xZ6ocfGvwjFDbCZUE");
    expect(() => parseSolanaAddress("not-a-public-key")).toThrow(
      "valid Solana public key",
    );
  });

  it("permits HTTPS and rejects credential-bearing URLs", () => {
    expect(parsePublicUrl("https://provider.example/premium").href).toBe(
      "https://provider.example/premium",
    );
    expect(() => parsePublicUrl("https://user:secret@example.com")).toThrow(
      "must not contain credentials",
    );
  });

  it("requires a positive bounded atomic amount", () => {
    expect(parseAtomicLimit("1000000")).toBe(1_000_000n);
    expect(() => parseAtomicLimit("0")).toThrow("positive integer");
    expect(() => parseAtomicLimit("1.5")).toThrow("positive integer");
  });

  it.runIf(process.platform !== "win32")(
    "rejects a keypair file readable by group or others",
    async () => {
      const directory = await mkdtemp(join(tmpdir(), "meterkit-cli-"));
      const path = join(directory, "payer.json");
      await writeFile(path, "[]", { mode: 0o600 });
      await expect(assertPrivateFilePermissions(path)).resolves.toBeUndefined();
      await chmod(path, 0o644);
      await expect(assertPrivateFilePermissions(path)).rejects.toThrow("0600");
    },
  );
});
