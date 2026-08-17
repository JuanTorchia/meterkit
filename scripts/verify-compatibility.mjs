#!/usr/bin/env node
import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import process from "node:process";
import { compareMaintainedTemplate } from "./dependency-risk/drift.mjs";

const root = resolve(import.meta.dirname, "..");
const read = (path) => JSON.parse(readFileSync(join(root, path), "utf8"));
const sdk = read("packages/sdk/package.json");
const manifests = [
  sdk,
  read("examples/client/package.json"),
  read("examples/next-route-quickstart/package.json"),
  read("examples/hono-quickstart/package.json"),
  read("examples/mcp-scout/package.json"),
  read("packages/create-meterkit/templates/next-route/package.json"),
  read("packages/create-meterkit/templates/hono/package.json"),
  read("packages/create-meterkit/templates/mcp/package.json"),
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

for (const [examplePath, templatePath, dependencyNames] of [
  [
    "examples/next-route-quickstart/package.json",
    "packages/create-meterkit/templates/next-route/package.json",
    ["@x402/next", "next", "react", "react-dom"],
  ],
  [
    "examples/hono-quickstart/package.json",
    "packages/create-meterkit/templates/hono/package.json",
    ["@x402/hono"],
  ],
  [
    "examples/mcp-scout/package.json",
    "packages/create-meterkit/templates/mcp/package.json",
    ["@x402/core", "@x402/mcp", "@x402/svm"],
  ],
]) {
  const drift = compareMaintainedTemplate(
    read(examplePath),
    read(templatePath),
    dependencyNames,
  );
  if (!drift.passed)
    throw new Error(
      `TEMPLATE_DEPENDENCY_DRIFT: ${templatePath} ${JSON.stringify(drift)}`,
    );
}

// docs/dependencies.md fixes two Solana runtimes on purpose: the x402 surfaces
// stay on Kit 5 because that is the verified SPL cohort behind x402 2.22,
// and the Subscriptions surfaces run Kit 6 because @solana/subscriptions 0.4
// requires it as a peer. Collapsing them into one version would fake a
// compatibility that upstream does not offer, so this guard keeps each cohort
// exact rather than unifying them. It exists because that policy lived only in
// prose, where nothing could enforce it.
const cohortContract = read("dependency-cohorts.json");
if (
  cohortContract.schemaVersion !== 1 ||
  !Array.isArray(cohortContract.cohorts) ||
  !Array.isArray(cohortContract.artifactRules)
) {
  throw new Error("DEPENDENCY_COHORT_CONTRACT_INVALID");
}
const solanaCohorts = cohortContract.cohorts.map((cohort) => {
  const kit = cohort.constraints?.["@solana/kit"];
  if (
    typeof cohort.id !== "string" ||
    typeof kit !== "string" ||
    !Array.isArray(cohort.manifests) ||
    !Array.isArray(cohort.requiredChecks)
  ) {
    throw new Error(`DEPENDENCY_COHORT_INVALID: ${String(cohort.id)}`);
  }
  return { ...cohort, name: cohort.id, kit };
});
for (const rule of cohortContract.artifactRules) {
  if (typeof rule.prefix !== "string" || typeof rule.kind !== "string") {
    throw new Error("DEPENDENCY_ARTIFACT_RULE_INVALID");
  }
}

const walkManifests = (directory) => {
  const found = [];
  for (const entry of readdirSync(join(root, directory), {
    withFileTypes: true,
  })) {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
    const relative = directory ? `${directory}/${entry.name}` : entry.name;
    if (entry.isDirectory()) found.push(...walkManifests(relative));
    else if (entry.name === "package.json") found.push(relative);
  }
  return found;
};

const cohortOf = new Map();
for (const cohort of solanaCohorts)
  for (const path of cohort.manifests) cohortOf.set(path, cohort);

const solanaPins = {};
for (const path of walkManifests("")) {
  const manifest = read(path);
  const dependencies = {
    ...(manifest.dependencies ?? {}),
    ...(manifest.devDependencies ?? {}),
  };
  const solana = Object.entries(dependencies).filter(([name]) =>
    name.startsWith("@solana/"),
  );
  if (solana.length === 0) continue;
  for (const [name, declared] of solana)
    if (/[\^~><*|]|\bx\b/.test(declared))
      throw new Error(`SOLANA_RANGE_NOT_PINNED: ${path} ${name}@${declared}`);
  const kit = dependencies["@solana/kit"];
  if (!kit) continue;
  const cohort = cohortOf.get(path);
  // A new package that pulls in Kit must be assigned a cohort deliberately,
  // never inherit one by accident.
  if (!cohort) throw new Error(`SOLANA_MANIFEST_UNGUARDED: ${path}`);
  if (kit !== cohort.kit)
    throw new Error(
      `SOLANA_KIT_DRIFT: ${path} declares @solana/kit@${kit}, cohort ${cohort.name} is pinned to ${cohort.kit}`,
    );
  if (
    dependencies["@solana/subscriptions"] &&
    !cohort.constraints?.["@solana/subscriptions"]
  )
    throw new Error(
      `SOLANA_SUBSCRIPTIONS_COHORT: ${path} declares @solana/subscriptions outside the Kit 6 cohort`,
    );
  solanaPins[path] = { cohort: cohort.name, kit };
}
for (const cohort of solanaCohorts)
  for (const path of cohort.manifests)
    if (!solanaPins[path])
      throw new Error(`SOLANA_COHORT_MANIFEST_MISSING: ${path}`);

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
  solana: solanaPins,
  dependencyCohorts: solanaCohorts.map(
    ({ id, purpose, constraints, manifests, requiredChecks }) => ({
      id,
      purpose,
      constraints,
      manifests,
      requiredChecks,
    }),
  ),
  artifactRules: cohortContract.artifactRules,
  surfaces: fixtures.map(({ surface, adapter, acceptance }) => ({
    surface,
    adapter,
    acceptance,
  })),
};
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
