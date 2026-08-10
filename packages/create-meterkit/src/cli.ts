#!/usr/bin/env node
import process from "node:process";
import { realpathSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createInitializerPlan } from "./plan.js";
import { writeInitializerPlan } from "./write.js";

export const CREATE_METERKIT_VERSION = "0.2.0";

interface CliArguments {
  directory: string;
  surface: "express" | "next-route" | "hono" | "mcp";
  packageManager: "pnpm" | "npm" | "yarn" | "bun";
  dryRun: boolean;
  json: boolean;
  yes: boolean;
}

export function parseCliArguments(args: string[]): CliArguments {
  const directory = args[0];
  if (!directory || directory.startsWith("-"))
    throw new Error("directory is required");
  let surface: CliArguments["surface"] = "express";
  let packageManager: CliArguments["packageManager"] = "pnpm";
  let dryRun = false;
  let json = false;
  let yes = false;
  for (let index = 1; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "--surface")
      surface = args[++index] as CliArguments["surface"];
    else if (argument === "--package-manager")
      packageManager = args[++index] as CliArguments["packageManager"];
    else if (argument === "--dry-run") dryRun = true;
    else if (argument === "--json") json = true;
    else if (argument === "--yes") yes = true;
    else throw new Error(`unknown option: ${argument}`);
  }
  return { directory, surface, packageManager, dryRun, json, yes };
}

interface CliIo {
  cwd?: string;
  stdout?: (value: string) => void;
  stderr?: (value: string) => void;
}

export async function runCli(args: string[], io: CliIo = {}): Promise<number> {
  const stdout = io.stdout ?? ((value: string) => process.stdout.write(value));
  const stderr = io.stderr ?? ((value: string) => process.stderr.write(value));
  try {
    const parsed = parseCliArguments(args);
    const plan = await createInitializerPlan({
      surface: parsed.surface,
      packageManager: parsed.packageManager,
      targetDirectory: resolve(io.cwd ?? process.cwd(), parsed.directory),
    });
    if (parsed.dryRun) {
      stdout(
        parsed.json
          ? `${JSON.stringify(plan, null, 2)}\n`
          : `Would create ${plan.surface} in ${plan.targetDirectory}\n`,
      );
      return 0;
    }
    await writeInitializerPlan(plan);
    stdout(
      parsed.json
        ? `${JSON.stringify({ created: true, plan })}\n`
        : `Created MeterKit ${plan.surface} project in ${plan.targetDirectory}\n`,
    );
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown failure";
    const filesystem = message.startsWith("UNSAFE_FILESYSTEM");
    stderr(
      `${filesystem ? "UNSAFE_FILESYSTEM" : "INVALID_INPUT"}: ${message.replace(/^(?:UNSAFE_FILESYSTEM|INVALID_INPUT):\s*/, "")}\n`,
    );
    return filesystem ? 3 : 2;
  }
}

const executedPath = process.argv[1]
  ? (() => {
      try {
        return realpathSync(process.argv[1]);
      } catch {
        return resolve(process.argv[1]);
      }
    })()
  : undefined;
if (executedPath === fileURLToPath(import.meta.url))
  process.exitCode = await runCli(process.argv.slice(2));
