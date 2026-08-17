import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { createInitializerPlan } from "./plan.js";
import { installGeneratedProject, writeInitializerPlan } from "./write.js";

async function planAt(targetDirectory: string, packageManager = "npm") {
  return createInitializerPlan({
    surface: "express",
    packageManager,
    targetDirectory,
  });
}

describe("initializer filesystem and installation recovery", () => {
  it("refuses a non-empty destination without changing its files", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "meterkit-nonempty-"));
    const target = join(cwd, "existing");
    await mkdir(target);
    await writeFile(join(target, "keep.txt"), "user content");

    await expect(writeInitializerPlan(await planAt(target))).rejects.toThrow(
      "target is not empty",
    );
    await expect(readFile(join(target, "keep.txt"), "utf8")).resolves.toBe(
      "user content",
    );
  });

  it("preserves a generated project and returns an exact recovery command when install fails", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "meterkit-install-fail-"));
    const target = join(cwd, "generated");
    await writeInitializerPlan(await planAt(target, "npm"));

    const result = await installGeneratedProject(target, "npm", async () => ({
      exitCode: 1,
      stderr: "registry unavailable",
    }));

    expect(result).toEqual({
      state: "written_install_failed",
      recoveryCommand: "npm install",
      detail: "registry unavailable",
    });
    await expect(
      readFile(join(target, "package.json"), "utf8"),
    ).resolves.toContain('"name"');
  });

  it("uses the selected package manager command", async () => {
    const observed: string[][] = [];
    const result = await installGeneratedProject(
      "/tmp/generated",
      "pnpm",
      async (command) => {
        observed.push(command);
        return { exitCode: 0, stderr: "" };
      },
    );
    expect(observed).toEqual([["pnpm", "install"]]);
    expect(result).toEqual({ state: "ready" });
  });
});
