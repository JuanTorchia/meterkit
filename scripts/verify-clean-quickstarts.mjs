#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import process from "node:process";

const root = resolve(import.meta.dirname, "..");
const temporary = mkdtempSync(join(tmpdir(), "meterkit-clean-"));

try {
  const packDirectory = join(temporary, "packs");
  mkdirSync(packDirectory);
  execFileSync("pnpm", ["--filter", "@usemeterkit/core", "pack", "--pack-destination", packDirectory], { cwd: root, stdio: "pipe" });
  execFileSync("pnpm", ["--filter", "@usemeterkit/sdk", "pack", "--pack-destination", packDirectory], { cwd: root, stdio: "pipe" });
  writeFileSync(join(temporary, "package.json"), JSON.stringify({ type: "module", private: true }));
  const packs = execFileSync("find", [packDirectory, "-maxdepth", "1", "-name", "*.tgz"], { encoding: "utf8" })
    .trim().split("\n").filter(Boolean);
  execFileSync("npm", ["install", "--ignore-scripts", "--no-audit", "--no-fund", "express@5.1.0", ...packs], {
    cwd: temporary,
    stdio: "pipe",
  });
  const smoke = `
    import { MemoryPaymentStore, protect, SOLANA_DEVNET } from "@usemeterkit/sdk";
    if (typeof protect !== "function" || typeof MemoryPaymentStore !== "function") process.exit(2);
    if (!SOLANA_DEVNET.startsWith("solana:")) process.exit(3);
  `;
  execFileSync("node", ["--input-type=module", "--eval", smoke], { cwd: temporary, stdio: "pipe" });
  const sdkReadme = readFileSync(join(root, "packages/sdk/README.md"), "utf8");
  if (!sdkReadme.includes("protect({") || sdkReadme.includes("handler,")) throw new Error("SDK README is not copy-paste complete");
  process.stdout.write(JSON.stringify({ passed: true, kind: "meterkit-clean-package-smoke", packages: packs.length }) + "\n");
} finally {
  rmSync(temporary, { recursive: true, force: true });
}
