import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { createActivationReport } from "./activation.js";

describe("pilot CLI", () => {
  it("uses a stable nonzero exit for invalid commands", () => {
    const result = spawnSync("pnpm", ["exec", "tsx", "src/cli.ts", "unknown"], { cwd: new URL("..", import.meta.url).pathname, encoding: "utf8" });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Usage:");
  });
  it("validates and exports a consented activation report", () => {
    const directory = mkdtempSync(join(tmpdir(), "meterkit-cli-"));
    const input = join(directory, "input.json");
    const output = join(directory, "output.json");
    writeFileSync(input, JSON.stringify(createActivationReport({ consent: true, assistance: "none" })));
    const result = spawnSync("pnpm", ["exec", "tsx", "src/cli.ts", "activation", "--input", input, "--out", output], { cwd: new URL("..", import.meta.url).pathname, encoding: "utf8" });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("Validated consented activation report");
  });
});
