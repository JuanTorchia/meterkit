import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { URL } from "node:url";
import test from "node:test";
import { benchmarkRunSchema } from "../packages/core/dist/index.js";
import {
  assertZeroDuplicateExecutions,
  calculatePercentiles,
  summarizeOutcomes,
} from "./benchmark.mjs";

test("calculatePercentiles reports ordered nearest-rank values", () => {
  assert.deepEqual(calculatePercentiles([10, 1, 8, 4, 2]), {
    p50Ms: 4,
    p95Ms: 10,
    p99Ms: 10,
  });
  assert.deepEqual(calculatePercentiles([]), {
    p50Ms: 0,
    p95Ms: 0,
    p99Ms: 0,
  });
});

test("summarizeOutcomes accounts for every request", () => {
  const outcomes = summarizeOutcomes([200, 200, 402, 429, 503]);
  assert.deepEqual(outcomes, {
    total: 5,
    success: 2,
    paymentRequired: 1,
    rateLimited: 1,
    dependencyFailure: 1,
    other: 0,
  });
  assert.equal(
    Object.values(outcomes)
      .slice(1)
      .reduce((a, b) => a + b, 0),
    5,
  );
});

test("duplicate protected executions are a hard failure", () => {
  assert.equal(assertZeroDuplicateExecutions(["a", "b", "c"]), 3);
  assert.throws(
    () => assertZeroDuplicateExecutions(["a", "b", "a"]),
    /DUPLICATE_PROTECTED_EXECUTION/,
  );
});

test("benchmark evidence satisfies the versioned schema", () => {
  const run = {
    schemaVersion: 1,
    runId: "3f1d977f-6027-4be1-806b-b6233844c804",
    sourceCommit: "a".repeat(40),
    startedAt: "2026-08-10T00:00:00.000Z",
    durationMs: 25,
    environment: {
      runtime: "node",
      platform: "linux",
      architecture: "x64",
      mode: "local",
    },
    workload: {
      scenario: "paid-retry",
      concurrency: 25,
      requests: 100,
      timeoutMs: 5_000,
    },
    latency: {
      local: { p50Ms: 1, p95Ms: 2, p99Ms: 3 },
      external: { p50Ms: 10, p95Ms: 20, p99Ms: 30 },
    },
    outcomes: { total: 100, success: 100, paymentRequired: 0, rateLimited: 0 },
    protectedExecutions: 100,
    duplicateExecutions: 0,
    limitations: ["devnet is not an SLA"],
    artifacts: ["artifacts/benchmarks/run.json"],
  };
  assert.deepEqual(benchmarkRunSchema.parse(run), run);
  assert.throws(() =>
    benchmarkRunSchema.parse({ ...run, duplicateExecutions: 1 }),
  );
});

test("resilience fixtures fail closed with zero duplicate execution", async () => {
  for (const name of [
    "rpc-outage",
    "facilitator-outage",
    "persistence-outage",
    "rate-limit",
  ]) {
    const fixture = JSON.parse(
      await readFile(
        new URL(`./fixtures/resilience/${name}.json`, import.meta.url),
        "utf8",
      ),
    );
    assert.equal(fixture.schemaVersion, 1);
    assert.equal(fixture.expected.duplicateProtectedExecutions, 0);
    assert.ok(fixture.sequence.length >= 2);
  }
});
