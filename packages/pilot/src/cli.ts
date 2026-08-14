#!/usr/bin/env node
import { readFile, unlink, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import process from "node:process";
import {
  activationStageSchema,
  consentScopeSchema,
  participantClassSchema,
  retentionObservationSchema,
  willingnessToPaySchema,
} from "@usemeterkit/core";
import {
  parsePolicy,
  SOLANA_DEVNET_NETWORK,
  SOLANA_DEVNET_USDC_MINT,
  verifyEndpoint,
  type PilotPolicy,
} from "./index.js";
import { validateSettlementEvidence } from "./evidence.js";
import {
  activationReportSchema,
  createActivationExport,
  createDeletionReceipt,
} from "./activation.js";
import {
  addActivationEvent,
  addConsent,
  addIntervention,
  createPilotDeletionReceipt,
  createPilotEngagementExport,
  createPilotEngagementFile,
  observeDaySevenRetention,
  pilotEngagementFileSchema,
  recordWillingnessToPay,
  withdrawConsent,
} from "./activation-v2.js";

const [, , command, ...args] = process.argv;

try {
  if (command === "init") {
    const positional = positionalArgs(args, new Set(["--out"]));
    if (positional.length > 1)
      throw new Error("init accepts at most one endpoint");
    const endpoint = positional[0] ?? "http://localhost:3000/premium";
    const path = option(args, "--out") ?? "meterkit-pilot.json";
    const template = {
      endpoint,
      policy: {
        network: SOLANA_DEVNET_NETWORK,
        mint: SOLANA_DEVNET_USDC_MINT,
        maxAmountAtomic: "10000",
        recipient: "REPLACE_WITH_YOUR_DEVNET_WALLET",
        allowLocalhost:
          endpoint.startsWith("http://localhost:") ||
          endpoint.startsWith("http://127.0.0.1:"),
      },
    };
    await writeFile(path, `${JSON.stringify(template, null, 2)}\n`, {
      flag: "wx",
    });
    process.stdout.write(
      `Created ${path}. Replace the recipient and run: meterkit-pilot verify --config ${path}\n`,
    );
  } else if (command === "verify" || command === "diagnose") {
    const configPath = option(args, "--config");
    const positional = positionalArgs(args, new Set(["--config", "--out"]));
    if (positional.length)
      throw new Error(
        "verify requires --config so every policy value is enforced; run init first",
      );
    let endpoint: string | undefined;
    let policy: PilotPolicy = {};
    if (configPath) {
      const config = JSON.parse(await readFile(configPath, "utf8")) as {
        endpoint?: unknown;
        policy?: unknown;
      };
      if (typeof config.endpoint !== "string")
        throw new Error("config.endpoint must be a URL");
      endpoint = config.endpoint;
      policy = parsePolicy(config.policy ?? {});
    }
    if (!configPath || !endpoint)
      throw new Error("verify requires --config; run init first");
    const report = await verifyEndpoint(endpoint, policy);
    const rendered = `${JSON.stringify(report, null, 2)}\n`;
    const output = option(args, "--out");
    if (output) await writeFile(output, rendered, { flag: "wx" });
    process.stdout.write(rendered);
    if (!report.passed) process.exitCode = 1;
  } else if (command === "evidence") {
    const receiptPath = option(args, "--receipt");
    const output = option(args, "--out");
    const positional = positionalArgs(args, new Set(["--receipt", "--out"]));
    if (positional.length || !receiptPath || !output) {
      throw new Error("evidence requires --receipt <path> and --out <path>");
    }
    const evidence = validateSettlementEvidence(
      JSON.parse(await readFile(receiptPath, "utf8")),
    );
    await writeFile(output, `${JSON.stringify(evidence, null, 2)}\n`, {
      flag: "wx",
    });
    process.stdout.write(
      `Validated settlement evidence and created ${output}\n`,
    );
  } else if (command === "engagement-init") {
    const output = requiredOption(args, "--out");
    const surface = requiredOption(args, "--surface");
    const participantClass = participantClassSchema.parse(
      requiredOption(args, "--participant-class"),
    );
    const assistanceMode = requiredOption(args, "--assistance");
    const price = option(args, "--price") ?? "100";
    const currency = option(args, "--currency") ?? "USD";
    positionalArgs(
      args,
      new Set([
        "--out",
        "--surface",
        "--participant-class",
        "--assistance",
        "--price",
        "--currency",
      ]),
    );
    const file = createPilotEngagementFile({
      participantClass,
      offerVersion: "assisted-pilot-v1",
      disclosedPrice: { amount: price, currency, unit: "integration" },
      surface: surface as "express" | "next-route" | "hono" | "mcp",
      source: "pilot_cli",
      assistanceMode: assistanceMode as
        "none" | "docs_only" | "maintainer_guided",
    });
    await writeExclusive(output, file);
    process.stdout.write(`Created consent-ready pilot engagement ${output}\n`);
  } else if (command === "engagement-stage") {
    const { input, output, file } = await engagementMutation(args, [
      "--stage",
      "--outcome",
      "--evidence",
    ]);
    const stage = activationStageSchema.parse(requiredOption(args, "--stage"));
    const outcome = requiredOption(args, "--outcome") as
      "passed" | "failed" | "unknown";
    const next = addActivationEvent(
      file,
      stage,
      outcome,
      new Date(),
      option(args, "--evidence"),
    );
    await writeExclusive(output, next);
    process.stdout.write(`Recorded ${stage} from ${input} in ${output}\n`);
  } else if (command === "engagement-intervention") {
    const { output, file } = await engagementMutation(args, [
      "--stage",
      "--kind",
      "--reason",
      "--actor",
      "--began-at",
      "--ended-at",
    ]);
    const next = addIntervention(file, {
      stage: activationStageSchema.parse(requiredOption(args, "--stage")),
      kind: requiredOption(args, "--kind"),
      reasonCode: requiredOption(args, "--reason"),
      actorClass: requiredOption(args, "--actor") as
        "maintainer" | "participant" | "third_party",
      beganAt: requiredOption(args, "--began-at"),
      endedAt: requiredOption(args, "--ended-at"),
    });
    await writeExclusive(output, next);
    process.stdout.write(`Recorded support intervention in ${output}\n`);
  } else if (command === "engagement-consent") {
    const { output, file } = await engagementMutation(args, [
      "--scope",
      "--status",
      "--terms",
    ]);
    const scope = consentScopeSchema.parse(requiredOption(args, "--scope"));
    const status = requiredOption(args, "--status");
    const next =
      status === "withdrawn"
        ? withdrawConsent(file, scope)
        : addConsent(
            file,
            scope,
            status === "granted",
            requiredOption(args, "--terms"),
          );
    await writeExclusive(output, next);
    process.stdout.write(`Recorded ${scope} consent state in ${output}\n`);
  } else if (command === "engagement-retention") {
    const { output, file } = await engagementMutation(args, [
      "--observed-at",
      "--outcome",
      "--evidence-type",
    ]);
    const outcome = retentionObservationSchema.shape.outcome.parse(
      requiredOption(args, "--outcome"),
    );
    const evidenceType = option(args, "--evidence-type") as
      "participant_response" | "verifiable_valid_use" | undefined;
    const next = observeDaySevenRetention(file, {
      observedAt: new Date(requiredOption(args, "--observed-at")),
      outcome,
      ...(evidenceType ? { evidenceType } : {}),
    });
    await writeExclusive(output, next);
    process.stdout.write(`Recorded day-seven observation in ${output}\n`);
  } else if (command === "engagement-wtp") {
    const { output, file } = await engagementMutation(args, [
      "--response",
      "--responded-at",
    ]);
    const response = willingnessToPaySchema.shape.response.parse(
      requiredOption(args, "--response"),
    );
    const next = recordWillingnessToPay(file, {
      askedAt: new Date(),
      respondedAt: new Date(requiredOption(args, "--responded-at")),
      response,
    });
    await writeExclusive(output, next);
    process.stdout.write(`Recorded willingness-to-pay response in ${output}\n`);
  } else if (command === "engagement-export") {
    const input = requiredOption(args, "--input");
    const output = requiredOption(args, "--out");
    positionalArgs(args, new Set(["--input", "--out"]));
    const file = await readEngagement(input);
    await writeExclusive(output, createPilotEngagementExport(file));
    process.stdout.write(`Created minimized engagement export ${output}\n`);
  } else if (command === "engagement-delete") {
    const input = requiredOption(args, "--input");
    const receipt = requiredOption(args, "--receipt");
    positionalArgs(args, new Set(["--input", "--receipt"]));
    if (resolve(input) === resolve(receipt))
      throw new Error("engagement input and deletion receipt must differ");
    const file = await readEngagement(input);
    await writeExclusive(receipt, createPilotDeletionReceipt(file));
    await unlink(input);
    process.stdout.write(`Deleted local engagement and created ${receipt}\n`);
  } else if (command === "activation") {
    const input = option(args, "--input");
    const output = option(args, "--out");
    const positional = positionalArgs(args, new Set(["--input", "--out"]));
    if (positional.length || !input || !output)
      throw new Error("activation requires --input <path> and --out <path>");
    const report = activationReportSchema.parse(
      JSON.parse(await readFile(input, "utf8")),
    );
    await writeFile(
      output,
      `${JSON.stringify(createActivationExport(report), null, 2)}\n`,
      { flag: "wx" },
    );
    process.stdout.write(
      `Validated consented activation report and created ${output}\n`,
    );
  } else if (command === "activation-delete") {
    const input = option(args, "--input");
    const receipt = option(args, "--receipt");
    const positional = positionalArgs(args, new Set(["--input", "--receipt"]));
    if (positional.length || !input || !receipt) {
      throw new Error(
        "activation-delete requires --input <path> and --receipt <path>",
      );
    }
    if (resolve(input) === resolve(receipt)) {
      throw new Error("activation input and deletion receipt must differ");
    }
    const report = activationReportSchema.parse(
      JSON.parse(await readFile(input, "utf8")),
    );
    await writeFile(
      receipt,
      `${JSON.stringify(createDeletionReceipt(report), null, 2)}\n`,
      { flag: "wx" },
    );
    await unlink(input);
    process.stdout.write(
      `Deleted local activation report and created ${receipt}\n`,
    );
  } else {
    usage(command ? 1 : 0);
  }
} catch (cause) {
  process.stderr.write(
    `meterkit-pilot: ${cause instanceof Error ? cause.message : String(cause)}\n`,
  );
  process.exitCode = 1;
}

function option(values: string[], name: string) {
  const matches = values.flatMap((value, index) =>
    value === name ? [index] : [],
  );
  if (matches.length > 1) throw new Error(`${name} may only be provided once`);
  const index = matches[0] ?? -1;
  if (index < 0) return undefined;
  const value = values[index + 1];
  if (!value || value.startsWith("--"))
    throw new Error(`${name} requires a value`);
  return value;
}

function requiredOption(values: string[], name: string) {
  const value = option(values, name);
  if (!value) throw new Error(`${name} is required`);
  return value;
}

async function readEngagement(path: string) {
  return pilotEngagementFileSchema.parse(
    JSON.parse(await readFile(path, "utf8")),
  );
}

async function writeExclusive(path: string, value: unknown) {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, { flag: "wx" });
}

