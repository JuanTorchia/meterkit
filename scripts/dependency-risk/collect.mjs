import { spawn } from "node:child_process";
import { chmod, mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, join, resolve } from "node:path";

import { canonicalJson, redact, sha256, stableId } from "./model.mjs";
import {
  availableSourceSnapshot,
  unavailableSourceSnapshot,
} from "./sources.mjs";

const COLLECTOR_VERSION = "1.0.0";
const MAX_OUTPUT_BYTES = 32 * 1024 * 1024;

function option(arguments_, name) {
  const index = arguments_.indexOf(name);
  return index === -1 ? undefined : arguments_[index + 1];
}

async function command(file, args, { timeoutMs = 180_000 } = {}) {
  return await new Promise((resolveCommand) => {
    const child = spawn(file, args, {
      cwd: process.cwd(),
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });
    const stdout = [];
    const stderr = [];
    let size = 0;
    let overflow = false;
    const append = (target) => (chunk) => {
      size += chunk.length;
      if (size > MAX_OUTPUT_BYTES) {
        overflow = true;
        child.kill("SIGTERM");
        return;
      }
      target.push(chunk);
    };
    child.stdout.on("data", append(stdout));
    child.stderr.on("data", append(stderr));
    const timer = setTimeout(() => child.kill("SIGTERM"), timeoutMs);
    child.on("error", (error) => {
      clearTimeout(timer);
      resolveCommand({
        ok: false,
        code: null,
        stdout: "",
        stderr: error.message,
        overflow,
      });
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      resolveCommand({
        ok: code === 0 && !overflow,
        code,
        stdout: Buffer.concat(stdout).toString("utf8"),
        stderr: Buffer.concat(stderr).toString("utf8"),
        overflow,
      });
    });
  });
}

function parseJson(result) {
  try {
    return JSON.parse(result.stdout || "null");
  } catch {
    return null;
  }
}

async function writePrivate(path, value) {
  await writeFile(path, `${canonicalJson(redact(value))}\n`, { mode: 0o600 });
  await chmod(path, 0o600);
}

function failure(sourceType, observedAt, code, availability = "unavailable") {
  return unavailableSourceSnapshot({
    sourceType,
    observedAt,
    collectorVersion: COLLECTOR_VERSION,
    availability,
    failureCode: code,
  });
}

function available(sourceType, observedAt, records, evidenceRef) {
  return availableSourceSnapshot({
    sourceType,
    observedAt,
    collectorVersion: COLLECTOR_VERSION,
    records: Array.isArray(records) ? records : [records],
    evidenceRef,
  });
}

