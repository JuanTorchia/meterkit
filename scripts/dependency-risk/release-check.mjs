#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { sha256 } from "./model.mjs";

const path = process.argv[2];
if (!path) throw new Error("DEPENDENCY_EVIDENCE_REQUIRED");
const record = JSON.parse(await readFile(resolve(path), "utf8"));
const commit = execFileSync("git", ["rev-parse", "HEAD"], {
  encoding: "utf8",
}).trim();
const lockfile = await readFile("pnpm-lock.yaml", "utf8");
if (record.gate !== "passed") throw new Error("DEPENDENCY_GATE_NOT_PASSED");
if (record.commit !== commit)
  throw new Error("DEPENDENCY_EVIDENCE_COMMIT_MISMATCH");
if (record.lockfileDigest !== sha256(lockfile))
  throw new Error("DEPENDENCY_EVIDENCE_LOCKFILE_MISMATCH");
if (
  Object.values(record.outcomes ?? {}).some(
    (outcome) => !["passed", "not_required"].includes(outcome),
  )
)
  throw new Error("DEPENDENCY_EVIDENCE_CHECK_INCOMPLETE");
process.stdout.write(
  `${JSON.stringify({ passed: true, commit, evidence: resolve(path) })}\n`,
);