async function engagementMutation(values: string[], extra: string[]) {
  const input = requiredOption(values, "--input");
  const output = requiredOption(values, "--out");
  const positional = positionalArgs(
    values,
    new Set(["--input", "--out", ...extra]),
  );
  if (positional.length) throw new Error("unexpected positional argument");
  if (resolve(input) === resolve(output))
    throw new Error("engagement input and output must differ");
  return { input, output, file: await readEngagement(input) };
}

function positionalArgs(values: string[], optionsWithValues: Set<string>) {
  const output: string[] = [];
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index]!;
    if (value === "--") {
      continue;
    } else if (optionsWithValues.has(value)) {
      if (!values[index + 1] || values[index + 1]!.startsWith("--"))
        throw new Error(`${value} requires a value`);
      index += 1;
    } else if (value.startsWith("--")) {
      throw new Error(`unknown option: ${value}`);
    } else {
      output.push(value);
    }
  }
  return output;
}

function usage(code: number): never {
  process.stderr.write(`MeterKit pilot verifier

Usage:
  meterkit-pilot init [endpoint] [--out meterkit-pilot.json]
  meterkit-pilot diagnose --config meterkit-pilot.json [--out diagnose-report.json]
  meterkit-pilot verify --config meterkit-pilot.json [--out pilot-report.json]
  meterkit-pilot evidence --receipt settlement.json --out pilot-evidence.json
  meterkit-pilot activation --input activation.json --out activation-report.json
  meterkit-pilot activation-delete --input activation.json --receipt deletion.json
  meterkit-pilot engagement-init --surface <express|next-route|hono|mcp> --participant-class <class> --assistance <mode> --out engagement.json
  meterkit-pilot engagement-stage --input engagement.json --stage <stage> --outcome <passed|failed|unknown> --out next.json
  meterkit-pilot engagement-intervention --input engagement.json --stage <stage> --kind <kind> --reason <code> --actor <class> --began-at <time> --ended-at <time> --out next.json
  meterkit-pilot engagement-consent --input engagement.json --scope <scope> --status <granted|denied|withdrawn> --terms <version> --out next.json
  meterkit-pilot engagement-retention --input engagement.json --observed-at <time> --outcome <state> --out next.json
  meterkit-pilot engagement-wtp --input engagement.json --response <response> --responded-at <time> --out next.json
  meterkit-pilot engagement-export --input engagement.json --out minimized.json
  meterkit-pilot engagement-delete --input engagement.json --receipt deletion.json
`);
  process.exit(code);
}
