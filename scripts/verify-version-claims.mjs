// Verifies that what the site and documentation CLAIM about the published
// version matches what the workspace actually publishes.
//
// verify-docs-parity checks that locales agree with each other; it cannot tell
// whether either is true. The landing page and quickstart sat on 0.1.0 for a
// full release cycle after 0.2.0 shipped, telling providers to install a stale
// pinned version, and every existing gate stayed green.
import { readFile } from "node:fs/promises";
import { readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import process from "node:process";
import { PUBLIC_RELEASE_PACKAGE_PATHS } from "./verify-release-version.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function parseVersion(value) {
  const parts = value.split(".").map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN))
    throw new Error(`Unparseable version: ${value}`);
  return parts;
}

function compare(left, right) {
  for (let index = 0; index < 3; index += 1) {
    if (left[index] !== right[index]) return left[index] - right[index];
  }
  return 0;
}

/** Accepts the `>=A <B` form the documentation frontmatter uses. */
function rangeCovers(range, version) {
  const match = range.match(/^>=(\d+\.\d+\.\d+)\s+<(\d+\.\d+\.\d+)$/);
  if (!match) throw new Error(`Unsupported productVersionRange: ${range}`);
  const target = parseVersion(version);
  return (
    compare(target, parseVersion(match[1])) >= 0 &&
    compare(target, parseVersion(match[2])) < 0
  );
}

async function collectSources(directory) {
  const found = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) found.push(...(await collectSources(path)));
    else if (/\.(tsx|ts)$/.test(entry.name) && !entry.name.includes(".test."))
      found.push(path);
  }
  return found;
}

async function collectDocs(directory) {
  const found = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) found.push(...(await collectDocs(path)));
    else if (entry.name.endsWith(".mdx")) found.push(path);
  }
  return found;
}

export async function verifyVersionClaims(base = root) {
  const failures = [];

  const versions = new Map();
  for (const path of PUBLIC_RELEASE_PACKAGE_PATHS) {
    const manifest = JSON.parse(await readFile(resolve(base, path), "utf8"));
    versions.set(manifest.name, manifest.version);
  }
  const distinct = new Set(versions.values());
  if (distinct.size !== 1) {
    failures.push(
      `Public release packages disagree on a version: ${[...versions]
        .map(([name, version]) => `${name}@${version}`)
        .join(", ")}`,
    );
    return { passed: false, failures };
  }
  const published = [...distinct][0];
  const betaResults = await readFile(
    resolve(base, "docs/beta-results.md"),
    "utf8",
  );
  for (const required of [
    "External independent evidence",
    "Synthetic verification",
    "unknown (0 eligible)",
    "not users, integrations, customers",
  ]) {
    if (!betaResults.includes(required))
      failures.push(
        `docs/beta-results.md is missing truthful marker: ${required}`,
      );
  }

  const landing = await readFile(
    resolve(base, "apps/web/app/page.tsx"),
    "utf8",
  );
  const notes = [...landing.matchAll(/releaseNote:\s*\n?\s*"([^"]+)"/g)].map(
    (match) => match[1],
  );
  if (notes.length === 0)
    failures.push("No releaseNote strings found in apps/web/app/page.tsx");
  for (const note of notes) {
    if (!note.includes(published))
      failures.push(
        `Landing releaseNote does not state the published version ${published}: "${note.slice(0, 70)}…"`,
      );
  }

  // The first version of this check only scanned content/docs and missed a
  // stale `@usemeterkit/sdk@0.1.0` install line living in the pilots page, so
  // it scans the web app's own sources for pins too.
  const sources = [
    ...(await collectDocs(resolve(base, "content/docs"))),
    ...(await collectSources(resolve(base, "apps/web/app"))),
  ];
  for (const path of sources) {
    const body = await readFile(path, "utf8");
    const relative = path.slice(base.length + 1);

    const range = body.match(/^productVersionRange:\s*"([^"]+)"/m);
    if (range && !rangeCovers(range[1], published))
      failures.push(
        `${relative}: productVersionRange ${range[1]} excludes the published ${published}`,
      );

    for (const [, pinned] of body.matchAll(
      /@usemeterkit\/[a-z-]+@(\d+\.\d+\.\d+)/g,
    )) {
      if (pinned !== published)
        failures.push(
          `${relative}: install snippet pins @${pinned}, published is ${published}`,
        );
    }
  }

  return { passed: failures.length === 0, failures, published };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = await verifyVersionClaims();
  if (!result.passed) {
    for (const failure of result.failures)
      process.stderr.write(`- ${failure}\n`);
    process.exitCode = 1;
  }
  process.stdout.write(
    `${JSON.stringify({
      passed: result.passed,
      published: result.published,
      failures: result.failures.length,
    })}\n`,
  );
}
