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
import process from "node:process";
import { createServer } from "node:net";

const root = resolve(import.meta.dirname, "..");
const temporary = mkdtempSync(join(dirname(root), ".meterkit-clean-"));
const surfaces = ["express", "next-route", "hono", "mcp"];
const managers = ["pnpm", "npm", "yarn", "bun"];
const merchantWallet = "7NXuBzJ3EQV4CuxpSVELD3t1bs5xZ6ocfGvwjFDbCZUE";

function run(command, args, cwd) {
  return execFileSync(command, args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function pack(filter, destination) {
  run(
    "pnpm",
    ["--filter", filter, "pack", "--pack-destination", destination],
    root,
  );
  const name =
    filter === "create-meterkit"
      ? "create-meterkit"
      : filter.replace("@", "").replace("/", "-");
  return join(destination, `${name}-0.1.0.tgz`);
}

async function waitForStatus(url, expected, child, diagnostics = () => "") {
  for (let attempt = 0; attempt < 80; attempt += 1) {
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
  throw new Error(`generated server did not return HTTP ${expected}`);
}

async function availablePort() {
  return await new Promise((resolvePort, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        reject(new Error("unable to allocate test port"));
        return;
      }
      server.close((error) =>
        error ? reject(error) : resolvePort(address.port),
      );
    });
  });
}

async function exercise(project, surface) {
  if (surface === "mcp") {
    const output = execFileSync(
      join(project, "node_modules/.bin/tsx"),
      ["src/server.ts", "--unpaid"],
      {
        cwd: project,
        encoding: "utf8",
        env: { ...process.env, MERCHANT_WALLET: merchantWallet },
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    const response = JSON.parse(output);
    if (response.status !== 402 || response.network !== "solana-devnet")
      throw new Error("MCP template did not emit its unpaid contract");
    return;
  }
  const port = await availablePort();
  const executable = surface === "next-route" ? "next" : "tsx";
  const args =
    surface === "next-route" ? ["dev", "-p", String(port)] : ["src/server.ts"];
  const child = spawn(join(project, `node_modules/.bin/${executable}`), args, {
    cwd: project,
    env: {
      ...process.env,
      MERCHANT_WALLET: merchantWallet,
      PORT: String(port),
    },
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
  } finally {
    if (child.exitCode === null) {
      await new Promise((resolveExit) => {
        const fallback = globalThis.setTimeout(resolveExit, 2_000);
        child.once("exit", () => {
          globalThis.clearTimeout(fallback);
          resolveExit();
        });
        child.kill("SIGTERM");
      });
    }
  }
}

function install(project, manager) {
  const commands = {
    pnpm: ["install", "--ignore-scripts", "--no-frozen-lockfile"],
    npm: ["install", "--ignore-scripts", "--no-audit", "--no-fund"],
    yarn: ["install", "--ignore-scripts", "--non-interactive"],
    bun: ["install", "--ignore-scripts"],
  };
  run(manager, commands[manager], project);
}

try {
  const packs = join(temporary, "packs");
  mkdirSync(packs);
  const corePack = pack("@usemeterkit/core", packs);
  const sdkPack = pack("@usemeterkit/sdk", packs);
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
  const binary = join(tool, "node_modules/.bin/create-meterkit");
  const results = [];

  for (const manager of managers) {
    for (const surface of surfaces) {
      const project = join(temporary, `${manager}-${surface}`);
      run(
        binary,
        [project, "--surface", surface, "--package-manager", manager, "--yes"],
        temporary,
      );
      const manifestPath = join(project, "package.json");
      const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
      manifest.dependencies = {
        ...manifest.dependencies,
        "@usemeterkit/core": `file:${corePack}`,
        "@usemeterkit/sdk": `file:${sdkPack}`,
      };
      manifest.overrides = { "@usemeterkit/core": `file:${corePack}` };
      manifest.resolutions = { "@usemeterkit/core": `file:${corePack}` };
      manifest.pnpm = {
        overrides: { "@usemeterkit/core": `file:${corePack}` },
      };
      writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
      install(project, manager);
      await exercise(project, surface);
      results.push({ manager, surface, unpaidStatus: 402 });
    }
  }

  process.stdout.write(
    `${JSON.stringify({ passed: true, kind: "meterkit-clean-generated-smoke", initializer: basename(initializerPack), combinations: results })}\n`,
  );
} finally {
  rmSync(temporary, { recursive: true, force: true });
}
