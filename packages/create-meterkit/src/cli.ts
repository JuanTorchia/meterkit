#!/usr/bin/env node
import process from "node:process";
import { realpathSync } from "node:fs";
import { resolve } from "node:path";
import { createInterface } from "node:readline/promises";
import { fileURLToPath } from "node:url";
import { createInitializerPlan } from "./plan.js";
import { installGeneratedProject, writeInitializerPlan } from "./write.js";

export const CREATE_METERKIT_VERSION = "0.3.1";

interface CliArguments {
  directory: string;
  surface: "express" | "next-route" | "hono" | "mcp";
  packageManager: "pnpm" | "npm" | "yarn" | "bun";
  dryRun: boolean;
  json: boolean;
  yes: boolean;
  recipient?: string;
  install: boolean;
  durability: "memory" | "postgres";
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
  let recipient: string | undefined;
  let install = false;
  let durability: CliArguments["durability"] = "memory";
  for (let index = 1; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "--surface")
      surface = args[++index] as CliArguments["surface"];
    else if (argument === "--package-manager")
      packageManager = args[++index] as CliArguments["packageManager"];
    else if (argument === "--dry-run") dryRun = true;
    else if (argument === "--json") json = true;
    else if (argument === "--yes") yes = true;
    else if (argument === "--recipient") recipient = args[++index];
    else if (argument === "--install") install = true;
    else if (argument === "--no-install") install = false;
    else if (argument === "--store")
      durability = args[++index] as CliArguments["durability"];
    else throw new Error(`unknown option: ${argument}`);
  }
  if (yes && !args.includes("--no-install")) install = true;
  return {
    directory,
    surface,
    packageManager,
    dryRun,
    json,
    yes,
    ...(recipient ? { recipient } : {}),
    install,
    durability,
  };
}

export interface PromptRequest {
  id: "directory" | "surface" | "packageManager" | "recipient" | "install";
  message: string;
  defaultValue?: string | boolean;
}

interface CliIo {
  cwd?: string;
  stdout?: (value: string) => void;
  stderr?: (value: string) => void;
  isTTY?: boolean;
  prompt?: (request: PromptRequest) => Promise<string | boolean | undefined>;
}

async function promptInTerminal(
  request: PromptRequest,
): Promise<string | boolean | undefined> {
  const terminal = createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  try {
    const suffix =
      request.defaultValue === undefined
        ? ""
        : ` [${String(request.defaultValue)}]`;
    const answer = (
      await terminal.question(`${request.message}${suffix}: `)
    ).trim();
    if (!answer) return request.defaultValue;
    if (typeof request.defaultValue === "boolean") {
      return /^(?:y|yes|true|1)$/i.test(answer);
    }
    return answer;
  } finally {
    terminal.close();
  }
}

async function guidedArguments(io: CliIo): Promise<string[]> {
  const isTTY =
    io.isTTY ?? Boolean(process.stdin.isTTY && process.stdout.isTTY);
  if (!isTTY) return [];
  const prompt = io.prompt ?? promptInTerminal;
  const detectedManager = process.env.npm_config_user_agent?.startsWith("pnpm/")
    ? "pnpm"
    : "npm";
  const directory = await prompt({
    id: "directory",
    message: "Project directory",
    defaultValue: "meterkit-app",
  });
  const surface = await prompt({
    id: "surface",
    message: "Surface (express, next-route, hono, mcp)",
    defaultValue: "express",
  });
  const packageManager = await prompt({
    id: "packageManager",
    message: "Package manager (npm or pnpm)",
    defaultValue: detectedManager,
  });
  const recipient = await prompt({
    id: "recipient",
    message: "Disposable devnet recipient public key",
  });
  const install = await prompt({
    id: "install",
    message: "Install dependencies",
    defaultValue: true,
  });
  return [
    String(directory || "meterkit-app"),
    "--surface",
    String(surface || "express"),
    "--package-manager",
    String(packageManager || detectedManager),
    "--recipient",
    String(recipient ?? ""),
    install === false ? "--no-install" : "--install",
  ];
}

export async function runCli(args: string[], io: CliIo = {}): Promise<number> {
  const stdout = io.stdout ?? ((value: string) => process.stdout.write(value));
  const stderr = io.stderr ?? ((value: string) => process.stderr.write(value));
  try {
    const effectiveArguments =
      args.length === 0 ? await guidedArguments(io) : args;
    const parsed = parseCliArguments(effectiveArguments);
    if (!parsed.dryRun && !parsed.recipient) {
      throw new Error("recipient is required unless --dry-run is used");
    }
    const plan = await createInitializerPlan({
      surface: parsed.surface,
      packageManager: parsed.packageManager,
      targetDirectory: resolve(io.cwd ?? process.cwd(), parsed.directory),
      ...(parsed.recipient ? { recipient: parsed.recipient } : {}),
      durability: parsed.durability,
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
    const installation = parsed.install
      ? await installGeneratedProject(
          plan.targetDirectory,
          parsed.packageManager,
        )
      : { state: "ready" as const };
    stdout(
      parsed.json
        ? `${JSON.stringify({ created: true, plan, installation })}\n`
        : `Created MeterKit ${plan.surface} project in ${plan.targetDirectory}\nPackage manager: ${plan.packageManager}\n${installation.state === "written_install_failed" ? `Install failed; recover with: ${installation.recoveryCommand}\n` : ""}`,
    );
    return installation.state === "ready" ? 0 : 1;
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
