import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import process from "node:process";

export const PUBLIC_RELEASE_PACKAGE_PATHS = [
  "packages/core/package.json",
  "packages/sdk/package.json",
  "packages/create-meterkit/package.json",
];

export async function verifyReleaseVersion(tag, root = process.cwd()) {
  if (!/^v\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(tag ?? "")) {
    throw new Error("Release tag must use vMAJOR.MINOR.PATCH");
  }
  const expected = tag.slice(1);
  const packages = [];
  const names = new Set();
  for (const path of PUBLIC_RELEASE_PACKAGE_PATHS) {
    const manifest = JSON.parse(await readFile(resolve(root, path), "utf8"));
    if (manifest.version !== expected)
      throw new Error(`${path} is ${manifest.version}; expected ${expected}`);
    if (
      manifest.private === true ||
      manifest.publishConfig?.access !== "public"
    )
      throw new Error(`${path} is not explicitly public`);
    if (names.has(manifest.name))
      throw new Error(`Duplicate release package ${manifest.name}`);
    names.add(manifest.name);
    packages.push({ name: manifest.name, version: manifest.version, path });
  }
  return { version: expected, packages };
}

export async function verifyReleaseManifest(manifest, root = process.cwd()) {
  const release = await verifyReleaseVersion(manifest.tag, root);
  if (manifest.version !== release.version)
    throw new Error("Manifest version does not match its tag");
  const expected = release.packages.map(({ name }) => name);
  const actual = manifest.packages.map(({ name }) => name);
  if (JSON.stringify(actual) !== JSON.stringify(expected))
    throw new Error(
      "Manifest package graph does not match the public allowlist",
    );
  const commit = execFileSync("git", ["rev-parse", "HEAD"], {
    cwd: root,
    encoding: "utf8",
  }).trim();
  if (manifest.sourceCommit !== commit)
    throw new Error("Manifest source commit does not match HEAD");
  return true;
}

const isMain =
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const result = await verifyReleaseVersion(
    process.argv[2],
    resolve(dirname(fileURLToPath(import.meta.url)), ".."),
  );
  process.stdout.write(
    `Verified MeterKit package version ${result.version}: ${result.packages.map(({ name }) => name).join(", ")}\n`,
  );
}
