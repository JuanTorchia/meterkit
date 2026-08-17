import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join, relative, resolve, sep } from "node:path";
import {
  initializerPackageManagerSchema,
  initializerPlanSchema,
  initializerSurfaceSchema,
  type InitializerPlan,
} from "@usemeterkit/core";

const VERSION = "0.3.0";
const TEMPLATE_ROOT = fileURLToPath(new URL("../templates", import.meta.url));

export interface InitializerOptions {
  surface: unknown;
  packageManager: unknown;
  targetDirectory: string;
  network?: unknown;
  recipient?: string;
  durability?: unknown;
  templatePathOverride?: string;
}

async function templateFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries.sort((left, right) =>
    left.name.localeCompare(right.name),
  )) {
    if (entry.isSymbolicLink())
      throw new Error("INVALID_INPUT: template symlinks are forbidden");
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await templateFiles(path)));
    else if (entry.isFile()) files.push(path);
  }
  return files;
}

export async function createInitializerPlan(
  options: InitializerOptions,
): Promise<InitializerPlan> {
  try {
    const surface = initializerSurfaceSchema.parse(options.surface);
    const packageManager = initializerPackageManagerSchema.parse(
      options.packageManager,
    );
    if (
      options.durability !== undefined &&
      !["memory", "postgres"].includes(String(options.durability))
    )
      throw new Error("store must be memory or postgres");
    const durability =
      options.durability === "postgres" ? "postgres" : "memory";
    if ((options.network ?? "solana-devnet") !== "solana-devnet") {
      throw new Error("network must be solana-devnet");
    }
    if (
      options.recipient &&
      /(?:PRIVATE|SECRET|SEED|TOKEN|SIGNATURE|PASSWORD)/i.test(
        options.recipient,
      )
    ) {
      throw new Error("secret-like inputs are forbidden");
    }
    if (
      options.recipient &&
      !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(options.recipient)
    ) {
      throw new Error("recipient must be a valid Solana public key");
    }
    const directory = join(TEMPLATE_ROOT, surface);
    const sourceFiles = options.templatePathOverride
      ? [join(directory, options.templatePathOverride)]
      : await templateFiles(directory);
    const files = await Promise.all(
      sourceFiles.map(async (sourcePath) => {
        const path =
          options.templatePathOverride ??
          relative(directory, sourcePath).split(sep).join("/");
        const content = options.templatePathOverride
          ? "adversarial fixture"
          : await readFile(sourcePath);
        return {
          path,
          fingerprint: `sha256:${createHash("sha256").update(content).digest("hex")}`,
        };
      }),
    );
    return initializerPlanSchema.parse({
      schemaVersion: 1,
      initializerVersion: VERSION,
      surface,
      targetDirectory: resolve(options.targetDirectory),
      packageManager,
      network: "solana-devnet",
      durability,
      ...(options.recipient ? { recipient: options.recipient } : {}),
      files,
      dependencies: {
        "@usemeterkit/sdk": "0.3.0",
        "@usemeterkit/database": "0.3.0",
      },
      environmentKeys: [
        "MERCHANT_WALLET",
        "SOLANA_RPC_URL",
        "DURABILITY_MODE",
        ...(durability === "postgres" ? ["DATABASE_URL"] : []),
      ],
      warnings: [
        "DEVNET_ONLY",
        "DO_NOT_USE_PRIVATE_KEYS",
        ...(durability === "memory" ? ["MEMORY_STORE_NON_DURABLE"] : []),
      ],
    });
  } catch (error) {
    throw new Error(
      `INVALID_INPUT: ${error instanceof Error ? error.message : "invalid initializer options"}`,
    );
  }
}

export function templateRootFor(surface: InitializerPlan["surface"]): string {
  return join(TEMPLATE_ROOT, surface);
}
