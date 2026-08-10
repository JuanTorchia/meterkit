#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import process from "node:process";
import { URL } from "node:url";

const root = resolve(new URL("..", import.meta.url).pathname);
const outputDir = resolve(root, "artifacts/aaa-evidence");
const checks = [
  ["lint", "pnpm", ["lint"]],
  ["typecheck", "pnpm", ["typecheck"]],
  ["unit", "pnpm", ["test"]],
  ["build", "pnpm", ["build"]],
  ["e2e", "pnpm", ["test:e2e"]],
  ["cleanQuickstart", "pnpm", ["quickstart:clean"]],
  ["compatibility", "pnpm", ["compatibility:verify"]],
  ["productionAudit", "pnpm", ["audit", "--prod", "--audit-level=high"]],
];

function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, encoding: "utf8", timeout: 15 * 60_000 });
  return { passed: result.status === 0, exitCode: result.status, signal: result.signal ?? undefined };
}

const commit = spawnSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).stdout.trim();
const dirty = spawnSync("git", ["status", "--porcelain"], { cwd: root, encoding: "utf8" }).stdout.trim().length > 0;
const results = Object.fromEntries(checks.map(([name, command, args]) => [name, run(command, args)]));
const secretFiles = spawnSync("git", ["ls-files", "*.key", "*keypair*.json", ".env", ".env.*"], { cwd: root, encoding: "utf8" }).stdout.trim().split("\n").filter(Boolean).filter((path) => path !== ".env.example");
results.secretFileScan = { passed: secretFiles.length === 0, matches: secretFiles.length };

const report = {
  schemaVersion: 1,
  kind: "meterkit-aaa-evidence",
  generatedAt: new Date().toISOString(),
  commit,
  dirty,
  environment: "solana-devnet-only",
  checks: results,
  externalPilots: { verified: 0, note: "Updated only from consented external evidence; never synthesized." },
  liveSettlement: { status: "not-run", note: "Use the documented disposable devnet client; no key material is accepted by this runner." },
  passed: !dirty && Object.values(results).every((result) => result.passed),
};
await mkdir(outputDir, { recursive: true });
await writeFile(resolve(outputDir, "report.json"), `${JSON.stringify(report, null, 2)}\n`, { mode: 0o600 });
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (!report.passed) process.exitCode = 1;
