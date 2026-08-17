#!/usr/bin/env node

import { pathToFileURL } from "node:url";
import { createInterface } from "node:readline/promises";

import { METERKIT_CLI_NAME } from "./index.js";
import { checkEndpoint } from "./check.js";
import { CliExitCode, type CliExitCodeValue } from "./output.js";
import { formatJsonEnvelope } from "./output.js";
import { verifyEndpoint } from "./verify.js";
import { payEndpoint } from "./pay.js";
import { doctorProject } from "./doctor.js";

const VERSION = "0.3.0";
const COMMANDS = ["check", "doctor", "verify", "pay"] as const;
type Command = (typeof COMMANDS)[number];

function help() {
  return `${METERKIT_CLI_NAME} ${VERSION}\n\nUsage: meterkit <check|doctor|verify|pay> [options]\n`;
}

export type ParsedCliInvocation =
  | { kind: "help" }
  | { kind: "version" }
  | { kind: "command"; command: Command; arguments: string[] };

export function parseCliInvocation(
  arguments_: readonly string[],
): ParsedCliInvocation {
  const [first, ...rest] = arguments_;
  if (!first || first === "--help" || first === "-h") return { kind: "help" };
  if (first === "--version" || first === "-v") return { kind: "version" };
  if ((COMMANDS as readonly string[]).includes(first)) {
    return { kind: "command", command: first as Command, arguments: rest };
  }
  throw new Error(`unknown command: ${first}`);
}

