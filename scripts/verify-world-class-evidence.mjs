import { createHash, randomUUID } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import process from "node:process";
import { fileURLToPath, URL } from "node:url";

export function sanitizeHealthTarget(raw) {
  const target = new URL(raw);
  target.username = "";
  target.password = "";
  target.search = "";
  target.hash = "";
  return target.toString();
}

export function buildSpdx({ sourceCommit, generatedAt, projects }) {
  const packages = [...projects]
    .sort((left, right) =>
      `${left.name}@${left.version}`.localeCompare(
        `${right.name}@${right.version}`,
      ),
    )
    .map((project) => ({
      SPDXID: `SPDXRef-Package-${createHash("sha256")
        .update(`${project.name}@${project.version}:${project.path}`)
        .digest("hex")
        .slice(0, 16)}`,
      name: project.name,
      versionInfo: project.version,
      downloadLocation: "NOASSERTION",
      filesAnalyzed: false,
      licenseConcluded: "NOASSERTION",
      licenseDeclared: "NOASSERTION",
      supplier: "NOASSERTION",
    }));
  return {
    spdxVersion: "SPDX-2.3",
    dataLicense: "CC0-1.0",
    SPDXID: "SPDXRef-DOCUMENT",
    name: `meterkit-source-${sourceCommit}`,
    documentNamespace: `https://usemeterkit.dev/spdx/${sourceCommit}/${randomUUID()}`,
    creationInfo: {
      created: generatedAt,
      creators: ["Tool: MeterKit evidence runner"],
    },
    packages,
    relationships: packages.map((item) => ({
      spdxElementId: "SPDXRef-DOCUMENT",
      relationshipType: "DESCRIBES",
      relatedSpdxElement: item.SPDXID,
    })),
  };
}

export async function generateWorldClassEvidence(options = {}) {
  const root = resolve(options.root ?? process.cwd());
  const outputDirectory = resolve(root, "artifacts/world-class-evidence");
  await mkdir(outputDirectory, { recursive: true });
  const sourceCommit = git(root, ["rev-parse", "HEAD"]);
  const dirty = git(root, ["status", "--porcelain"]).length > 0;
  const checks = [];
  for (const [name, args] of [
    ["compatibility", ["compatibility:verify"]],
    ["benchmark", ["benchmark"]],
  ]) {
    const result = spawnSync("pnpm", args, { cwd: root, encoding: "utf8" });
    checks.push({
      name,
      passed: result.status === 0,
      exitCode: result.status ?? 1,
    });
    if (result.status !== 0) throw new Error(`EVIDENCE_CHECK_FAILED:${name}`);
    if (name === "compatibility") {
      await writeFile(
        resolve(outputDirectory, "compatibility.json"),
        result.stdout,
      );
    }
  }
  const inventory = JSON.parse(
    execFileSync("pnpm", ["list", "-r", "--depth", "-1", "--json"], {
      cwd: root,
      encoding: "utf8",
    }),
  );
  const projects = inventory.map((item) => ({
    name: item.name ?? "unnamed-workspace",
    version: item.version ?? "0.0.0-private",
    path: item.path ? item.path.replace(`${root}/`, "") : ".",
  }));
  const generatedAt = new Date().toISOString();
  const sbomPath = resolve(outputDirectory, "source.spdx.json");
  await writeFile(
    sbomPath,
    `${JSON.stringify(buildSpdx({ sourceCommit, generatedAt, projects }), null, 2)}\n`,
  );
  const health = await healthEvidence(process.env.WORLD_CLASS_HEALTH_URL);
  const visual = await visualEvidence(
    process.env.WORLD_CLASS_VISUAL_URL,
    outputDirectory,
  );
  const releaseManifest = await releaseManifestEvidence(
    root,
    process.env.RELEASE_TAG ?? process.env.WORLD_CLASS_RELEASE_TAG,
  );
  const rollbackDocumented = await readFile(
    resolve(root, "docs/deployment-devnet.md"),
    "utf8",
  ).then(
    (text) => /rollback/i.test(text),
    () => false,
  );
  const report = {
    schemaVersion: 1,
    generatedAt,
    factualScope:
      "internal reproducible evidence; not an SLA, pilot, customer or revenue claim",
    sourceCommit,
    workingTree: dirty ? "dirty" : "clean",
    network: "solana-devnet",
    checks,
    compatibility: "artifacts/world-class-evidence/compatibility.json",
    benchmarkDirectory: "artifacts/benchmarks",
    sbom: "artifacts/world-class-evidence/source.spdx.json",
    releaseManifest,
    health,
    visual,
    rollbackDocumented,
    signedEvidence: {
      initializer: "artifacts/world-class-evidence/generated-devnet.json",
      agentBudget: "artifacts/world-class-evidence/agent-budget-devnet.json",
      note: "Exact Explorer URLs stay in ignored mode-0600 artifacts.",
    },
  };
  const reportPath = resolve(outputDirectory, "report.json");
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  return report;
}

