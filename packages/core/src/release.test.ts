import { describe, expect, it } from "vitest";
import { benchmarkRunSchema, publicReleaseSchema } from "./release.js";

const artifact = {
  name: "@usemeterkit/sdk",
  version: "0.2.0",
  registry: "https://registry.npmjs.org",
  integrity: `sha512-${Buffer.from("integrity").toString("base64")}`,
  tarballSize: 42_000,
  runtimeFiles: ["dist/index.js", "dist/index.d.ts", "README.md"],
  dependencies: { "@usemeterkit/core": "0.2.0" },
  peerDependencies: { express: ">=5" },
  engineRange: ">=22",
  license: "Apache-2.0",
  repository: "https://github.com/JuanTorchia/meterkit",
  sourceDirectory: "packages/sdk",
  provenanceReference:
    "https://registry.npmjs.org/-/npm/v1/attestations/sdk@0.2.0",
  supportStatus: "primary",
} as const;

describe("release and benchmark evidence", () => {
  it("accepts a traceable release and rejects duplicate or unsupported provenance", () => {
    const release = {
      schemaVersion: 1,
      version: "0.2.0",
      sourceCommit: "a".repeat(40),
      tag: "v0.2.0",
      packages: [artifact],
      compatibilityReport: "artifacts/compatibility.json",
      sbomReferences: ["artifacts/meterkit.spdx.json"],
      provenanceStatus: "verified",
      migrationImpact: "compatible",
      publishedAt: "2026-08-10T12:00:00.000Z",
      rollback:
        "Deprecate 0.2.0 and publish a corrected patch from approved source.",
    } as const;
    expect(publicReleaseSchema.parse(release)).toEqual(release);
    expect(() =>
      publicReleaseSchema.parse({
        ...release,
        packages: [artifact, artifact],
      }),
    ).toThrow(/unique/);
    expect(() =>
      publicReleaseSchema.parse({
        ...release,
        packages: [{ ...artifact, provenanceReference: undefined }],
      }),
    ).toThrow(/provenance/);
  });

  it("requires ordered percentiles and zero duplicate execution", () => {
    const run = {
      schemaVersion: 1,
      runId: crypto.randomUUID(),
      sourceCommit: "b".repeat(40),
      startedAt: "2026-08-10T12:00:00.000Z",
      durationMs: 1_000,
      environment: {
        node: "24.18.0",
        cpu: "test",
        memoryMb: 1024,
        os: "linux",
      },
      workload: {
        scenario: "unpaid",
        concurrency: 10,
        requests: 100,
        timeoutMs: 5_000,
      },
      latency: {
        local: { p50Ms: 2, p95Ms: 5, p99Ms: 8 },
        external: { p50Ms: 0, p95Ms: 0, p99Ms: 0 },
      },
      outcomes: { rejected: 100, accepted: 0, unknown: 0, failed: 0 },
      protectedExecutions: 0,
      duplicateExecutions: 0,
      limitations: ["Synthetic local workload"],
      artifacts: [],
    } as const;
    expect(benchmarkRunSchema.parse(run)).toEqual(run);
    expect(() =>
      benchmarkRunSchema.parse({
        ...run,
        latency: { ...run.latency, local: { p50Ms: 8, p95Ms: 5, p99Ms: 2 } },
      }),
    ).toThrow(/monotonically/);
    expect(() =>
      benchmarkRunSchema.parse({ ...run, duplicateExecutions: 1 }),
    ).toThrow();
  });
});