export async function runCli(
  arguments_: readonly string[],
  streams: Pick<typeof process, "stdout" | "stderr"> = process,
): Promise<CliExitCodeValue> {
  let invocation: ParsedCliInvocation;
  try {
    invocation = parseCliInvocation(arguments_);
  } catch (error) {
    streams.stderr.write(
      `${error instanceof Error ? error.message : String(error)}\n`,
    );
    streams.stderr.write(help());
    return CliExitCode.invalidInput;
  }
  if (invocation.kind === "version") {
    streams.stdout.write(`${VERSION}\n`);
    return CliExitCode.success;
  }
  if (invocation.kind === "help") {
    streams.stdout.write(help());
    return CliExitCode.success;
  }

  if (invocation.command === "check") {
    const [url, ...options] = invocation.arguments;
    if (!url) {
      streams.stderr.write("check requires an endpoint URL\n");
      return CliExitCode.invalidInput;
    }
    try {
      const result = await checkEndpoint(url, {
        allowLocalhost: options.includes("--allow-localhost"),
      });
      if (options.includes("--json")) {
        streams.stdout.write(formatJsonEnvelope("check", result));
      } else {
        streams.stdout.write(
          `HTTP 402\nNetwork: ${result.network}\nMint: ${result.mint}\nAmount: ${result.amountAtomic}\nRecipient: ${result.recipient}\nResource: ${result.resource}\n`,
        );
      }
      return CliExitCode.success;
    } catch (error) {
      streams.stderr.write(
        `${error instanceof Error ? error.message : "check failed"}\n`,
      );
      return CliExitCode.checkFailed;
    }
  }

  if (invocation.command === "doctor") {
    const options = invocation.arguments;
    const value = (name: string) => {
      const index = options.indexOf(name);
      return index === -1 ? undefined : options[index + 1];
    };
    try {
      const url = value("--url");
      const rpcUrl = value("--rpc-url");
      const facilitatorUrl = value("--facilitator-url");
      const payer = value("--payer");
      const paymentResultPath = value("--payment-result");
      const expectedMint = value("--mint");
      const maximumAmountAtomic = value("--max-amount");
      const report = await doctorProject({
        project: value("--project") ?? process.cwd(),
        ...(url ? { url } : {}),
        ...(rpcUrl ? { rpcUrl } : {}),
        ...(facilitatorUrl ? { facilitatorUrl } : {}),
        ...(payer ? { payer } : {}),
        ...(paymentResultPath ? { paymentResultPath } : {}),
        ...(expectedMint ? { expectedMint } : {}),
        ...(maximumAmountAtomic ? { maximumAmountAtomic } : {}),
        allowLocalhost: options.includes("--allow-localhost"),
      });
      if (options.includes("--json")) {
        streams.stdout.write(formatJsonEnvelope("doctor", report));
      } else {
        for (const finding of report.findings) {
          streams.stdout.write(
            `${finding.state.toUpperCase()} ${finding.code}: ${finding.summary}${finding.remediation ? `\n  ${finding.remediation}` : ""}\n`,
          );
        }
      }
      if (report.findings.some(({ state }) => state === "failed"))
        return CliExitCode.checkFailed;
      if (report.findings.some(({ state }) => state === "unavailable"))
        return CliExitCode.environmentUnavailable;
      return CliExitCode.success;
    } catch (error) {
      streams.stderr.write(
        `${error instanceof Error ? error.message : "doctor failed"}\n`,
      );
      return CliExitCode.checkFailed;
    }
  }

  if (invocation.command === "verify") {
    const [url, ...options] = invocation.arguments;
    const value = (name: string) => {
      const index = options.indexOf(name);
      return index === -1 ? undefined : options[index + 1];
    };
    const network = value("--network");
    const mint = value("--mint");
    const recipient = value("--recipient");
    const maxAmountAtomic = value("--max-amount");
    if (!url || !network || !mint || !recipient || !maxAmountAtomic) {
      streams.stderr.write(
        "verify requires URL, --network, --mint, --recipient and --max-amount\n",
      );
      return CliExitCode.invalidInput;
    }
    const result = await verifyEndpoint(url, {
      network,
      mint,
      recipient,
      maxAmountAtomic,
      allowLocalhost: options.includes("--allow-localhost"),
    });
    streams.stdout.write(
      options.includes("--json")
        ? formatJsonEnvelope("verify", result)
        : `${result.passed ? "PASS" : "FAIL"}: ${result.checks
            .filter(({ ok }) => !ok)
            .map(({ name }) => name)
            .join(", ")}\n`,
    );
    return result.passed ? CliExitCode.success : CliExitCode.checkFailed;
  }

  if (invocation.command === "pay") {
    const [endpoint, ...options] = invocation.arguments;
    const value = (name: string) => {
      const index = options.indexOf(name);
      return index === -1 ? undefined : options[index + 1];
    };
    const keypairPath = value("--keypair");
    const recipient = value("--recipient");
    const mint = value("--mint");
    const maxAmountAtomic = value("--max-amount");
    const maxSessionAtomic = value("--max-session");
    const rpcUrl = value("--rpc-url");
    if (
      !endpoint ||
      !keypairPath ||
      !recipient ||
      !mint ||
      !maxAmountAtomic ||
      !maxSessionAtomic
    ) {
      streams.stderr.write(
        "pay requires URL, --keypair, --recipient, --mint, --max-amount and --max-session\n",
      );
      return CliExitCode.invalidInput;
    }
    if (!options.includes("--yes")) {
      if (!process.stdin.isTTY) {
        streams.stderr.write("pay requires --yes in a non-interactive shell\n");
        return CliExitCode.invalidInput;
      }
      const terminal = createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      const answer = await terminal.question(
        `Authorize up to ${maxAmountAtomic} atomic devnet units per request? [y/N] `,
      );
      terminal.close();
      if (!/^y(?:es)?$/i.test(answer.trim())) return CliExitCode.paymentFailed;
    }
    try {
      const result = await payEndpoint({
        endpoint,
        keypairPath,
        recipient,
        mint,
        maxAmountAtomic,
        maxSessionAtomic,
        ...(rpcUrl ? { rpcUrl } : {}),
        replay: options.includes("--replay"),
      });
      streams.stdout.write(
        options.includes("--json")
          ? formatJsonEnvelope("pay", result)
          : `Paid devnet request accepted${result.replayStatus ? `; replay rejected with HTTP ${result.replayStatus}` : ""}.\n`,
      );
      return CliExitCode.success;
    } catch (error) {
      streams.stderr.write(
        `${error instanceof Error ? error.message : "payment failed"}\n`,
      );
      return CliExitCode.paymentFailed;
    }
  }

  return CliExitCode.checkFailed;
}

const isDirectInvocation =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirectInvocation) {
  process.exitCode = await runCli(process.argv.slice(2));
}