async function visualEvidence(raw, outputDirectory) {
  if (!raw) {
    return {
      status: "not-run",
      reason: "WORLD_CLASS_VISUAL_URL not configured",
    };
  }
  const target = sanitizeHealthTarget(raw);
  await mkdir(resolve(outputDirectory, "visual"), { recursive: true });
  const { chromium } = await import("@playwright/test");
  const browser = await chromium.launch({ headless: true });
  const errors = [];
  const results = [];
  try {
    for (const viewport of [
      { name: "desktop", width: 1440, height: 1000 },
      { name: "mobile", width: 390, height: 844 },
    ]) {
      const page = await browser.newPage({
        viewport,
        reducedMotion: "reduce",
      });
      page.on("pageerror", (error) => errors.push(error.name));
      page.on("console", (message) => {
        if (message.type() === "error") errors.push("console-error");
      });
      const response = await page.goto(raw, { waitUntil: "networkidle" });
      await page.keyboard.press("Tab");
      const checks = await page.evaluate(() => ({
        hasContent:
          (globalThis.document.body.textContent?.trim().length ?? 0) > 0,
        h1Count: globalThis.document.querySelectorAll("h1").length,
        horizontalOverflow:
          globalThis.document.documentElement.scrollWidth >
          globalThis.document.documentElement.clientWidth,
        keyboardTarget: globalThis.document.activeElement?.tagName ?? null,
        reducedMotion: globalThis.matchMedia("(prefers-reduced-motion: reduce)")
          .matches,
      }));
      await page.screenshot({
        path: resolve(outputDirectory, "visual", `${viewport.name}.png`),
        fullPage: true,
      });
      results.push({
        viewport: viewport.name,
        httpStatus: response?.status() ?? null,
        ...checks,
      });
      await page.close();
    }
  } finally {
    await browser.close();
  }
  const passed =
    results.every(
      (result) =>
        result.httpStatus === 200 &&
        result.hasContent &&
        result.h1Count === 1 &&
        !result.horizontalOverflow &&
        result.keyboardTarget !== "BODY" &&
        result.reducedMotion,
    ) && errors.length === 0;
  return {
    status: passed ? "passed" : "failed",
    target,
    results,
    pageErrorKinds: [...new Set(errors)],
    accessibilityNote:
      "Keyboard, heading, overflow, reduced-motion and runtime errors checked here; axe WCAG A/AA remains an E2E/manual release check.",
  };
}

async function healthEvidence(raw) {
  if (!raw)
    return {
      status: "not-run",
      reason: "WORLD_CLASS_HEALTH_URL not configured",
    };
  const target = sanitizeHealthTarget(raw);
  try {
    const response = await globalThis.fetch(raw, {
      signal: globalThis.AbortSignal.timeout(5_000),
    });
    return {
      status: response.ok ? "healthy" : "unhealthy",
      httpStatus: response.status,
      target,
    };
  } catch {
    return { status: "unavailable", target };
  }
}

async function releaseManifestEvidence(root, tag) {
  if (!tag) {
    return {
      status: "not-run",
      reason:
        "A release tag and owner approval are required for a release manifest.",
    };
  }
  if (!/^v\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(tag)) {
    throw new Error("RELEASE_TAG_INVALID");
  }
  const path = resolve(root, `artifacts/releases/${tag.slice(1)}.json`);
  await access(path);
  const manifest = JSON.parse(await readFile(path, "utf8"));
  if (manifest.sourceCommit !== git(root, ["rev-parse", "HEAD"])) {
    throw new Error("RELEASE_MANIFEST_COMMIT_MISMATCH");
  }
  return {
    status: "generated",
    path: `artifacts/releases/${tag.slice(1)}.json`,
  };
}

function git(root, args) {
  return execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const report = await generateWorldClassEvidence();
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}
