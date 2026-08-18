import { access, readFile } from "node:fs/promises";
import { connect } from "node:net";
import { join } from "node:path";
import {
  diagnosticReportSchema,
  type DiagnosticFinding,
} from "@usemeterkit/core";
import { checkEndpoint } from "./check.js";
import { checkFacilitator, checkSolanaReadiness } from "./doctor-solana.js";
import { withRemediation } from "./remediation.js";
import { SOLANA_DEVNET } from "@usemeterkit/core";

const ADDRESS = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

function parseEnvironment(source: string) {
  return Object.fromEntries(
    source
      .split(/\r?\n/)
      .filter((line) => line && !line.trimStart().startsWith("#"))
      .map((line) => {
        const separator = line.indexOf("=");
        return separator < 1
          ? [line.trim(), ""]
          : [line.slice(0, separator).trim(), line.slice(separator + 1).trim()];
      }),
  );
}

async function readProjectEnvironment(project: string) {
  for (const name of [".env", ".env.local"]) {
    try {
      return parseEnvironment(await readFile(join(project, name), "utf8"));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  }
  return undefined;
}

async function checkDependencies(project: string): Promise<DiagnosticFinding> {
  try {
    const manifest = JSON.parse(
      await readFile(join(project, "package.json"), "utf8"),
    ) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    if (!manifest.dependencies?.["@usemeterkit/sdk"])
      throw new Error("SDK_MISSING");
    await access(join(project, "node_modules", "@usemeterkit", "sdk"));
    return {
      code: "DEPENDENCIES_READY",
      category: "dependencies",
      state: "passed",
      summary: "The generated SDK dependency is declared and installed.",
    };
  } catch {
    return withRemediation({
      code: "DEPENDENCIES_MISSING",
      category: "dependencies",
      state: "failed",
      summary: "Generated dependencies are missing or not installed.",
    });
  }
}

async function checkPaymentResult(path: string): Promise<DiagnosticFinding[]> {
  try {
    const parsed = JSON.parse(await readFile(path, "utf8")) as {
      data?: {
        protectedResponse?: unknown;
        settlementFingerprint?: unknown;
        replayStatus?: unknown;
        rpcSettlementState?: unknown;
        explorerSettlementState?: unknown;
      };
    };
    const data = parsed.data;
    const settled =
      data?.protectedResponse === true &&
      typeof data.settlementFingerprint === "string" &&
      /^[0-9a-f]{16}$/.test(data.settlementFingerprint);
    const replay =
      typeof data?.replayStatus === "number" && data.replayStatus >= 400;
    const sourceConflict =
      typeof data?.rpcSettlementState === "string" &&
      typeof data.explorerSettlementState === "string" &&
      data.rpcSettlementState !== data.explorerSettlementState;
    if (sourceConflict)
      return [
        withRemediation({
          code: "SETTLEMENT_SOURCE_CONFLICT",
          category: "settlement",
          state: "unknown",
          summary:
            "RPC and Explorer evidence disagree, so settlement remains unknown.",
        }),
        replay
          ? {
              code: "REPLAY_REJECTED",
              category: "replay",
              state: "passed",
              summary: "The sanitized result records replay rejection.",
            }
          : withRemediation({
              code: "REPLAY_UNKNOWN",
              category: "replay",
              state: "unknown",
              summary: "The sanitized result does not prove replay rejection.",
            }),
      ];
    return [
      settled
        ? {
            code: "SETTLEMENT_OBSERVED",
            category: "settlement",
            state: "passed",
            summary:
              "Sanitized payment evidence contains a correlated protected response and settlement fingerprint.",
          }
        : withRemediation({
            code: "SETTLEMENT_UNKNOWN",
            category: "settlement",
            state: "unknown",
            summary: "The sanitized result does not prove settlement.",
          }),
      replay
        ? {
            code: "REPLAY_REJECTED",
            category: "replay",
            state: "passed",
            summary: "The sanitized result records replay rejection.",
          }
        : withRemediation({
            code: "REPLAY_UNKNOWN",
            category: "replay",
            state: "unknown",
            summary: "The sanitized result does not prove replay rejection.",
          }),
    ];
  } catch {
    return [
      withRemediation({
        code: "PAYMENT_RESULT_MISSING",
        category: "settlement",
        state: "unknown",
        summary: "No readable sanitized payment result was supplied.",
      }),
    ];
  }
}

async function checkDatabase(
  value: string,
  timeoutMs: number,
): Promise<DiagnosticFinding> {
  try {
    const url = new URL(value);
    if (!/^postgres(?:ql)?:$/.test(url.protocol))
      throw new Error("INVALID_PROTOCOL");
    await new Promise<void>((resolve, reject) => {
      const socket = connect({
        host: url.hostname,
        port: Number(url.port || 5432),
      });
      const timeout = setTimeout(
        () => socket.destroy(new Error("TIMEOUT")),
        timeoutMs,
      );
      socket.once("connect", () => {
        clearTimeout(timeout);
        socket.destroy();
        resolve();
      });
      socket.once("error", (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
    return {
      code: "DATABASE_REACHABLE",
      category: "database",
      state: "passed",
      summary: "PostgreSQL accepts a TCP connection.",
    };
  } catch {
    return withRemediation({
      code: "DATABASE_UNAVAILABLE",
      category: "database",
      state: "unavailable",
      summary:
        "PostgreSQL could not be reached; credentials were not displayed.",
    });
  }
}

export async function doctorProject(options: {
  project: string;
  url?: string;
  allowLocalhost?: boolean;
  rpcUrl?: string;
  facilitatorUrl?: string;
  fetch?: typeof fetch;
  timeoutMs?: number;
  nodeVersion?: string;
  payer?: string;
  paymentResultPath?: string;
  expectedMint?: string;
  maximumAmountAtomic?: string;
}) {
  const findings: DiagnosticFinding[] = [];
  const major = Number(
    (options.nodeVersion ?? process.versions.node).split(".")[0],
  );
  findings.push(
    major >= 22
      ? {
          code: "NODE_SUPPORTED",
          category: "runtime",
          state: "passed",
          summary: "Node.js 22 or newer is active.",
        }
      : withRemediation({
          code: "NODE_UNSUPPORTED",
          category: "runtime",
          state: "failed",
          summary: "Node.js 22 or newer is required.",
        }),
  );
  findings.push(await checkDependencies(options.project));
  const environment = await readProjectEnvironment(options.project);
  if (!environment) {
    findings.push(
      withRemediation({
        code: "ENV_MISSING",
        category: "configuration",
        state: "failed",
        summary: "No generated environment file was found.",
      }),
    );
  } else {
    const recipient = environment.MERCHANT_WALLET;
    findings.push(
      recipient && ADDRESS.test(recipient)
        ? {
            code: "RECIPIENT_VALID",
            category: "configuration",
            state: "passed",
            summary: "The recipient is a syntactically valid public address.",
          }
        : withRemediation({
            code: "RECIPIENT_INVALID",
            category: "configuration",
            state: "failed",
            summary: "MERCHANT_WALLET is missing or invalid.",
          }),
    );
    const durability = environment.DURABILITY_MODE;
    findings.push(
      durability === "memory" || durability === "postgres"
        ? {
            code:
              durability === "memory"
                ? "MEMORY_NON_DURABLE"
                : "POSTGRES_SELECTED",
            category: "durability",
            state: durability === "memory" ? "unknown" : "passed",
            summary:
              durability === "memory"
                ? "Memory mode loses replay history on restart."
                : "PostgreSQL durability is selected.",
          }
        : withRemediation({
            code: "DURABILITY_INVALID",
            category: "durability",
            state: "failed",
            summary: "DURABILITY_MODE is missing or invalid.",
          }),
    );
    if (durability === "postgres") {
      findings.push(
        environment.DATABASE_URL
          ? await checkDatabase(
              environment.DATABASE_URL,
              options.timeoutMs ?? 5_000,
            )
          : withRemediation({
              code: "DATABASE_URL_MISSING",
              category: "database",
              state: "failed",
              summary: "PostgreSQL mode requires DATABASE_URL.",
            }),
      );
    }
    findings.push(
      ...(await checkSolanaReadiness({
        rpcUrl:
          options.rpcUrl ??
          environment.SOLANA_RPC_URL ??
          "https://api.devnet.solana.com",
        ...(recipient ? { recipient } : {}),
        ...(options.payer ? { payer: options.payer } : {}),
        ...(options.fetch ? { fetch: options.fetch } : {}),
        ...(options.timeoutMs !== undefined
          ? { timeoutMs: options.timeoutMs }
          : {}),
      })),
    );
  }
  if (options.url) {
    try {
      const challenge = await checkEndpoint(options.url, {
        ...(options.allowLocalhost !== undefined
          ? { allowLocalhost: options.allowLocalhost }
          : {}),
        ...(options.fetch ? { fetch: options.fetch } : {}),
        ...(options.timeoutMs !== undefined
          ? { timeoutMs: options.timeoutMs }
          : {}),
      });
      const expectedRecipient = environment?.MERCHANT_WALLET;
      const expectedMint =
        options.expectedMint ?? "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
      const maximum = BigInt(options.maximumAmountAtomic ?? "10000");
      const policyMatches =
        challenge.network === SOLANA_DEVNET &&
        challenge.mint === expectedMint &&
        challenge.recipient === expectedRecipient &&
        BigInt(challenge.amountAtomic) <= maximum;
      findings.push(
        policyMatches
          ? {
              code: "ENDPOINT_POLICY_READY",
              category: "policy",
              state: "passed",
              summary:
                "The endpoint challenge matches the exact devnet policy.",
            }
          : withRemediation({
              code: "POLICY_MISMATCH",
              category: "policy",
              state: "failed",
              summary:
                "The endpoint challenge does not match the configured devnet policy.",
            }),
      );
    } catch {
      findings.push(
        withRemediation({
          code: "ENDPOINT_FAILED",
          category: "endpoint",
          state: "failed",
          summary: "The endpoint did not return a valid x402 challenge.",
        }),
      );
    }
  }
  findings.push(
    await checkFacilitator({
      url: options.facilitatorUrl ?? "https://x402.org/facilitator",
      ...(options.fetch ? { fetch: options.fetch } : {}),
      ...(options.timeoutMs !== undefined
        ? { timeoutMs: options.timeoutMs }
        : {}),
    }),
  );
  findings.push(
    ...(options.paymentResultPath
      ? await checkPaymentResult(options.paymentResultPath)
      : [
          withRemediation({
            code: "PAYMENT_RESULT_MISSING",
            category: "settlement",
            state: "unknown",
            summary:
              "No sanitized payment result was supplied, so settlement and replay remain unknown.",
          }),
        ]),
  );
  return diagnosticReportSchema.parse({
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    toolVersion: "0.3.1",
    findings,
  });
}
