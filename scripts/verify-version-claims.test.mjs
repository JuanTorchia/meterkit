import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { verifyVersionClaims } from "./verify-version-claims.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/** Builds a minimal tree with the same shape the real check reads. */
async function fixture({ packageVersion, note, snippet, range }) {
  const base = await mkdtemp(join(tmpdir(), "meterkit-claims-"));
  for (const name of ["core", "database", "sdk", "cli", "create-meterkit"]) {
    await mkdir(join(base, "packages", name), { recursive: true });
    await writeFile(
      join(base, "packages", name, "package.json"),
      JSON.stringify({ name, version: packageVersion }),
    );
  }
  await mkdir(join(base, "apps", "web", "app"), { recursive: true });
  await writeFile(
    join(base, "apps/web/app/page.tsx"),
    `const copy = { en: { releaseNote: "${note}" } };\n`,
  );
  await mkdir(join(base, "content", "docs", "en"), { recursive: true });
  await mkdir(join(base, "docs"), { recursive: true });
  await writeFile(
    join(base, "docs/beta-results.md"),
    "External independent evidence\nSynthetic verification\nunknown (0 eligible)\nAutomated checks are not users, integrations, customers.\n",
  );
  await writeFile(
    join(base, "content/docs/en/index.mdx"),
    `---\nproductVersionRange: "${range}"\n---\n\n\`\`\`bash\npnpm add ${snippet}\n\`\`\`\n`,
  );
  return base;
}

test("the real repository states its published version truthfully", async () => {
  const result = await verifyVersionClaims(root);
  assert.deepEqual(result.failures, []);
  assert.equal(result.passed, true);
});

test("a stale landing claim and a stale pinned install both fail", async () => {
  const base = await fixture({
    packageVersion: "0.2.0",
    note: "core and sdk are published at 0.1.0.",
    snippet: "@usemeterkit/sdk@0.1.0 express",
    range: ">=0.1.0 <0.2.0",
  });
  try {
    const result = await verifyVersionClaims(base);
    assert.equal(result.passed, false);
    assert.equal(result.failures.length, 3);
    assert.match(result.failures.join("\n"), /releaseNote does not state/);
    assert.match(result.failures.join("\n"), /pins @0\.1\.0/);
    assert.match(result.failures.join("\n"), /excludes the published 0\.2\.0/);
  } finally {
    await rm(base, { recursive: true, force: true });
  }
});

test("truthful claims pass", async () => {
  const base = await fixture({
    packageVersion: "0.2.0",
    note: "core, sdk and create-meterkit are published at 0.2.0.",
    snippet: "@usemeterkit/sdk@0.2.0 express",
    range: ">=0.2.0 <0.3.0",
  });
  try {
    const result = await verifyVersionClaims(base);
    assert.deepEqual(result.failures, []);
    assert.equal(result.published, "0.2.0");
  } finally {
    await rm(base, { recursive: true, force: true });
  }
});

test("public release packages drifting apart is reported before anything else", async () => {
  const base = await fixture({
    packageVersion: "0.2.0",
    note: "published at 0.2.0.",
    snippet: "@usemeterkit/sdk@0.2.0 express",
    range: ">=0.2.0 <0.3.0",
  });
  try {
    await writeFile(
      join(base, "packages/sdk/package.json"),
      JSON.stringify({ name: "sdk", version: "0.3.0" }),
    );
    const result = await verifyVersionClaims(base);
    assert.equal(result.passed, false);
    assert.match(result.failures[0], /disagree on a version/);
  } finally {
    await rm(base, { recursive: true, force: true });
  }
});
