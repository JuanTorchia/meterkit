import { createHash, randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { performance } from "node:perf_hooks";
import process from "node:process";
import { fileURLToPath } from "node:url";

export function calculatePercentiles(samples) {
  if (samples.length === 0) return { p50Ms: 0, p95Ms: 0, p99Ms: 0 };
  const sorted = [...samples].sort((left, right) => left - right);
  const nearestRank = (percent) =>
    sorted[Math.max(0, Math.ceil((percent / 100) * sorted.length) - 1)];
  return {
    p50Ms: round(nearestRank(50)),
    p95Ms: round(nearestRank(95)),
    p99Ms: round(nearestRank(99)),
  };
}

export function summarizeOutcomes(statuses) {
  const result = {
    total: statuses.length,
    success: 0,
    paymentRequired: 0,
    rateLimited: 0,
    dependencyFailure: 0,
    other: 0,
  };
  for (const status of statuses) {
    if (status >= 200 && status < 300) result.success += 1;
    else if (status === 402) result.paymentRequired += 1;
    else if (status === 429) result.rateLimited += 1;
    else if (status >= 500) result.dependencyFailure += 1;
    else result.other += 1;
  }
  return result;
}

export function assertZeroDuplicateExecutions(executionIds) {
  if (new Set(executionIds).size !== executionIds.length) {
    throw new Error("DUPLICATE_PROTECTED_EXECUTION");
  }
  return executionIds.length;
}

export async function runBenchmarkSuite(options = {}) {
  const outputDirectory = resolve(
    options.outputDirectory ?? "artifacts/benchmarks",
  );
  const targetUrl = options.targetUrl ?? process.env.BENCHMARK_TARGET_URL;
  const sourceCommit = git(["rev-parse", "HEAD"]);
  const dirty = git(["status", "--porcelain"]).length > 0;
  const workloads = options.workloads ?? [
    { scenario: "unpaid", concurrency: 1, requests: 20, timeoutMs: 2_000 },
    { scenario: "policy", concurrency: 25, requests: 100, timeoutMs: 2_000 },
    { scenario: "policy", concurrency: 100, requests: 300, timeoutMs: 2_000 },
    {
      scenario: "paid-retry",
      concurrency: 25,
      requests: 100,
      timeoutMs: 5_000,
    },
  ];
  await mkdir(outputDirectory, { recursive: true });
  const runs = [];
  for (const workload of workloads) {
    const run = await runWorkload({ workload, sourceCommit, dirty, targetUrl });
    const path = resolve(outputDirectory, `${run.runId}.json`);
    await writeFile(path, `${JSON.stringify(run, null, 2)}\n`, { mode: 0o644 });
    runs.push({ ...run, artifacts: [path] });
    await writeFile(path, `${JSON.stringify(runs.at(-1), null, 2)}\n`, {
      mode: 0o644,
    });
  }
  return runs;
}

async function runWorkload({ workload, sourceCommit, dirty, targetUrl }) {
  const startedAt = new Date().toISOString();
  const started = performance.now();
  const localSamples = [];
  const externalSamples = [];
  const statuses = [];
  const protectedExecutions = [];
  const operations = Array.from(
    { length: workload.requests },
    (_, index) => async () => {
      const localStarted = performance.now();
      const requestId = `${workload.scenario}-${index}`;
      createHash("sha256").update(`${requestId}:meterkit-policy-v1`).digest();
      localSamples.push(performance.now() - localStarted);
      if (targetUrl) {
        const externalStarted = performance.now();
        const response = await globalThis.fetch(targetUrl, {
          signal: globalThis.AbortSignal.timeout(workload.timeoutMs),
          headers: { "x-meterkit-benchmark": requestId },
        });
        externalSamples.push(performance.now() - externalStarted);
        statuses.push(response.status);
        if (response.ok && workload.scenario === "paid-retry") {
          protectedExecutions.push(requestId);
        }
        return;
      }
      externalSamples.push(0);
      statuses.push(workload.scenario === "unpaid" ? 402 : 200);
      if (workload.scenario === "paid-retry")
        protectedExecutions.push(requestId);
    },
  );
  await runBounded(operations, workload.concurrency);
  const executionCount = assertZeroDuplicateExecutions(protectedExecutions);
  return {
    schemaVersion: 1,
    runId: randomUUID(),
    sourceCommit,
    startedAt,
    durationMs: Math.max(1, Math.round(performance.now() - started)),
    environment: {
      runtime: process.version,
      platform: process.platform,
      architecture: process.arch,
      mode: targetUrl ? "external-http" : "local-in-process",
    },
    workload,
    latency: {
      local: calculatePercentiles(localSamples),
      external: calculatePercentiles(externalSamples),
    },
    outcomes: summarizeOutcomes(statuses),
    protectedExecutions: executionCount,
    duplicateExecutions: 0,
    limitations: [
      targetUrl
        ? "External latency includes network and target processing; it is not an SLA."
        : "External dependency latency is zero because no BENCHMARK_TARGET_URL was supplied.",
      "Local runs validate harness accounting and relative behavior, not production capacity.",
      ...(dirty
        ? [
            "The working tree was dirty; sourceCommit identifies the base revision only.",
          ]
        : []),
    ],
    artifacts: [],
  };
}

async function runBounded(operations, concurrency) {
  let cursor = 0;
  const workers = Array.from(
    { length: Math.min(concurrency, operations.length) },
    async () => {
      while (cursor < operations.length) {
        const operation = operations[cursor];
        cursor += 1;
        await operation();
      }
    },
  );
  await Promise.all(workers);
}

function git(args) {
  return execFileSync("git", args, { encoding: "utf8" }).trim();
}

function round(value) {
  return Number(value.toFixed(3));
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const runs = await runBenchmarkSuite();
  process.stdout.write(
    `${JSON.stringify(
      {
        runs: runs.map((run) => ({
          runId: run.runId,
          scenario: run.workload.scenario,
          concurrency: run.workload.concurrency,
          requests: run.workload.requests,
          latency: run.latency,
          outcomes: run.outcomes,
          protectedExecutions: run.protectedExecutions,
          duplicateExecutions: run.duplicateExecutions,
        })),
        note: "Local/internal benchmark evidence; not an external SLA.",
      },
      null,
      2,
    )}\n`,
  );
}
