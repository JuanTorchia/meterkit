import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { buildPackageArtifact } from "./generate-release-manifest.mjs";
import {
  PUBLIC_RELEASE_PACKAGE_PATHS,
  verifyReleaseManifest,
  verifyReleaseVersion,
} from "./verify-release-version.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

test("public release allowlist is deliberately small and version aligned", async () => {
  assert.deepEqual(PUBLIC_RELEASE_PACKAGE_PATHS, [
    "packages/core/package.json",
    "packages/sdk/package.json",
    "packages/create-meterkit/package.json",
  ]);
  const result = await verifyReleaseVersion("v0.2.0", root);
  assert.deepEqual(
    result.packages.map(({ name }) => name),
    ["@usemeterkit/core", "@usemeterkit/sdk", "create-meterkit"],
  );
});

test("rejects invalid tags and version drift", async () => {
  await assert.rejects(verifyReleaseVersion("latest", root), /vMAJOR/);
  const temporary = await mkdtemp(join(tmpdir(), "meterkit-release-"));
  for (const path of PUBLIC_RELEASE_PACKAGE_PATHS) {
    await cp(join(root, path), join(temporary, path), { recursive: true });
  }
  const sdkPath = join(temporary, "packages/sdk/package.json");
  const sdk = JSON.parse(await readFile(sdkPath, "utf8"));
  sdk.version = "9.9.9";
  await writeFile(sdkPath, JSON.stringify(sdk));
  await assert.rejects(
    verifyReleaseVersion("v0.2.0", temporary),
    /expected 0.2.0/,
  );
});

test("historical registry fixture preserves integrity without inventing provenance", async () => {
  const fixture = JSON.parse(
    await readFile(join(root, "scripts/fixtures/releases/0.1.0.json"), "utf8"),
  );
  assert.equal(fixture.packages.length, 2);
  for (const artifact of fixture.packages) {
    assert.match(artifact.integrity, /^sha512-/);
    assert.equal(artifact.provenance, "unavailable");
  }
});

test("packed artifacts expose integrity and intended runtime files", async () => {
  const packDirectory = await mkdtemp(join(tmpdir(), "meterkit-artifact-"));
  try {
    const artifact = await buildPackageArtifact({
      root,
      manifestPath: "packages/core/package.json",
      packDirectory,
    });
    assert.equal(artifact.name, "@usemeterkit/core");
    assert.match(artifact.integrity, /^sha512-/);
    assert.ok(artifact.tarballSize > 0);
    assert.ok(artifact.runtimeFiles.includes("dist/index.js"));
  } finally {
    await rm(packDirectory, { recursive: true, force: true });
  }
});

test("release manifests bind the allowlist to the exact source commit", async () => {
  const sourceCommit = execFileSync("git", ["rev-parse", "HEAD"], {
    cwd: root,
    encoding: "utf8",
  }).trim();
  const packages = [
    { name: "@usemeterkit/core" },
    { name: "@usemeterkit/sdk" },
    { name: "create-meterkit" },
  ];
  assert.equal(
    await verifyReleaseManifest(
      { tag: "v0.2.0", version: "0.2.0", sourceCommit, packages },
      root,
    ),
    true,
  );
  await assert.rejects(
    verifyReleaseManifest(
      {
        tag: "v0.2.0",
        version: "0.2.0",
        sourceCommit: "0".repeat(40),
        packages,
      },
      root,
    ),
    /source commit/,
  );
});
