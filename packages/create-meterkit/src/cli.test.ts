import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseCliArguments, runCli } from "./cli.js";

describe("create-meterkit CLI", () => {
  it("parses the documented command surface deterministically", () => {
    expect(
      parseCliArguments([
        "demo",
        "--surface",
        "hono",
        "--package-manager",
        "pnpm",
        "--dry-run",
        "--json",
        "--yes",
      ]),
    ).toEqual({
      directory: "demo",
      surface: "hono",
      packageManager: "pnpm",
      dryRun: true,
      json: true,
      yes: true,
    });
  });

  it("emits the same dry-run plan without writing", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "meterkit-cli-"));
    const output: string[] = [];
    const args = ["demo", "--surface", "express", "--dry-run", "--json"];
    expect(
      await runCli(args, { cwd, stdout: (value) => output.push(value) }),
    ).toBe(0);
    const first = output.join("");
    output.length = 0;
    expect(
      await runCli(args, { cwd, stdout: (value) => output.push(value) }),
    ).toBe(0);
    expect(output.join("")).toBe(first);
    await expect(readFile(join(cwd, "demo", "package.json"))).rejects.toThrow();
  });

  it("uses stable invalid-input diagnostics", async () => {
    const errors: string[] = [];
    expect(
      await runCli(["demo", "--surface", "rails"], {
        cwd: process.cwd(),
        stderr: (value) => errors.push(value),
      }),
    ).toBe(2);
    expect(errors.join("")).toContain("INVALID_INPUT");
  });
});
