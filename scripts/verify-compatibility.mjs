#!/usr/bin/env node
import { readFileSync } from "node:fs";
import process from "node:process";
import { URL } from "node:url";

const sdk = JSON.parse(readFileSync(new URL("../packages/sdk/package.json", import.meta.url), "utf8"));
const report = {
  schemaVersion: 1,
  kind: "meterkit-compatibility",
  generatedAt: new Date().toISOString(),
  meterkit: sdk.version,
  node: process.versions.node,
  network: "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1",
  packages: {
    x402Core: sdk.dependencies["@x402/core"],
    x402Express: sdk.dependencies["@x402/express"],
    x402Svm: sdk.dependencies["@x402/svm"],
    solanaKit: sdk.dependencies["@solana/kit"],
    express: sdk.peerDependencies.express,
  },
  surfaces: ["express", "next-route-example", "mcp-example"],
};
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
