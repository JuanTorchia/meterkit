#!/usr/bin/env node
import { createHash, randomUUID } from "node:crypto";
import { Buffer } from "node:buffer";
import { execFileSync, spawn } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";

const root = resolve(import.meta.dirname, "..");
const merchant = required("MERCHANT_WALLET");
const keypairPath = resolve(required("SOLANA_KEYPAIR_PATH"));
const rpcUrl = process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com";
const mint = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
const selectedSurface = process.env.METERKIT_DEVNET_SURFACE;
if (!selectedSurface) {
  for (const surface of ["express", "next-route", "hono"]) {
    execFileSync(process.execPath, [fileURLToPath(import.meta.url)], {
      cwd: process.cwd(),
      env: { ...process.env, METERKIT_DEVNET_SURFACE: surface },
      stdio: "inherit",
    });
  }
  process.exit(0);
}
if (!["express", "next-route", "hono"].includes(selectedSurface))
  throw new Error("METERKIT_DEVNET_SURFACE_INVALID");
const temporary = await mkdtemp(join(dirname(root), ".meterkit-paid-"));

function command(commandName, args, cwd = root) {
  return execFileSync(commandName, args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

async function port() {
  return await new Promise((resolvePort, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string")
        return reject(new Error("PORT_ALLOCATION_FAILED"));
      server.close((error) =>
        error ? reject(error) : resolvePort(address.port),
      );
    });
  });
}

async function balance(owner) {
  const response = await globalThis.fetch(rpcUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: randomUUID(),
      method: "getTokenAccountsByOwner",
      params: [
        owner,
        { mint },
        { encoding: "jsonParsed", commitment: "confirmed" },
      ],
    }),
  });
  const body = await response.json();
  if (!response.ok || body.error) throw new Error("BALANCE_RPC_FAILED");
  return (body.result?.value ?? []).reduce(
    (sum, item) =>
      sum +
      BigInt(item.account?.data?.parsed?.info?.tokenAmount?.amount ?? "0"),
    0n,
  );
}

async function waitForServer(url, child) {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    if (child.exitCode !== null) throw new Error("GENERATED_SERVER_EXITED");
    try {
      const response = await globalThis.fetch(url);
      if (response.status === 402) return;
    } catch {
      // Server is still starting.
    }
    await new Promise((resolveWait) => globalThis.setTimeout(resolveWait, 250));
  }
  throw new Error("GENERATED_SERVER_TIMEOUT");
}

