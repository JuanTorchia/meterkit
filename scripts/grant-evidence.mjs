import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import process from "node:process";
import { URL } from "node:url";

const root = new URL("..", import.meta.url);
const startedAt = new Date();
const checks = [];

function run(name, command, args, options = {}) {
  const started = Date.now();
  try {
    const output = execFileSync(command, args, {
      cwd: root,
      encoding: "utf8",
      env: { ...process.env, ...options.env },
      timeout: options.timeout ?? 15 * 60_000,
      stdio: ["ignore", "pipe", "pipe"],
    });
    checks.push({ name, status: "passed", durationMs: Date.now() - started, summary: tail(output) });
    return output;
  } catch (error) {
    checks.push({
      name,
      status: options.optional ? "skipped" : "failed",
      durationMs: Date.now() - started,
      summary: sanitize(error instanceof Error ? error.message : String(error)),
    });
    if (!options.optional) process.exitCode = 1;
    return "";
  }
}

const commit = run("exact commit", "git", ["rev-parse", "HEAD"]).trim();
run("clean secret patterns", "node", ["scripts/scan-secrets.mjs"]);
run("lint", "pnpm", ["lint"]);
run("typecheck", "pnpm", ["typecheck"]);
run("unit and integration tests", "pnpm", ["test"], {
  env: {
    DATABASE_TEST_URL: process.env.DATABASE_TEST_URL ??
      "postgresql://meterkit:meterkit@127.0.0.1:5432/meterkit",
  },
});
run("production build", "pnpm", ["build"]);
run("browser E2E", "pnpm", ["test:e2e"]);
run("production dependency audit", "pnpm", ["audit", "--prod", "--audit-level=high"]);
const imageTag = commit.slice(0, 12) || "local";
run("build gateway container", "docker", [
  "build", "--file", "Dockerfile.gateway", "--tag", `meterkit-gateway:${imageTag}`, ".",
]);
run("build web container", "docker", [
  "build", "--file", "Dockerfile.web",
  "--build-arg", "NEXT_PUBLIC_GATEWAY_URL=https://meterkit-api.juanchi.dev",
  "--tag", `meterkit-web:${imageTag}`, ".",
]);
for (const image of [`meterkit-gateway:${imageTag}`, `meterkit-web:${imageTag}`]) {
  run(`Trivy ${image}`, "docker", [
    "run", "--rm",
    "-v", "/var/run/docker.sock:/var/run/docker.sock",
    "-v", "meterkit-trivy-cache:/root/.cache/trivy",
    "aquasec/trivy:0.70.0@sha256:be1190afcb28352bfddc4ddeb71470835d16462af68d310f9f4bca710961a41e",
    "image", "--scanners", "vuln", "--severity", "HIGH,CRITICAL",
    "--ignore-unfixed", "--exit-code", "1", "--quiet", image,
  ], { timeout: 10 * 60_000 });
}
run("public devnet health and x402 challenge", "pnpm", ["pilot:check"]);

if (process.env.SOLANA_PRIVATE_KEY && process.env.MERCHANT_WALLET) {
  run("live x402 devnet settlement and replay", "pnpm", [
    "--filter", "@usemeterkit/example-client", "verify:devnet",
  ], {
    env: {
      GATEWAY_URL: process.env.GATEWAY_URL ??
        process.env.METERKIT_GATEWAY_URL ??
        "https://meterkit-api.juanchi.dev",
    },
  });
} else {
  checks.push({
    name: "live x402 devnet settlement and replay",
    status: "skipped",
    summary: "Requires applicant-controlled SOLANA_PRIVATE_KEY and MERCHANT_WALLET; no secret was loaded.",
  });
}

if (process.env.SOLANA_KEYPAIR_PATH && process.env.MERCHANT_WALLET) {
  run("live paid MCP devnet report", "pnpm", [
    "--filter", "@usemeterkit/mcp-scout", "pay:devnet", "anza-xyz/kit",
  ]);
} else {
  checks.push({
    name: "live paid MCP devnet report",
    status: "skipped",
    summary: "Requires applicant-controlled SOLANA_KEYPAIR_PATH and MERCHANT_WALLET; no keypair was loaded.",
  });
}

const report = {
  schemaVersion: 1,
  kind: "meterkit-grant-evidence",
  factualScope: "Automated internal verification; it is not an external pilot or revenue evidence.",
  startedAt: startedAt.toISOString(),
  finishedAt: new Date().toISOString(),
  commit,
  network: "solana-devnet",
  custody: false,
  passed: checks.every((check) => check.status !== "failed"),
  checks,
  publicEndpoints: {
    web: process.env.METERKIT_WEB_URL ?? "https://meterkit.juanchi.dev",
    gateway: process.env.METERKIT_GATEWAY_URL ?? "https://meterkit-api.juanchi.dev",
  },
  redaction: "Secrets, bearer tokens, private keys and full transaction signatures are excluded.",
};

mkdirSync(new URL("../artifacts", import.meta.url), { recursive: true });
const outputPath = new URL("../artifacts/grant-evidence.json", import.meta.url);
writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, { mode: 0o600 });
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);

function tail(value) {
  const cleaned = sanitize(value).trim().split("\n").filter(Boolean);
  return cleaned.slice(-4).join(" · ").slice(0, 800);
}

function sanitize(value) {
  return value
    .replace(/Bearer\s+[A-Za-z0-9._~-]+/gi, "Bearer [REDACTED]")
    .replace(/\[(?:\s*\d{1,3}\s*,){63}\s*\d{1,3}\s*\]/g, "[REDACTED_PRIVATE_KEY]")
    .replace(/\b[1-9A-HJ-NP-Za-km-z]{64,88}\b/g, (match) =>
      `${match.slice(0, 6)}…${match.slice(-6)}`);
}
