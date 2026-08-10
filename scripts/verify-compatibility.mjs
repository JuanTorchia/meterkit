#!/usr/bin/env node
import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import process from "node:process";

const root = resolve(import.meta.dirname, "..");
const read = (path) => JSON.parse(readFileSync(join(root, path), "utf8"));
const sdk = read("packages/sdk/package.json");
const manifests = [
  sdk,
  read("examples/client/package.json"),
  read("examples/next-route-quickstart/package.json"),
  read("examples/hono-quickstart/package.json"),
  read("examples/mcp-scout/package.json"),
];
const x402Versions = new Map();
for (const manifest of manifests) {
  for (const [name, version] of Object.entries(manifest.dependencies ?? {})) {
    if (name.startsWith("@x402/"))
      x402Versions.set(`${manifest.name}:${name}`, version);
  }
}
const distinctVersions = new Set(x402Versions.values());
if (distinctVersions.size !== 1)
  throw new Error(
    `X402_VERSION_DRIFT: ${JSON.stringify(Object.fromEntries(x402Versions))}`,
  );
const version = [...distinctVersions][0];
const fixtureRoot = join(root, "scripts/fixtures/compatibility");
const fixtures = readdirSync(fixtureRoot)
  .filter((name) => name.endsWith(".json"))
  .sort()
  .map((name) => read(`scripts/fixtures/compatibility/${name}`));
for (const fixture of fixtures) {
  if (fixture.candidateVersion !== version)
    throw new Error(`X402_FIXTURE_VERSION_DRIFT: ${fixture.surface}`);
  if (
    !Array.isArray(fixture.acceptance) ||
    fixture.acceptance.join(",") !== "challenge,settlement,receipt,replay"
  )
    throw new Error(`X402_FIXTURE_INCOMPLETE: ${fixture.surface}`);
}
const report = {
  schemaVersion: 1,
  kind: "meterkit-compatibility",
  generatedAt: new Date().toISOString(),
  meterkit: sdk.version,
  node: process.versions.node,
  network: "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1",
  x402Version: version,
  packages: Object.fromEntries(x402Versions),
  surfaces: fixtures.map(({ surface, adapter, acceptance }) => ({
    surface,
    adapter,
    acceptance,
  })),
};
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
