import { readFile } from "node:fs/promises";
import process from "node:process";

const tag = process.argv[2];
if (!/^v\d+\.\d+\.\d+$/.test(tag ?? "")) {
  throw new Error("Release tag must use vMAJOR.MINOR.PATCH");
}

const expected = tag.slice(1);
for (const path of [
  "packages/core/package.json",
  "packages/sdk/package.json",
  "packages/pilot/package.json",
  "packages/policy-webacy/package.json",
]) {
  const manifest = JSON.parse(await readFile(path, "utf8"));
  if (manifest.version !== expected) {
    throw new Error(`${path} is ${manifest.version}; expected ${expected}`);
  }
}

process.stdout.write(`Verified MeterKit package version ${expected}\n`);
