#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
import process from "node:process";
import {
  parsePolicy,
  SOLANA_DEVNET_NETWORK,
  SOLANA_DEVNET_USDC_MINT,
  verifyEndpoint,
  type PilotPolicy,
} from "./index.js";
import { validateSettlementEvidence } from "./evidence.js";
import { activationReportSchema } from "./activation.js";

const [, , command, ...args] = process.argv;

try {
if (command === "init") {
  const positional = positionalArgs(args, new Set(["--out"]));
  if (positional.length > 1) throw new Error("init accepts at most one endpoint");
  const endpoint = positional[0] ?? "http://localhost:3000/premium";
  const path = option(args, "--out") ?? "meterkit-pilot.json";
  const template = {
    endpoint,
    policy: {
      network: SOLANA_DEVNET_NETWORK,
      mint: SOLANA_DEVNET_USDC_MINT,
      maxAmountAtomic: "10000",
      recipient: "REPLACE_WITH_YOUR_DEVNET_WALLET",
      allowLocalhost: endpoint.startsWith("http://localhost:") || endpoint.startsWith("http://127.0.0.1:"),
    },
  };
  await writeFile(path, `${JSON.stringify(template, null, 2)}\n`, { flag: "wx" });
  process.stdout.write(`Created ${path}. Replace the recipient and run: meterkit-pilot verify --config ${path}\n`);
} else if (command === "verify" || command === "diagnose") {
  const configPath = option(args, "--config");
  const positional = positionalArgs(args, new Set(["--config", "--out"]));
  if (positional.length) throw new Error("verify requires --config so every policy value is enforced; run init first");
  let endpoint: string | undefined;
  let policy: PilotPolicy = {};
  if (configPath) {
    const config = JSON.parse(await readFile(configPath, "utf8")) as { endpoint?: unknown; policy?: unknown };
    if (typeof config.endpoint !== "string") throw new Error("config.endpoint must be a URL");
    endpoint = config.endpoint;
    policy = parsePolicy(config.policy ?? {});
  }
  if (!configPath || !endpoint) throw new Error("verify requires --config; run init first");
  const report = await verifyEndpoint(endpoint, policy);
  const rendered = `${JSON.stringify(report, null, 2)}\n`;
  const output = option(args, "--out");
  if (output) await writeFile(output, rendered, { flag: "wx" });
  process.stdout.write(rendered);
  if (!report.passed) process.exitCode = 1;
} else if (command === "evidence") {
  const receiptPath = option(args, "--receipt");
  const output = option(args, "--out");
  const positional = positionalArgs(args, new Set(["--receipt", "--out"]));
  if (positional.length || !receiptPath || !output) {
    throw new Error("evidence requires --receipt <path> and --out <path>");
  }
  const evidence = validateSettlementEvidence(JSON.parse(await readFile(receiptPath, "utf8")));
  await writeFile(output, `${JSON.stringify(evidence, null, 2)}\n`, { flag: "wx" });
  process.stdout.write(`Validated settlement evidence and created ${output}\n`);
} else if (command === "activation") {
  const input = option(args, "--input");
  const output = option(args, "--out");
  const positional = positionalArgs(args, new Set(["--input", "--out"]));
  if (positional.length || !input || !output) throw new Error("activation requires --input <path> and --out <path>");
  const report = activationReportSchema.parse(JSON.parse(await readFile(input, "utf8")));
  await writeFile(output, `${JSON.stringify(report, null, 2)}\n`, { flag: "wx" });
  process.stdout.write(`Validated consented activation report and created ${output}\n`);
} else {
  usage(command ? 1 : 0);
}
} catch (cause) {
  process.stderr.write(`meterkit-pilot: ${cause instanceof Error ? cause.message : String(cause)}\n`);
  process.exitCode = 1;
}

function option(values: string[], name: string) {
  const matches = values.flatMap((value, index) => value === name ? [index] : []);
  if (matches.length > 1) throw new Error(`${name} may only be provided once`);
  const index = matches[0] ?? -1;
  if (index < 0) return undefined;
  const value = values[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`${name} requires a value`);
  return value;
}

function positionalArgs(values: string[], optionsWithValues: Set<string>) {
  const output: string[] = [];
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index]!;
    if (value === "--") {
      continue;
    } else if (optionsWithValues.has(value)) {
      if (!values[index + 1] || values[index + 1]!.startsWith("--")) throw new Error(`${value} requires a value`);
      index += 1;
    } else if (value.startsWith("--")) {
      throw new Error(`unknown option: ${value}`);
    } else {
      output.push(value);
    }
  }
  return output;
}

function usage(code: number): never {
  process.stderr.write(`MeterKit pilot verifier

Usage:
  meterkit-pilot init [endpoint] [--out meterkit-pilot.json]
  meterkit-pilot diagnose --config meterkit-pilot.json [--out diagnose-report.json]
  meterkit-pilot verify --config meterkit-pilot.json [--out pilot-report.json]
  meterkit-pilot evidence --receipt settlement.json --out pilot-evidence.json
  meterkit-pilot activation --input activation.json --out activation-report.json
`);
  process.exit(code);
}
