import { mkdir, mkdtemp, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createInitializerPlan } from "./plan.js";
import { writeInitializerPlan } from "./write.js";

describe("initializer filesystem boundary", () => {
  it("rejects non-empty and symlink targets without overwriting", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "meterkit-security-"));
    const occupied = join(cwd, "occupied");
    await mkdir(occupied);
    await writeFile(join(occupied, "keep.txt"), "user-owned");
    const plan = await createInitializerPlan({
      surface: "express",
      packageManager: "pnpm",
      targetDirectory: occupied,
    });
    await expect(writeInitializerPlan(plan)).rejects.toThrow(
      "UNSAFE_FILESYSTEM",
    );

    const outside = join(cwd, "outside");
    await mkdir(outside);
    const linked = join(cwd, "linked");
    await symlink(outside, linked, "dir");
    await expect(
      writeInitializerPlan({ ...plan, targetDirectory: linked }),
    ).rejects.toThrow("UNSAFE_FILESYSTEM");
  });

  it("allows only one concurrent writer", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "meterkit-concurrency-"));
    const targetDirectory = join(cwd, "demo");
    const plan = await createInitializerPlan({
      surface: "hono",
      packageManager: "pnpm",
      targetDirectory,
    });
    const results = await Promise.allSettled([
      writeInitializerPlan(plan),
      writeInitializerPlan(plan),
    ]);
    expect(
      results.filter((result) => result.status === "fulfilled"),
    ).toHaveLength(1);
    expect(
      results.filter((result) => result.status === "rejected"),
    ).toHaveLength(1);
  });

  it("cannot plan mainnet, secret inputs, traversal or Windows device paths", async () => {
    await expect(
      createInitializerPlan({
        surface: "express",
        packageManager: "pnpm",
        targetDirectory: "demo",
        network: "solana-mainnet",
      }),
    ).rejects.toThrow("INVALID_INPUT");
    await expect(
      createInitializerPlan({
        surface: "express",
        packageManager: "pnpm",
        targetDirectory: "demo",
        recipient: "PRIVATE_KEY=abc",
      }),
    ).rejects.toThrow("INVALID_INPUT");
    for (const path of ["../escape", "C:\\escape", "CON", "file\0name"]) {
      await expect(
        createInitializerPlan({
          surface: "express",
          packageManager: "pnpm",
          targetDirectory: "demo",
          templatePathOverride: path,
        }),
      ).rejects.toThrow("INVALID_INPUT");
    }
  });
});
