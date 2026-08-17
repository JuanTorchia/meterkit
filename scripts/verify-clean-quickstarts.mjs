#!/usr/bin/env node
import { execFileSync, spawn } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { createServer } from "node:net";
import process from "node:process";

const root = resolve(import.meta.dirname, "..");
const temporary = mkdtempSync(join(dirname(root), ".meterkit-clean-"));
const supportedSurfaces = ["express", "next-route", "hono"];
const supportedExperimentalSurfaces = ["mcp"];
const requestedSurfaces = (process.env.METERKIT_QUICKSTART_SURFACES ?? "")
  .split(",")
  .filter(Boolean);
const surfaces =
  requestedSurfaces.length === 0
    ? supportedSurfaces
    : supportedSurfaces.filter((surface) =>
        requestedSurfaces.includes(surface),
      );
const experimentalSurfaces =
  requestedSurfaces.length === 0
    ? supportedExperimentalSurfaces
    : supportedExperimentalSurfaces.filter((surface) =>
        requestedSurfaces.includes(surface),
      );
const requestedManagers = (process.env.METERKIT_QUICKSTART_MANAGERS ?? "")
  .split(",")
  .filter(Boolean);
const managers =
  requestedManagers.length === 0
    ? ["pnpm", "npm"]
    : ["pnpm", "npm"].filter((manager) => requestedManagers.includes(manager));
if (
  managers.length === 0 ||
  surfaces.length + experimentalSurfaces.length === 0
) {
  throw new Error("QUICKSTART_MATRIX_SELECTION_EMPTY");
}
const merchantWallet = "7NXuBzJ3EQV4CuxpSVELD3t1bs5xZ6ocfGvwjFDbCZUE";
const pnpmCommand = process.platform === "win32" ? "pnpm.cmd" : "pnpm";

function managerCommand(manager) {
  return process.platform === "win32" ? `${manager}.cmd` : manager;
}

function run(command, args, cwd) {
  return execFileSync(command, args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    timeout: 120_000,
  });
}

function pack(filter, destination) {
  run(pnpmCommand, ["--filter", filter, "build"], root);
  run(
    pnpmCommand,
    ["--filter", filter, "pack", "--pack-destination", destination],
    root,
  );
  const packageDirectory =
    filter === "create-meterkit"
      ? join(root, "packages/create-meterkit")
      : join(root, "packages", filter.split("/").at(-1));
  const version = JSON.parse(
    readFileSync(join(packageDirectory, "package.json"), "utf8"),
  ).version;
  const name =
    filter === "create-meterkit"
      ? "create-meterkit"
      : filter.replace("@", "").replace("/", "-");
  return join(destination, `${name}-${version}.tgz`);
}

async function waitForStatus(url, expected, child, diagnostics = () => "") {
  for (let attempt = 0; attempt < 240; attempt += 1) {
    if (child.exitCode !== null)
      throw new Error(
        `generated server exited with ${child.exitCode}: ${diagnostics()}`,
      );
    try {
      const response = await globalThis.fetch(url);
      if (response.status === expected) return;
    } catch {
      // The generated development server is still starting.
    }
    await new Promise((resolveWait) => globalThis.setTimeout(resolveWait, 250));
  }
  throw new Error(
    `generated server did not return HTTP ${expected}: ${diagnostics().slice(-2_000)}`,
  );
}

async function availablePort() {
  return await new Promise((resolvePort, rejectPort) => {
    const server = createServer();
    server.once("error", rejectPort);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        server.close();
        rejectPort(new Error("could not reserve a local port"));
        return;
      }
      server.close((error) =>
        error ? rejectPort(error) : resolvePort(address.port),
      );
    });
  });
}

async function exercise(project, surface, manager) {
  const port = await availablePort();
  const command = managerCommand(manager);
  const child = spawn(command, manager === "npm" ? ["run", "dev"] : ["dev"], {
    cwd: project,
    env: { ...process.env, PORT: String(port) },
    detached: process.platform !== "win32",
    stdio: ["ignore", "pipe", "pipe"],
  });
  let diagnostics = "";
  child.stdout.on("data", (chunk) => (diagnostics += String(chunk)));
  child.stderr.on("data", (chunk) => (diagnostics += String(chunk)));
  try {
    const resource = surface === "next-route" ? "/api/premium" : "/premium";
    await waitForStatus(
      `http://127.0.0.1:${port}${resource}`,
      402,
      child,
      () => diagnostics,
    );
    const checkUrl = `http://127.0.0.1:${port}${resource}`;
    run(
      command,
      manager === "npm"
        ? ["exec", "--", "meterkit", "check", checkUrl, "--allow-localhost"]
        : ["exec", "meterkit", "check", checkUrl, "--allow-localhost"],
      project,
    );
  } finally {
    if (child.exitCode === null) {
      await new Promise((resolveExit) => {
        const fallback = globalThis.setTimeout(resolveExit, 2_000);
        child.once("exit", () => {
          globalThis.clearTimeout(fallback);
          resolveExit();
        });
        if (process.platform === "win32") child.kill("SIGTERM");
        else process.kill(-child.pid, "SIGTERM");
      });
    }
  }
}

