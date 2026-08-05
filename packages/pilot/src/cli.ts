#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
import process from "node:process";
import { parsePolicy, verifyEndpoint, type PilotPolicy } from "./index.js";

const [, , command, ...args] = process.argv;

if (command === "init") {
  const endpoint = args.find((value) => !value.startsWith("--")) ?? "http://localhost:3000/premium";
  const path = option(args, "--out") ?? "meterkit-pilot.json";
  const template = {
    endpoint,
    policy: {
      network: "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1",
      mint: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
      maxAmountAtomic: "10000",
      recipient: "REPLACE_WITH_YOUR_DEVNET_WALLET",
    },
  };
  await writeFile(path, `${JSON.stringify(template, null, 2)}\n`, { flag: "wx" });
  process.stdout.write(`Created ${path}. Replace the recipient and run: meterkit-pilot verify --config ${path}\n`);
} else if (command === "verify") {
  const configPath = option(args, "--config");
  let endpoint = args.find((value, index) => !value.startsWith("--") && args[index - 1] !== "--config" && args[index - 1] !== "--out");
  let policy: PilotPolicy = {};
  if (configPath) {
    const config = JSON.parse(await readFile(configPath, "utf8")) as { endpoint?: unknown; policy?: unknown };
    if (typeof config.endpoint !== "string") throw new Error("config.endpoint must be a URL");
    endpoint = config.endpoint;
    policy = parsePolicy(config.policy ?? {});
  }
  if (!endpoint) usage(1);
  const report = await verifyEndpoint(endpoint, policy);
  const rendered = `${JSON.stringify(report, null, 2)}\n`;
  const output = option(args, "--out");
  if (output) await writeFile(output, rendered, { flag: "wx" });
  process.stdout.write(rendered);
  if (!report.passed) process.exitCode = 1;
} else {
  usage(command ? 1 : 0);
}

function option(values: string[], name: string) {
  const index = values.indexOf(name);
  return index >= 0 ? values[index + 1] : undefined;
}

function usage(code: number): never {
  process.stderr.write(`MeterKit pilot verifier

Usage:
  meterkit-pilot init [endpoint] [--out meterkit-pilot.json]
  meterkit-pilot verify <endpoint> [--out pilot-report.json]
  meterkit-pilot verify --config meterkit-pilot.json [--out pilot-report.json]
`);
  process.exit(code);
}
