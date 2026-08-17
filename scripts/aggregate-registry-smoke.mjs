#!/usr/bin/env node
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { registrySmokeReportSchema } from "../packages/core/dist/index.js";
import { decideRegistryPromotion } from "./registry-promotion.mjs";

const directory = process.argv[2];
const version = process.env.METERKIT_REGISTRY_VERSION;
if (!directory || !version)
  throw new Error("REGISTRY_AGGREGATE_INPUT_REQUIRED");

const files = (await readdir(directory, { recursive: true })).filter((name) =>
  name.endsWith(".json"),
);
const reports = await Promise.all(
  files.map(async (name) =>
    registrySmokeReportSchema.parse(
      JSON.parse(await readFile(join(directory, name), "utf8")),
    ),
  ),
);
const cells = reports.flatMap(({ cells }) => cells);
const identities = new Set(
  cells.map(({ manager, surface }) => `${manager}/${surface}`),
);
const expected = new Set(
  ["npm", "pnpm"].flatMap((manager) =>
    ["express", "next-route", "hono", "mcp"].map(
      (surface) => `${manager}/${surface}`,
    ),
  ),
);
const complete =
  identities.size === expected.size &&
  [...expected].every((identity) => identities.has(identity));
const decision = decideRegistryPromotion({
  candidateVersion: version,
  previousRecommendedVersion:
    process.env.METERKIT_PREVIOUS_RECOMMENDED_VERSION ?? null,
  cells: complete ? cells : [...cells, { status: "failed" }],
});
process.stdout.write(
  `${JSON.stringify({ schemaVersion: 1, version, complete, cells: cells.length, decision })}\n`,
);
if (decision.state !== "eligible") process.exitCode = 1;
