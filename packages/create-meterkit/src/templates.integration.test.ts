import { access, mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createInitializerPlan } from "./plan.js";
import { writeInitializerPlan } from "./write.js";

// Each surface must reach a real x402 challenge through its own adapter. A
// template that answers 402 from a literal is indistinguishable from a working
// one when you only check that a file exists, so pin the entry point and the
// adapter that has to appear in it.
const surfaces = {
  express: { entry: "src/server.ts", adapter: "@usemeterkit/sdk" },
  "next-route": { entry: "app/api/premium/route.ts", adapter: "@x402/next" },
  hono: { entry: "src/server.ts", adapter: "@x402/hono" },
  mcp: { entry: "src/server.ts", adapter: "@x402/mcp" },
} as const;

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

    it(`wires ${surface} to a real payment adapter`, async () => {
      const cwd = await mkdtemp(join(tmpdir(), `meterkit-wired-${surface}-`));
      const targetDirectory = join(cwd, "generated");
      const plan = await createInitializerPlan({
        surface,
        packageManager: "pnpm",
        targetDirectory,
      });
      await writeInitializerPlan(plan);
      const { entry, adapter } = surfaces[surface];
      const source = await readFile(join(targetDirectory, entry), "utf8");
      expect(source).toContain(adapter);
      // The challenge must come from the adapter, never from a hand-written
      // status code that no client can pay.
      expect(source).not.toMatch(/"?payment_required"?/);
      expect(source).not.toMatch(/adapter guide/i);
      const manifest = JSON.parse(
        await readFile(join(targetDirectory, "package.json"), "utf8"),
      ) as { dependencies?: Record<string, string> };
      expect(Object.keys(manifest.dependencies ?? {})).toContain(adapter);
    });

    it(`generates executable environment and check commands for ${surface}`, async () => {
      const cwd = await mkdtemp(
        join(tmpdir(), `meterkit-runnable-${surface}-`),
      );
      const targetDirectory = join(cwd, "generated");
      const recipient = "7NXuBzJ3EQV4CuxpSVELD3t1bs5xZ6ocfGvwjFDbCZUE";
      const plan = await createInitializerPlan({
        surface,
        packageManager: "npm",
        targetDirectory,
        recipient,
      });
      await writeInitializerPlan(plan);

      const manifest = JSON.parse(
        await readFile(join(targetDirectory, "package.json"), "utf8"),
      ) as {
        scripts?: Record<string, string>;
        devDependencies?: Record<string, string>;
      };
      const readme = await readFile(join(targetDirectory, "README.md"), "utf8");
      expect(readme).toContain("npm install");
      expect(readme).not.toContain("pnpm ");
      expect(readme).not.toContain("{{");
      expect(readme).toContain("npm run doctor");
      if (surface === "mcp") {
        expect(manifest.scripts?.["check:unpaid"]).toContain("--unpaid");
        expect(manifest.scripts?.["check:unpaid"]).not.toContain(
          "meterkit check",
        );
      } else {
        expect(manifest.devDependencies).toHaveProperty("@usemeterkit/cli");
        expect(manifest.scripts?.["check:unpaid"]).toMatch(/meterkit check/);
      }
      if (surface === "next-route") {
        await expect(
          readFile(join(targetDirectory, ".env.local"), "utf8"),
        ).resolves.toContain(recipient);
      } else {
        expect(manifest.scripts?.dev).toContain("--env-file=.env");
        await expect(
          readFile(join(targetDirectory, ".env"), "utf8"),
        ).resolves.toContain(recipient);
      }
    });
  }

  it("generates explicit fail-closed PostgreSQL durability", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "meterkit-postgres-"));
    const targetDirectory = join(cwd, "generated");
    const plan = await createInitializerPlan({
      surface: "express",
      packageManager: "npm",
      targetDirectory,
      recipient: "7NXuBzJ3EQV4CuxpSVELD3t1bs5xZ6ocfGvwjFDbCZUE",
      durability: "postgres",
    });
    await writeInitializerPlan(plan);
    const environment = await readFile(join(targetDirectory, ".env"), "utf8");
    const store = await readFile(
      join(targetDirectory, "src/payment-store.ts"),
      "utf8",
    );
    expect(environment).toContain("DURABILITY_MODE=postgres");
    expect(store).toContain("DATABASE_URL is required");
    expect(store).not.toMatch(/catch.*MemoryPaymentStore/s);
  });
});
