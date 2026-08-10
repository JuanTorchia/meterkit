import { Buffer } from "node:buffer";
import { platform, release } from "node:os";
import { performance } from "node:perf_hooks";
import process from "node:process";

const gateway = (
  process.env.METERKIT_GATEWAY_URL ?? "https://meterkit-api.juanchi.dev"
).replace(/\/+$/, "");
const startedAt = new Date();
const checks = [];

async function check(name, operation) {
  const start = performance.now();
  try {
    const evidence = await operation();
    checks.push({
      name,
      ok: true,
      durationMs: Math.round(performance.now() - start),
      evidence,
    });
  } catch (error) {
    checks.push({
      name,
      ok: false,
      durationMs: Math.round(performance.now() - start),
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

await check("gateway health", async () => {
  const response = await globalThis.fetch(`${gateway}/health`, {
    signal: globalThis.AbortSignal.timeout(10_000),
  });
  const body = await response.json();
  if (!response.ok || body.status !== "ok" || body.custody !== false) {
    throw new Error(`unexpected health response (${response.status})`);
  }
  return { status: body.status, network: body.network, custody: body.custody };
});

await check("public product discovery", async () => {
  const response = await globalThis.fetch(`${gateway}/v1/public/products`, {
    signal: globalThis.AbortSignal.timeout(10_000),
  });
  const products = await response.json();
  if (!response.ok || !Array.isArray(products) || products.length === 0) {
    throw new Error(`no public products (${response.status})`);
  }
  const product = products[0];
  return {
    count: products.length,
    sample: {
      id: product.id,
      priceAtomic: product.priceAtomic,
      network: product.network,
      assetMint: product.assetMint,
      payTo: product.payTo,
    },
  };
});

await check("unpaid request returns x402 challenge", async () => {
  const response = await globalThis.fetch(`${gateway}/v1/weather/premium`, {
    redirect: "manual",
    signal: globalThis.AbortSignal.timeout(15_000),
  });
  if (response.status !== 402)
    throw new Error(`expected HTTP 402, received ${response.status}`);
  const challenge = response.headers.get("payment-required");
  if (!challenge) throw new Error("PAYMENT-REQUIRED header missing");
  return {
    status: response.status,
    paymentRequiredHeader: true,
    challengeBytes: Buffer.byteLength(challenge),
  };
});

await check("private tenant data fails closed", async () => {
  const response = await globalThis.fetch(`${gateway}/v1/products`, {
    signal: globalThis.AbortSignal.timeout(10_000),
  });
  if (response.status !== 401)
    throw new Error(`expected HTTP 401, received ${response.status}`);
  return { status: response.status };
});

const passed = checks.every((item) => item.ok);
const report = {
  schemaVersion: 1,
  kind: "meterkit-pilot-readiness",
  passed,
  startedAt: startedAt.toISOString(),
  finishedAt: new Date().toISOString(),
  target: gateway,
  runtime: { node: process.version, platform: platform(), release: release() },
  checks,
  notice:
    "This readiness check uses no wallet, private key, mainnet asset, or personal data. It is not a completed payment pilot.",
  nextStep:
    "Follow docs/pilot-quickstart.md to complete a devnet settlement and submit the pilot report.",
};

process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (!passed) process.exitCode = 1;
