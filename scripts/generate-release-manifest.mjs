#!/usr/bin/env node
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { sha256 } from "./dependency-risk/model.mjs";
import { publicReleaseSchema } from "../packages/core/dist/index.js";
import {
  PUBLIC_RELEASE_PACKAGE_PATHS,
  verifyReleaseVersion,
} from "./verify-release-version.mjs";

function command(commandName, args, cwd) {
  return execFileSync(commandName, args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function parsePackOutput(output) {
  const start = output.indexOf("{");
  if (start < 0) throw new Error("PACK_OUTPUT_INVALID");
  return JSON.parse(output.slice(start));
}

export async function buildPackageArtifact({
  root,
  manifestPath,
  packDirectory,
}) {
  const manifest = JSON.parse(await readFile(join(root, manifestPath), "utf8"));
  const output = command(
    "pnpm",
    [
      "--filter",
      manifest.name,
      "pack",
      "--json",
      "--pack-destination",
      packDirectory,
    ],
    root,
  );
  const packed = parsePackOutput(output);
  const tarball = await readFile(packed.filename);
  const tarballStat = await stat(packed.filename);
  return {
    name: manifest.name,
    version: manifest.version,
    registry: "https://registry.npmjs.org/",
    integrity: `sha512-${createHash("sha512").update(tarball).digest("base64")}`,
    tarballSize: tarballStat.size,
    runtimeFiles: packed.files.map(({ path }) => path).sort(),
    dependencies: manifest.dependencies ?? {},
    peerDependencies: manifest.peerDependencies ?? {},
    engineRange: manifest.engines?.node ?? "unspecified",
    license: manifest.license,
    repository: "https://github.com/JuanTorchia/meterkit",
    sourceDirectory: dirname(manifestPath),
    supportStatus: "primary",
  };
}

export async function generateReleaseManifest({
  root,
  tag,
  outputPath,
  allowDirty = false,
}) {
  const verified = await verifyReleaseVersion(tag, root);
  const sourceCommit = command("git", ["rev-parse", "HEAD"], root);
  const dirty = command(
    "git",
    ["status", "--porcelain", "--untracked-files=no"],
    root,
  );
  if (dirty && !allowDirty) throw new Error("RELEASE_SOURCE_DIRTY");
  const packDirectory = await mkdtemp(
    join(tmpdir(), "meterkit-release-packs-"),
  );
  try {
    const dependencyEvidencePath = process.env.DEPENDENCY_EVIDENCE_PATH;
    if (!dependencyEvidencePath)
      throw new Error("DEPENDENCY_EVIDENCE_REQUIRED");
    const dependencyEvidenceRaw = await readFile(
      resolve(dependencyEvidencePath),
      "utf8",
    );
    const dependencyEvidence = JSON.parse(dependencyEvidenceRaw);
    if (dependencyEvidence.gate !== "passed")
      throw new Error("DEPENDENCY_GATE_NOT_PASSED");
    if (dependencyEvidence.commit !== sourceCommit)
      throw new Error("DEPENDENCY_EVIDENCE_COMMIT_MISMATCH");
    const packages = [];
    for (const manifestPath of PUBLIC_RELEASE_PACKAGE_PATHS) {
      packages.push(
        await buildPackageArtifact({ root, manifestPath, packDirectory }),
      );
    }
    const release = publicReleaseSchema.parse({
      schemaVersion: 1,
      version: verified.version,
      sourceCommit,
      tag,
      packages,
      compatibilityReport: "artifacts/compatibility/report.json",
      sbomReferences: ["artifacts/sbom/source.spdx.json"],
      dependencyEvidence: {
        gate: "passed",
        digest: sha256(dependencyEvidenceRaw),
        environmentId: dependencyEvidence.environmentId,
        generatedAt: dependencyEvidence.generatedAt,
      },
      provenanceStatus: "staged",
      migrationImpact: "compatible",
      rollback:
        "Reject the stage before approval. If already approved, deprecate the affected version and release a reviewed patch from an approved commit.",
    });
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, `${JSON.stringify(release, null, 2)}\n`, {
      flag: "wx",
    });
    return release;
  } finally {
    await rm(packDirectory, { recursive: true, force: true });
  }
}

const isMain =
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const tag = process.argv[2];
  const allowDirty = process.argv.includes("--allow-dirty");
  const version = tag?.startsWith("v") ? tag.slice(1) : "invalid";
  const outputPath = resolve(`artifacts/releases/${version}.json`);
  const release = await generateReleaseManifest({
    root: resolve(import.meta.dirname, ".."),
    tag,
    outputPath,
    allowDirty,
  });
  process.stdout.write(
    `${JSON.stringify({ passed: true, outputPath, version: release.version, sourceCommit: release.sourceCommit })}\n`,
  );
}
