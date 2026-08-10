#!/usr/bin/env node
import { createHash, randomUUID } from "node:crypto";
import { Buffer } from "node:buffer";
import { execFileSync, spawn } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { dirname, join, resolve } from "node:path";
import process from "node:process";

const root = resolve(import.meta.dirname, "..");
const merchant = required("MERCHANT_WALLET");
const keypairPath = resolve(required("SOLANA_KEYPAIR_PATH"));
const rpcUrl = process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com";
const mint = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
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
    "@usemeterkit/sdk",
    "create-meterkit",
  ]) {
    command("pnpm", ["--filter", filter, "build"]);
    command("pnpm", ["--filter", filter, "pack", "--pack-destination", packs]);
  }
  const corePack = join(packs, "usemeterkit-core-0.2.0.tgz");
  const sdkPack = join(packs, "usemeterkit-sdk-0.2.0.tgz");
  const initializerPack = join(packs, "create-meterkit-0.2.0.tgz");
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
  const project = join(temporary, "provider");
  command(
    join(tool, "node_modules/.bin/create-meterkit"),
    [project, "--surface", "express", "--package-manager", "npm", "--yes"],
    temporary,
  );
  const manifestPath = join(project, "package.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  manifest.dependencies = {
    ...manifest.dependencies,
    "@usemeterkit/core": `file:${corePack}`,
    "@usemeterkit/sdk": `file:${sdkPack}`,
  };
  manifest.overrides = { "@usemeterkit/core": `file:${corePack}` };
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  command(
    "npm",
    ["install", "--ignore-scripts", "--no-audit", "--no-fund"],
    project,
  );

  command("pnpm", ["--filter", "@usemeterkit/example-client", "build"]);
  const { createDevnetPaymentClient } =
    await import("../examples/client/dist/index.js");
  const privateKey = JSON.parse(await readFile(keypairPath, "utf8"));
  if (!Array.isArray(privateKey) || privateKey.length !== 64)
    throw new Error("INVALID_DISPOSABLE_KEYPAIR");
  const selectedPort = await port();
  const resource = `http://localhost:${selectedPort}/premium`;
  const server = spawn(
    join(project, "node_modules/.bin/tsx"),
    ["src/server.ts"],
    {
      cwd: project,
      env: {
        ...process.env,
        MERCHANT_WALLET: merchant,
        PORT: String(selectedPort),
        SOLANA_RPC_URL: rpcUrl,
      },
      stdio: "ignore",
    },
  );
  try {
    await waitForServer(resource, server);
    const before = await balance(merchant);
    const client = await createDevnetPaymentClient({
      privateKeyBytes: Uint8Array.from(privateKey),
      maxPerRequestAtomic: 10_000n,
      maxSessionAtomic: 10_000n,
      rpcUrl,
      expectedAssetMint: mint,
      expectedPayTo: merchant,
      allowedResourcePrefix: resource,
    });
    const response = await client.fetch(resource);
    if (!response.ok) throw new Error(`PAID_RETRY_FAILED_${response.status}`);
    const paymentResponse = response.headers.get("PAYMENT-RESPONSE");
    const paymentSignature = client.getLastPaymentHeader();
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
      surface: "express",
      packageManager: "npm",
      amountAtomic: "10000",
      recipient: merchant,
      merchantBalanceBeforeAtomic: String(before),
      merchantBalanceAfterAtomic: String(after),
      protectedStatus: response.status,
      replayStatus: replay.status,
      signatureFingerprint,
      explorerUrl: `https://explorer.solana.com/tx/${receipt.transaction}?cluster=devnet`,
      externalUser: false,
    };
    const evidencePath = join(
      root,
      "artifacts/world-class-evidence/generated-devnet.json",
    );
    await mkdir(dirname(evidencePath), { recursive: true });
    await writeFile(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`, {
      mode: 0o600,
    });
    process.stdout.write(
      `${JSON.stringify({ ...evidence, explorerUrl: "[SANITIZED: see local evidence artifact]" })}\n`,
    );
  } finally {
    if (server.exitCode === null) {
      await new Promise((resolveExit) => {
        const fallback = globalThis.setTimeout(resolveExit, 2_000);
        server.once("exit", () => {
          globalThis.clearTimeout(fallback);
          resolveExit();
        });
        server.kill("SIGTERM");
      });
    }
  }
} finally {
  await rm(temporary, { recursive: true, force: true });
}

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}