function exerciseExperimentalMcp(project, manager) {
  const output = run(
    managerCommand(manager),
    manager === "npm" ? ["run", "--silent", "check:unpaid"] : ["check:unpaid"],
    project,
  );
  const response = JSON.parse(output);
  if (!Array.isArray(response.accepts) || response.accepts.length === 0) {
    throw new Error("experimental MCP template did not emit native accepts");
  }
}

function install(project, manager) {
  const commands = {
    pnpm: ["install", "--ignore-scripts", "--no-frozen-lockfile"],
    npm: ["install", "--ignore-scripts", "--no-audit", "--no-fund"],
  };
  run(managerCommand(manager), commands[manager], project);
}

try {
  const packs = join(temporary, "packs");
  mkdirSync(packs);
  const corePack = pack("@usemeterkit/core", packs);
  const sdkPack = pack("@usemeterkit/sdk", packs);
  const databasePack = pack("@usemeterkit/database", packs);
  const cliPack = pack("@usemeterkit/cli", packs);
  const initializerPack = pack("create-meterkit", packs);
  const tool = join(temporary, "tool");
  mkdirSync(tool);
  writeFileSync(join(tool, "package.json"), JSON.stringify({ private: true }));
  run(
    "npm",
    [
      "install",
      "--ignore-scripts",
      "--no-audit",
      "--no-fund",
      corePack,
      initializerPack,
    ],
    tool,
  );
  const binary = join(
    tool,
    `node_modules/.bin/create-meterkit${process.platform === "win32" ? ".cmd" : ""}`,
  );
  const results = [];

  for (const manager of managers) {
    for (const surface of [...surfaces, ...experimentalSurfaces]) {
      process.stderr.write(`checking ${manager}/${surface}\n`);
      const project = join(temporary, `${manager}-${surface}`);
      run(
        binary,
        [
          project,
          "--surface",
          surface,
          "--package-manager",
          manager,
          "--recipient",
          merchantWallet,
          "--no-install",
        ],
        temporary,
      );
      const manifestPath = join(project, "package.json");
      const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
      manifest.dependencies = {
        ...manifest.dependencies,
        "@usemeterkit/core": `file:${corePack}`,
        "@usemeterkit/database": `file:${databasePack}`,
        "@usemeterkit/sdk": `file:${sdkPack}`,
      };
      if (manifest.devDependencies?.["@usemeterkit/cli"]) {
        manifest.devDependencies["@usemeterkit/cli"] = `file:${cliPack}`;
      }
      manifest.overrides = { "@usemeterkit/core": `file:${corePack}` };
      manifest.overrides["@usemeterkit/database"] = `file:${databasePack}`;
      manifest.resolutions = { "@usemeterkit/core": `file:${corePack}` };
      writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
      if (manager === "pnpm") {
        writeFileSync(
          join(project, "pnpm-workspace.yaml"),
          `overrides:\n  '@usemeterkit/core': 'file:${corePack}'\n`,
        );
      }
      for (const generatedInstallArtifact of [
        "node_modules",
        "pnpm-lock.yaml",
        "package-lock.json",
        "yarn.lock",
        "bun.lock",
        "bun.lockb",
      ]) {
        rmSync(join(project, generatedInstallArtifact), {
          recursive: true,
          force: true,
        });
      }
      install(project, manager);
      if (surface === "mcp") exerciseExperimentalMcp(project, manager);
      else await exercise(project, surface, manager);
      process.stderr.write(`passed ${manager}/${surface}\n`);
      results.push({
        manager,
        surface,
        evidenceType: surface === "mcp" ? "experimental-mcp-stdio" : "http-402",
      });
    }
  }

  process.stdout.write(
    `${JSON.stringify({ passed: true, kind: "meterkit-clean-generated-smoke", initializer: basename(initializerPack), combinations: results })}\n`,
  );
} finally {
  rmSync(temporary, {
    recursive: true,
    force: true,
    maxRetries: 10,
    retryDelay: 100,
  });
}
