import { access, mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createInitializerPlan } from "./plan.js";
import { writeInitializerPlan } from "./write.js";

describe("versioned templates", () => {
  for (const surface of ["express", "next-route", "hono", "mcp"] as const) {
    it(`generates a secretless ${surface} project`, async () => {
      const cwd = await mkdtemp(join(tmpdir(), `meterkit-${surface}-`));
      const targetDirectory = join(cwd, "generated");
      const plan = await createInitializerPlan({
        surface,
        packageManager: "pnpm",
        targetDirectory,
      });
      await writeInitializerPlan(plan);
      await access(join(targetDirectory, "package.json"));
      const envExample = await readFile(
        join(targetDirectory, ".env.example"),
        "utf8",
      );
      expect(envExample).toContain("solana-devnet");
      expect(envExample).not.toMatch(
        /PRIVATE_KEY|SEED_PHRASE|=[1-9A-HJ-NP-Za-km-z]{32,}/,
      );
      const readme = await readFile(join(targetDirectory, "README.md"), "utf8");
      expect(readme).toContain("HTTP 402");
      expect(readme).toContain("replay");
    });
  }
});
