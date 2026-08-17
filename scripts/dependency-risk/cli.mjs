#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import process from "node:process";
import { pathToFileURL } from "node:url";

const usage = `MeterKit dependency-risk tooling

Usage:
  node scripts/dependency-risk/cli.mjs --help
  node scripts/dependency-risk/cli.mjs local-check
  node scripts/dependency-risk/cli.mjs server-collect --ack-server-only

Heavy commands require a validated server marker and explicit acknowledgement.
`;

const HEAVY_COMMANDS = new Set(["server-collect", "server-verify"]);

export async function assertServerExecution({
  environment = process.env,
  platform = process.platform,
  arguments: arguments_ = [],
} = {}) {
  if (platform !== "linux") throw new Error("SERVER_LINUX_REQUIRED");
  if (!arguments_.includes("--ack-server-only")) {
    throw new Error("SERVER_ACK_REQUIRED");
  }
  const markerPath = environment.METERKIT_SERVER_MARKER;
  if (!markerPath) throw new Error("SERVER_MARKER_REQUIRED");
  let marker;
  try {
    marker = JSON.parse(await readFile(markerPath, "utf8"));
  } catch {
    throw new Error("SERVER_MARKER_INVALID");
  }
  if (
    marker.schemaVersion !== 1 ||
    marker.role !== "dependency-evidence-server" ||
    typeof marker.environmentId !== "string" ||
    marker.environmentId.length === 0
  ) {
    throw new Error("SERVER_MARKER_INVALID");
  }
  return marker;
}

export async function runDependencyRiskCli(
  arguments_,
  streams = { stdout: process.stdout, stderr: process.stderr },
) {
  const [command = "--help"] = arguments_;
  if (command === "--help" || command === "-h") {
    streams.stdout.write(usage);
    return 0;
  }
  if (command === "local-check") {
    streams.stdout.write(
      `${JSON.stringify({ schemaVersion: 1, mode: "local", heavyCommandsRun: false })}\n`,
    );
    return 0;
  }
  if (HEAVY_COMMANDS.has(command)) {
    try {
      const marker = await assertServerExecution({ arguments: arguments_ });
      if (command === "server-collect") {
        const { collectDependencyRisk } = await import("./collect.mjs");
        const { result, runDirectory } = await collectDependencyRisk(
          arguments_.slice(1),
        );
        streams.stdout.write(
          `${JSON.stringify({
            schemaVersion: 1,
            runId: result.runId,
            environmentId: marker.environmentId,
            runDirectory,
            sources: Object.fromEntries(
              result.snapshots.map((snapshot) => [
                snapshot.sourceType,
                snapshot.availability,
              ]),
            ),
          })}\n`,
        );
        return result.snapshots.every(
          (snapshot) => snapshot.availability === "available",
        )
          ? 0
          : 4;
      }
      const { verifyOnServer } = await import("./server-verify.mjs");
      const outputIndex = arguments_.indexOf("--output-dir");
      const outputDirectory =
        outputIndex === -1 ? undefined : arguments_[outputIndex + 1];
      const { summary, directory } = await verifyOnServer({ outputDirectory });
      streams.stdout.write(
        `${JSON.stringify({ ...summary, environmentId: marker.environmentId, directory })}\n`,
      );
      return summary.gate === "passed" ? 0 : 1;
    } catch (error) {
      streams.stderr.write(
        `${error instanceof Error ? error.message : "SERVER_GUARD_FAILED"}\n`,
      );
      return 3;
    }
  }
  streams.stderr.write(`UNKNOWN_COMMAND: ${command}\n`);
  return 2;
}

if (
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  process.exitCode = await runDependencyRiskCli(process.argv.slice(2));
}
