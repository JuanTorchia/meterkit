#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { PUBLIC_RELEASE_PACKAGE_PATHS } from "./verify-release-version.mjs";

const failures = [];
const manifests = await Promise.all(
  PUBLIC_RELEASE_PACKAGE_PATHS.map(async (path) => [
    path,
    JSON.parse(await readFile(path, "utf8")),
  ]),
);
const versions = new Set(manifests.map(([, manifest]) => manifest.version));
if (versions.size !== 1)
  failures.push("public package versions are not atomic");
const version = [...versions][0];
const changelog = await readFile("CHANGELOG.md", "utf8");
if (!changelog.includes(`[${version}]`) && !changelog.includes(`## ${version}`))
  failures.push(`CHANGELOG has no ${version} section`);
const initializer = JSON.parse(
  await readFile("packages/create-meterkit/package.json", "utf8"),
);
for (const name of ["@usemeterkit/database", "@usemeterkit/sdk"])
  if (initializer.dependencies?.[name])
    failures.push(
      `${name} must remain a generated dependency, not an initializer runtime dependency`,
    );
for (const surface of ["express", "hono", "next-route", "mcp"]) {
  const manifest = JSON.parse(
    await readFile(
      `packages/create-meterkit/templates/${surface}/package.json`,
      "utf8",
    ),
  );
  for (const name of ["@usemeterkit/database", "@usemeterkit/sdk"])
    if (manifest.dependencies?.[name] !== version)
      failures.push(
        `${surface} pins ${name} ${manifest.dependencies?.[name]} instead of ${version}`,
      );
  if (manifest.devDependencies?.["@usemeterkit/cli"] !== version)
    failures.push(`${surface} does not pin CLI ${version}`);
}
const migration = await readFile(
  "packages/database/migrations/standalone/001_replay_store.sql",
  "utf8",
);
if (!/CREATE TABLE IF NOT EXISTS/.test(migration))
  failures.push("standalone migration is not idempotent");
const publicDocs = `${await readFile("README.md", "utf8")}\n${await readFile("packages/create-meterkit/README.md", "utf8")}`;
for (const command of [
  `npm create meterkit@${version}`,
  "npm run check:unpaid",
])
  if (!publicDocs.includes(command))
    failures.push(`public docs omit ${command}`);
if (!/devnet/i.test(publicDocs) || !/non-durable/i.test(publicDocs))
  failures.push("public docs omit devnet or memory-store boundary");
if (failures.length) {
  for (const failure of failures) process.stderr.write(`- ${failure}\n`);
  process.exitCode = 1;
}
process.stdout.write(
  `${JSON.stringify({ passed: failures.length === 0, version, failures: failures.length })}\n`,
);