export async function collectDependencyRisk(arguments_ = []) {
  const observedAt = new Date().toISOString();
  const runId =
    option(arguments_, "--run-id") ??
    `${observedAt.replaceAll(/[:.]/g, "-")}-${stableId([process.cwd(), observedAt]).slice(0, 8)}`;
  const privateRoot = resolve(
    option(arguments_, "--private-dir") ?? ".dependency-risk/private",
  );
  const runDirectory = join(privateRoot, basename(runId));
  await mkdir(runDirectory, { recursive: true, mode: 0o700 });
  await chmod(privateRoot, 0o700);
  await chmod(runDirectory, 0o700);

  const snapshots = [];
  const records = [];
  const capture = async (sourceType, value) => {
    const path = join(runDirectory, `${sourceType}.json`);
    await writePrivate(path, value);
    const result = available(
      sourceType,
      observedAt,
      value,
      `${basename(privateRoot)}/${basename(runDirectory)}/${basename(path)}`,
    );
    snapshots.push(result.snapshot);
    records.push(...result.records);
  };

  const productionAudit = await command("corepack", [
    "pnpm",
    "audit",
    "--json",
    "--prod",
  ]);
  const productionJson = parseJson(productionAudit);
  if (productionJson)
    await capture("package_audit_production", [productionJson]);
  else
    snapshots.push(
      failure(
        "package_audit_production",
        observedAt,
        productionAudit.overflow ? "OUTPUT_LIMIT" : "AUDIT_COMMAND_FAILED",
      ),
    );

  const developmentAudit = await command("corepack", [
    "pnpm",
    "audit",
    "--json",
  ]);
  const developmentJson = parseJson(developmentAudit);
  if (developmentJson)
    await capture("package_audit_development", [developmentJson]);
  else
    snapshots.push(
      failure(
        "package_audit_development",
        observedAt,
        developmentAudit.overflow ? "OUTPUT_LIMIT" : "AUDIT_COMMAND_FAILED",
      ),
    );

  const graph = await command("corepack", [
    "pnpm",
    "list",
    "-r",
    "--depth",
    "Infinity",
    "--json",
  ]);
  const graphJson = parseJson(graph);
  if (graphJson) {
    const lockfile = await readFile("pnpm-lock.yaml", "utf8");
    await capture("manifests_lockfile", [
      { lockfileDigest: sha256(lockfile), graph: graphJson },
    ]);
  } else
    snapshots.push(
      failure(
        "manifests_lockfile",
        observedAt,
        graph.overflow ? "OUTPUT_LIMIT" : "GRAPH_COMMAND_FAILED",
      ),
    );

  const sbomPath = option(arguments_, "--sbom");
  if (sbomPath) {
    try {
      const sbom = JSON.parse(await readFile(resolve(sbomPath), "utf8"));
      await capture("sbom", [sbom]);
    } catch {
      snapshots.push(failure("sbom", observedAt, "SBOM_INVALID"));
    }
  } else
    snapshots.push(failure("sbom", observedAt, "SBOM_NOT_PROVIDED", "partial"));

  const githubSnapshot = option(arguments_, "--github-snapshot");
  if (githubSnapshot) {
    try {
      const github = JSON.parse(
        await readFile(resolve(githubSnapshot), "utf8"),
      );
      await capture("github_alerts", github.alerts ?? []);
      await capture("github_updates", github.updates ?? []);
    } catch {
      snapshots.push(
        failure("github_alerts", observedAt, "GITHUB_SNAPSHOT_INVALID"),
      );
      snapshots.push(
        failure("github_updates", observedAt, "GITHUB_SNAPSHOT_INVALID"),
      );
    }
  } else {
    snapshots.push(
      failure(
        "github_alerts",
        observedAt,
        "GITHUB_AUTH_NOT_TRANSFERRED",
        "unauthorized",
      ),
    );
    snapshots.push(
      failure(
        "github_updates",
        observedAt,
        "GITHUB_SNAPSHOT_NOT_PROVIDED",
        "partial",
      ),
    );
  }

  const maintainerReport = option(arguments_, "--maintainer-report");
  if (maintainerReport) {
    try {
      const report = JSON.parse(
        await readFile(resolve(maintainerReport), "utf8"),
      );
      await capture(
        "maintainer_report",
        Array.isArray(report) ? report : [report],
      );
    } catch {
      snapshots.push(
        failure("maintainer_report", observedAt, "MAINTAINER_REPORT_INVALID"),
      );
    }
  } else
    snapshots.push(
      failure(
        "maintainer_report",
        observedAt,
        "MAINTAINER_REPORT_NOT_PROVIDED",
        "partial",
      ),
    );

  const result = {
    schemaVersion: 1,
    runId,
    observedAt,
    collectorVersion: COLLECTOR_VERSION,
    environment: {
      id: process.env.METERKIT_SERVER_ENVIRONMENT_ID ?? "unknown",
      platform: process.platform,
      architecture: process.arch,
      node: process.version,
    },
    snapshots: snapshots.sort((left, right) =>
      left.sourceType.localeCompare(right.sourceType),
    ),
    records,
  };
  await writePrivate(join(runDirectory, "collection.json"), result);
  return { result, runDirectory };
}
