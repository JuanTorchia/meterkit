import assert from "node:assert/strict";
import { cp, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";
import { verifyDocumentation } from "./verify-docs-parity.mjs";

const root = resolve("content/docs");

test("English and Spanish documentation have equivalent versioned claims", async () => {
  const report = await verifyDocumentation(root);
  assert.equal(report.passed, true);
  assert.ok(report.pagesPerLocale >= 6);
  assert.ok(report.claims >= 12);
});

test("claim drift and broken links fail deterministically", async () => {
  const temporary = await mkdtemp(join(tmpdir(), "meterkit-docs-"));
  await cp(root, temporary, { recursive: true });
  const spanish = join(temporary, "es/index.mdx");
  const source = await readFile(spanish, "utf8");
  await writeFile(
    spanish,
    source.replace("direct-settlement", "custodial-settlement"),
  );
  await assert.rejects(verifyDocumentation(temporary), /DOC_CLAIM_MISMATCH/);
  await writeFile(spanish, source.replace("./concepts", "./missing-page"));
  await assert.rejects(verifyDocumentation(temporary), /DOC_LINK_BROKEN/);
});
