#!/usr/bin/env node
import { execFileSync, spawn } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createServer } from "node:net";
import { registrySmokeReportSchema } from "../packages/core/dist/index.js";
import { decideRegistryPromotion } from "./registry-promotion.mjs";

const version = process.env.METERKIT_REGISTRY_VERSION;
if (!version || !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version))
  throw new Error("METERKIT_REGISTRY_VERSION_REQUIRED");
const managers = (process.env.METERKIT_QUICKSTART_MANAGERS ?? "npm,pnpm")
  .split(",")
  .filter(Boolean);
const surfaces = (
  process.env.METERKIT_QUICKSTART_SURFACES ?? "express,next-route,hono,mcp"
)
  .split(",")
  .filter(Boolean);
const recipient = "7NXuBzJ3EQV4CuxpSVELD3t1bs5xZ6ocfGvwjFDbCZUE";
const temporary = mkdtempSync(join(tmpdir(), "meterkit-registry-"));

function run(command, args, cwd = temporary) {
  return execFileSync(command, args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    timeout: 180_000,
  });
}
async function port() {
  return await new Promise((resolve, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string")
        return reject(new Error("PORT_UNAVAILABLE"));
      server.close((error) => (error ? reject(error) : resolve(address.port)));
    });
  });
}
async function stop(child) {
  if (child.exitCode !== null) return;
  await new Promise((resolve) => {
    const timer = setTimeout(resolve, 2_000);
    child.once("exit", () => {
      clearTimeout(timer);
      resolve();
    });
    if (process.platform === "win32") child.kill("SIGTERM");
    else process.kill(-child.pid, "SIGTERM");
  });
}
async function exercise(project, manager, surface) {
  if (surface === "mcp") {
    const output = run(
      manager,
      manager === "npm"
        ? ["run", "--silent", "check:unpaid"]
        : ["check:unpaid"],
      project,
    );
    if (!JSON.parse(output).accepts?.length)
      throw new Error("MCP_CHALLENGE_INVALID");
    return { status: "passed", protocol: "mcp-stdio-experimental" };
  }
  const selectedPort = await port();
  const child = spawn(manager, manager === "npm" ? ["run", "dev"] : ["dev"], {
    cwd: project,
    env: { ...process.env, PORT: String(selectedPort) },
    detached: process.platform !== "win32",
    stdio: "ignore",
  });
  const path = surface === "next-route" ? "/api/premium" : "/premium";
  const url = `http://127.0.0.1:${selectedPort}${path}`;
  try {
    let ready = false;
    for (let attempt = 0; attempt < 240; attempt += 1) {
      if (child.exitCode !== null) throw new Error("REGISTRY_SERVER_EXITED");
      try {
        if ((await fetch(url)).status === 402) {
          ready = true;
          break;
        }
      } catch {
        // The generated server may refuse connections while it is starting.
      }
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    if (!ready) throw new Error("REGISTRY_SERVER_TIMEOUT");
    run(
      manager,
      manager === "npm"
        ? ["exec", "--", "meterkit", "check", url, "--allow-localhost"]
        : ["exec", "meterkit", "check", url, "--allow-localhost"],
      project,
    );
    return { status: "passed", protocol: "http-402" };
  } finally {
    await stop(child);
  }
}

try {
  const metadata = JSON.parse(
    run("npm", [
      "view",
      `create-meterkit@${version}`,
      "dist.integrity",
      "dist.tarball",
      "version",
      "--json",
    ]),
  );
  if (
    metadata.version !== version ||
    !metadata["dist.integrity"] ||
    !metadata["dist.tarball"]
  )
    throw new Error("REGISTRY_METADATA_INCOMPLETE");
  const results = [];
  for (const manager of managers)
    for (const surface of surfaces) {
      const project = join(temporary, `${manager}-${surface}`);
      run(
        "npm",
        [
          "create",
          `meterkit@${version}`,
          "--",
          project,
          "--surface",
          surface,
          "--package-manager",
          manager,
          "--recipient",
          recipient,
          "--yes",
        ],
        temporary,
      );
      const manifest = JSON.parse(
        readFileSync(join(project, "package.json"), "utf8"),
      );
      for (const name of ["@usemeterkit/sdk", "@usemeterkit/database"])
        if (manifest.dependencies?.[name] !== version)
          throw new Error(`REGISTRY_DEPENDENCY_MISMATCH_${name}`);
      results.push({
        manager,
        surface,
        ...(await exercise(project, manager, surface)),
      });
    }
  const report = registrySmokeReportSchema.parse({
    schemaVersion: 1,
    classification: "registry_synthetic",
    generatedAt: new Date().toISOString(),
    packageName: "create-meterkit",
    packageVersion: version,
    integrity: metadata["dist.integrity"],
    resolved: metadata["dist.tarball"],
    os: process.platform,
    nodeVersion: process.version,
    cells: results,
    promotion: decideRegistryPromotion({
      candidateVersion: version,
      previousRecommendedVersion:
        process.env.METERKIT_PREVIOUS_RECOMMENDED_VERSION ?? null,
      cells: results,
    }),
  });
  process.stdout.write(`${JSON.stringify(report)}\n`);
} finally {
  rmSync(temporary, { recursive: true, force: true });
}