try {
  const packs = join(temporary, "packs");
  await mkdir(packs);
  for (const filter of [
    "@usemeterkit/core",
    "@usemeterkit/database",
    "@usemeterkit/sdk",
    "@usemeterkit/cli",
    "create-meterkit",
  ]) {
    command("pnpm", ["--filter", filter, "build"]);
    command("pnpm", ["--filter", filter, "pack", "--pack-destination", packs]);
  }
  const corePack = join(packs, "usemeterkit-core-0.3.0.tgz");
  const databasePack = join(packs, "usemeterkit-database-0.3.0.tgz");
  const sdkPack = join(packs, "usemeterkit-sdk-0.3.0.tgz");
  const cliPack = join(packs, "usemeterkit-cli-0.3.0.tgz");
  const initializerPack = join(packs, "create-meterkit-0.3.0.tgz");
  const tool = join(temporary, "tool");
  await mkdir(tool);
  await writeFile(
    join(tool, "package.json"),
    JSON.stringify({ private: true }),
  );
  command(
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
  const project = join(temporary, `provider-${selectedSurface}`);
  command(
    join(tool, "node_modules/.bin/create-meterkit"),
    [
      project,
      "--surface",
      selectedSurface,
      "--package-manager",
      "npm",
      "--recipient",
      merchant,
      "--store",
      "postgres",
      "--no-install",
    ],
    temporary,
  );
  const manifestPath = join(project, "package.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  manifest.dependencies = {
    ...manifest.dependencies,
    "@usemeterkit/core": `file:${corePack}`,
    "@usemeterkit/database": `file:${databasePack}`,
    "@usemeterkit/sdk": `file:${sdkPack}`,
  };
  manifest.devDependencies = {
    ...manifest.devDependencies,
    "@usemeterkit/cli": `file:${cliPack}`,
  };
  manifest.overrides = {
    "@usemeterkit/core": `file:${corePack}`,
    "@usemeterkit/database": `file:${databasePack}`,
  };
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  const selectedPort = await port();
  const environmentPath = join(
    project,
    selectedSurface === "next-route" ? ".env.local" : ".env",
  );
  const environment = (await readFile(environmentPath, "utf8"))
    .replace(
      /^# DATABASE_URL=.*$/m,
      `DATABASE_URL=${required("DATABASE_TEST_URL")}`,
    )
    .concat(`\nPORT=${selectedPort}\nSOLANA_RPC_URL=${rpcUrl}\n`);
  await writeFile(environmentPath, environment, { mode: 0o600 });
  command(
    "npm",
    ["install", "--ignore-scripts", "--no-audit", "--no-fund"],
    project,
  );

  command("pnpm", ["--filter", "@usemeterkit/example-client", "build"]);
  const { createDevnetPaymentProof } =
    await import("../examples/client/dist/index.js");
  const privateKey = JSON.parse(await readFile(keypairPath, "utf8"));
  if (!Array.isArray(privateKey) || privateKey.length !== 64)
    throw new Error("INVALID_DISPOSABLE_KEYPAIR");
  const resource = `http://localhost:${selectedPort}${
    selectedSurface === "next-route" ? "/api/premium" : "/premium"
  }`;
  const providerEnvironment = { ...process.env };
  delete providerEnvironment.MERCHANT_WALLET;
  delete providerEnvironment.DATABASE_URL;
  delete providerEnvironment.DURABILITY_MODE;
  // Next chooses its listen port before loading .env.local. This is runtime
  // process configuration, not a hidden payment-policy input.
  providerEnvironment.PORT = String(selectedPort);
  const startProvider = () =>
    spawn("npm", ["run", "dev"], {
      cwd: project,
      env: providerEnvironment,
      detached: process.platform !== "win32",
      stdio: "ignore",
    });
  let server = startProvider();
  try {
    await waitForServer(resource, server);
    const before = await balance(merchant);
    const paymentSignature = await createDevnetPaymentProof(
      {
        privateKeyBytes: Uint8Array.from(privateKey),
        maxPerRequestAtomic: 10_000n,
        maxSessionAtomic: 10_000n,
        rpcUrl,
        expectedAssetMint: mint,
        expectedPayTo: merchant,
        allowedResourcePrefix: resource,
      },
      resource,
    );
    const concurrent = await Promise.all([
      globalThis.fetch(resource, {
        headers: { "PAYMENT-SIGNATURE": paymentSignature },
      }),
      globalThis.fetch(resource, {
        headers: { "PAYMENT-SIGNATURE": paymentSignature },
      }),
    ]);
    const accepted = concurrent.filter(({ ok }) => ok);
    if (accepted.length !== 1)
      throw new Error(`CONCURRENT_PROTECTED_EXECUTIONS_${accepted.length}`);
    const response = accepted[0];
    const paymentResponse = response.headers.get("PAYMENT-RESPONSE");
    if (!paymentResponse || !paymentSignature)
      throw new Error("PAYMENT_EVIDENCE_MISSING");
    const receipt = JSON.parse(
      Buffer.from(paymentResponse, "base64").toString("utf8"),
    );
    if (typeof receipt.transaction !== "string")
      throw new Error("SETTLEMENT_SIGNATURE_MISSING");
    const replay = await globalThis.fetch(resource, {
      headers: { "PAYMENT-SIGNATURE": paymentSignature },
    });
    if (replay.ok) throw new Error("REPLAY_ACCEPTED");
    await stopProvider(server);
    server = startProvider();
    await waitForServer(resource, server);
    const replayAfterRestart = await globalThis.fetch(resource, {
      headers: { "PAYMENT-SIGNATURE": paymentSignature },
    });
    if (replayAfterRestart.ok)
      throw new Error(
        `POST_RESTART_REPLAY_NOT_REJECTED_${replayAfterRestart.status}`,
      );
    const after = await balance(merchant);
    if (after < before + 10_000n)
      throw new Error("DIRECT_SETTLEMENT_NOT_OBSERVED");
    const signatureFingerprint = createHash("sha256")
      .update(receipt.transaction)
      .digest("hex")
      .slice(0, 16);
    const evidence = {
      schemaVersion: 1,
      kind: "meterkit-packed-initializer-devnet",
      checkedAt: new Date().toISOString(),
      network: "solana-devnet",
      surface: selectedSurface,
      packageManager: "npm",
      amountAtomic: "10000",
      recipient: merchant,
      merchantBalanceBeforeAtomic: String(before),
      merchantBalanceAfterAtomic: String(after),
      protectedStatus: response.status,
      concurrentStatuses: concurrent.map(({ status }) => status),
      protectedExecutions: accepted.length,
      replayStatus: replay.status,
      replayAfterRestartStatus: replayAfterRestart.status,
      signatureFingerprint,
      explorerUrl: `https://explorer.solana.com/tx/${receipt.transaction}?cluster=devnet`,
      externalUser: false,
    };
    const evidencePath = join(
      root,
      `artifacts/world-class-evidence/generated-devnet-${selectedSurface}.json`,
    );
    await mkdir(dirname(evidencePath), { recursive: true });
    await writeFile(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`, {
      mode: 0o600,
    });
    process.stdout.write(
      `${JSON.stringify({ ...evidence, explorerUrl: "[SANITIZED: see local evidence artifact]" })}\n`,
    );
    await stopProvider(server);
    const unavailableEnvironment = environment.replace(
      /^DATABASE_URL=.*$/m,
      "DATABASE_URL=postgresql://meterkit:meterkit@127.0.0.1:1/meterkit",
    );
    await writeFile(environmentPath, unavailableEnvironment, { mode: 0o600 });
    server = startProvider();
    let failedClosed = false;
    for (let attempt = 0; attempt < 40; attempt += 1) {
      if (server.exitCode !== null) {
        failedClosed = true;
        break;
      }
      try {
        const result = await globalThis.fetch(resource);
        if (result.status === 402)
          throw new Error("DATABASE_FAILURE_FELL_BACK_TO_PAID_SERVING");
        if (result.status >= 500) {
          failedClosed = true;
          break;
        }
      } catch (error) {
        if (
          error instanceof Error &&
          error.message === "DATABASE_FAILURE_FELL_BACK_TO_PAID_SERVING"
        )
          throw error;
        if (attempt >= 5) {
          failedClosed = true;
          break;
        }
      }
      await new Promise((resolveWait) =>
        globalThis.setTimeout(resolveWait, 250),
      );
    }
    if (!failedClosed) throw new Error("DATABASE_FAILURE_DID_NOT_FAIL_CLOSED");
  } finally {
    await stopProvider(server);
  }
} finally {
  await removeTemporaryProject(temporary);
}

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

async function stopProvider(child) {
  if (child.exitCode !== null) return;
  await new Promise((resolveExit) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      globalThis.clearTimeout(fallback);
      resolveExit();
    };
    const fallback = globalThis.setTimeout(() => {
      try {
        if (process.platform === "win32") child.kill("SIGKILL");
        else process.kill(-child.pid, "SIGKILL");
      } catch {
        // The process tree already exited between the status check and signal.
      }
      globalThis.setTimeout(finish, 500);
    }, 2_000);
    child.once("exit", () => {
      finish();
    });
    try {
      if (process.platform === "win32") child.kill("SIGTERM");
      else process.kill(-child.pid, "SIGTERM");
    } catch {
      finish();
    }
  });
}

async function removeTemporaryProject(path) {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    try {
      await rm(path, { recursive: true, force: true });
      return;
    } catch (error) {
      if (
        !(error instanceof Error) ||
        !("code" in error) ||
        !["ENOTEMPTY", "EBUSY"].includes(error.code)
      )
        throw error;
      await new Promise((resolveWait) =>
        globalThis.setTimeout(resolveWait, 250),
      );
    }
  }
  throw new Error("TEMPORARY_PROJECT_CLEANUP_FAILED");
}
