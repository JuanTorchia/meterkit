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
      install: true,
      durability: "memory",
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

  it("collects the guided bare-command choices only in a TTY", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "meterkit-guided-"));
    const answers: Record<string, string | boolean> = {
      directory: "guided-app",
      surface: "hono",
      packageManager: "npm",
      recipient: "7NXuBzJ3EQV4CuxpSVELD3t1bs5xZ6ocfGvwjFDbCZUE",
      install: false,
    };
    const output: string[] = [];

    expect(
      await runCli([], {
        cwd,
        isTTY: true,
        prompt: async (request) => answers[request.id],
        stdout: (value) => output.push(value),
      }),
    ).toBe(0);
    expect(output.join("")).toContain("guided-app");
    expect(output.join("")).toContain("npm");
  });

  it("never prompts in a non-interactive shell", async () => {
    let prompted = false;
    const errors: string[] = [];
    expect(
      await runCli([], {
        isTTY: false,
        prompt: async () => {
          prompted = true;
          return "unexpected";
        },
        stderr: (value) => errors.push(value),
      }),
    ).toBe(2);
    expect(prompted).toBe(false);
    expect(errors.join("")).toContain("directory is required");
  });

  it("honors complete non-interactive install flags and recipient", () => {
    expect(
      parseCliArguments([
        "automated-app",
        "--surface",
        "express",
        "--package-manager",
        "npm",
        "--recipient",
        "7NXuBzJ3EQV4CuxpSVELD3t1bs5xZ6ocfGvwjFDbCZUE",
        "--no-install",
        "--yes",
      ]),
    ).toMatchObject({
      directory: "automated-app",
      surface: "express",
      packageManager: "npm",
      recipient: "7NXuBzJ3EQV4CuxpSVELD3t1bs5xZ6ocfGvwjFDbCZUE",
      install: false,
      yes: true,
      durability: "memory",
    });
  });

  it("selects PostgreSQL durability explicitly", () => {
    expect(
      parseCliArguments(["durable", "--store", "postgres"]).durability,
    ).toBe("postgres");
  });
});
