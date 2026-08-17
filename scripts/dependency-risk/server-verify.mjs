import { spawn } from "node:child_process";
import { chmod, mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

import { canonicalJson, redact } from "./model.mjs";

const CHECKS = [
  ["frozen-install", "corepack", ["pnpm", "install", "--frozen-lockfile"]],
  [
    "production-audit",
    "corepack",
    ["pnpm", "audit", "--prod", "--audit-level=high"],
  ],
  ["development-audit", "corepack", ["pnpm", "audit", "--audit-level=high"]],
  ["typecheck", "corepack", ["pnpm", "typecheck"]],
  ["tests", "corepack", ["pnpm", "test"]],
  ["build", "corepack", ["pnpm", "build"]],
  ["packed-artifacts", "corepack", ["pnpm", "package:verify"]],
  ["compatibility", "corepack", ["pnpm", "compatibility:verify"]],
  ["quickstarts", "corepack", ["pnpm", "quickstart:clean"]],
];

function run(file, args, timeoutMs = 1_200_000) {
  return new Promise((resolveRun) => {
    const startedAt = new Date().toISOString();
    const child = spawn(file, args, {
      cwd: process.cwd(),
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });
    const chunks = [];
    let bytes = 0;
    const append = (chunk) => {
      bytes += chunk.length;
      if (bytes <= 8 * 1024 * 1024) chunks.push(chunk);
      else child.kill("SIGTERM");
    };
    child.stdout.on("data", append);
    child.stderr.on("data", append);
    const timer = setTimeout(() => child.kill("SIGTERM"), timeoutMs);
    child.on("error", (error) => {
      clearTimeout(timer);
      resolveRun({
        outcome: "failed",
        startedAt,
        endedAt: new Date().toISOString(),
        code: null,
        failureCode: "COMMAND_START_FAILED",
        log: error.message,
      });
    });
    child.on("close", (code, signal) => {
      clearTimeout(timer);
      resolveRun({
        outcome: code === 0 ? "passed" : "failed",
        startedAt,
        endedAt: new Date().toISOString(),
        code,
        signal,
        failureCode:
          bytes > 8 * 1024 * 1024
            ? "OUTPUT_LIMIT"
            : code === 0
              ? undefined
              : "CHECK_FAILED",
        log: Buffer.concat(chunks).toString("utf8"),
      });
    });
  });
}

export async function verifyOnServer({
  outputDirectory = ".dependency-risk/private/server-verify",
} = {}) {
  const directory = resolve(outputDirectory);
  await mkdir(directory, { recursive: true, mode: 0o700 });
  await chmod(directory, 0o700);
  const outcomes = {};
  for (const [name, file, args] of CHECKS) {
    const result = await run(file, args);
    outcomes[name] = result.outcome;
    await writeFile(
      join(directory, `${name}.json`),
      `${canonicalJson(redact(result))}\n`,
      { mode: 0o600 },
    );
    if (result.outcome !== "passed" && name === "frozen-install") break;
  }
  const summary = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    environmentId: process.env.METERKIT_SERVER_ENVIRONMENT_ID ?? "unknown",
    outcomes,
    gate:
      Object.values(outcomes).every((value) => value === "passed") &&
      Object.keys(outcomes).length === CHECKS.length
        ? "passed"
        : "failed",
  };
  await writeFile(
    join(directory, "summary.json"),
    `${canonicalJson(summary)}\n`,
    { mode: 0o600 },
  );
  return { summary, directory };
}
