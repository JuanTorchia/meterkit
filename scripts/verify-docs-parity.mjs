#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import {
  compareDocumentationClaims,
  documentationPageSchema,
} from "../packages/core/dist/index.js";

async function files(directory) {
  const found = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) found.push(...(await files(path)));
    else if (entry.isFile() && entry.name.endsWith(".mdx")) found.push(path);
  }
  return found.sort();
}

function frontmatter(source) {
  const match = source.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) throw new Error("DOC_FRONTMATTER_MISSING");
  const metadata = {};
  const lines = match[1].split("\n");
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const separator = line.indexOf(":");
    if (separator < 1) throw new Error("DOC_FRONTMATTER_INVALID");
    const key = line.slice(0, separator).trim();
    let raw = line.slice(separator + 1).trim();
    if (!raw && lines[index + 1]?.trim().startsWith("[")) {
      raw = lines[++index].trim();
    }
    if (raw.startsWith("[") && !raw.endsWith("]")) {
      while (index + 1 < lines.length && !raw.endsWith("]")) {
        raw += lines[++index].trim();
      }
      if (!raw.endsWith("]")) throw new Error("DOC_FRONTMATTER_INVALID");
    }
    if (raw.startsWith("["))
      metadata[key] = JSON.parse(raw.replace(/,\s*]$/, "]"));
    else if (/^\d+$/.test(raw)) metadata[key] = Number(raw);
    else metadata[key] = raw.replace(/^['"]|['"]$/g, "");
  }
  return { metadata, body: source.slice(match[0].length) };
}

export async function verifyDocumentation(contentRoot) {
  const byLocale = new Map();
  for (const locale of ["en", "es"]) {
    const localeRoot = join(contentRoot, locale);
    const pages = new Map();
    for (const path of await files(localeRoot)) {
      const source = await readFile(path, "utf8");
      const parsed = frontmatter(source);
      const relativePath = relative(localeRoot, path).replaceAll("\\", "/");
      const slug = relativePath.replace(/\.mdx$/, "");
      const page = documentationPageSchema.parse({
        ...parsed.metadata,
        locale,
        slug,
        contentFingerprint: `sha256:${createHash("sha256").update(parsed.body).digest("hex")}`,
      });
      for (const link of parsed.body.matchAll(/\]\((?!https?:|#)([^)]+)\)/g)) {
        const target = resolve(join(path, ".."), link[1].split("#")[0]);
        const candidates = [target, `${target}.mdx`, join(target, "index.mdx")];
        let exists = false;
        for (const candidate of candidates) {
          try {
            await readFile(candidate);
            exists = true;
            break;
          } catch {
            // Try the next supported documentation target form.
          }
        }
        if (!exists)
          throw new Error(`DOC_LINK_BROKEN: ${relativePath} -> ${link[1]}`);
      }
      pages.set(slug, page);
    }
    byLocale.set(locale, pages);
  }
  const english = byLocale.get("en");
  const spanish = byLocale.get("es");
  if (english.size === 0 || english.size !== spanish.size)
    throw new Error("DOC_LOCALE_PAGE_MISMATCH");
  for (const [slug, englishPage] of english) {
    const spanishPage = spanish.get(slug);
    if (!spanishPage) throw new Error(`DOC_TRANSLATION_MISSING: ${slug}`);
    const comparison = compareDocumentationClaims(englishPage, spanishPage);
    if (!comparison.equivalent) throw new Error(`DOC_CLAIM_MISMATCH: ${slug}`);
    if (englishPage.productVersionRange !== spanishPage.productVersionRange)
      throw new Error(`DOC_VERSION_MISMATCH: ${slug}`);
  }
  return {
    passed: true,
    locales: 2,
    pagesPerLocale: english.size,
    claims: [...english.values()].reduce(
      (sum, page) => sum + page.claimKeys.length,
      0,
    ),
  };
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const report = await verifyDocumentation(resolve("content/docs"));
  process.stdout.write(`${JSON.stringify(report)}\n`);
}
