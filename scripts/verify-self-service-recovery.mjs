#!/usr/bin/env node
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { doctorProject } from "../packages/cli/dist/doctor.js";

const recipient = "7NXuBzJ3EQV4CuxpSVELD3t1bs5xZ6ocfGvwjFDbCZUE";
const devnetGenesis = "EtWTRABZaYq6iMfeYKouRu166VU2xqa1";

function rpcFetch({
  genesis = devnetGenesis,
  accounts = [{}],
  offline = false,
  endpointStatus = 402,
  facilitatorStatus = 200,
} = {}) {
  return async (input, init = {}) => {
    if (offline) throw new Error("fixture unavailable");
    const url = String(input);
    if (url.endsWith("/supported"))
      return new Response("{}", { status: facilitatorStatus });
    if (init.method === "POST") {
      const request = JSON.parse(String(init.body));
      return new Response(
        JSON.stringify({
          result:
            request.method === "getGenesisHash" ? genesis : { value: accounts },
        }),
        { status: 200 },
      );
    }
    return new Response("{}", { status: endpointStatus });
  };
}

async function project(environment) {
  const directory = await mkdtemp(join(tmpdir(), "meterkit-recovery-"));
  if (environment !== null)
    await writeFile(join(directory, ".env"), environment);
  return directory;
}

async function paymentResult(data) {
  const directory = await mkdtemp(join(tmpdir(), "meterkit-payment-result-"));
  const path = join(directory, "result.json");
  await writeFile(
    path,
    JSON.stringify({ schemaVersion: 1, command: "pay", data }),
  );
  return path;
}

export async function runRecoveryMatrix() {
  const base = `MERCHANT_WALLET=${recipient}\nDURABILITY_MODE=memory\nSOLANA_RPC_URL=https://rpc.fixture\n`;
  const timedOutResult = await paymentResult({ protectedResponse: false });
  const conflictingResult = await paymentResult({
    protectedResponse: true,
    settlementFingerprint: "0123456789abcdef",
    replayStatus: 409,
    rpcSettlementState: "confirmed",
    explorerSettlementState: "not_found",
  });
  const cases = [
    {
      name: "missing_env",
      directory: await project(null),
      fetch: rpcFetch(),
      expected: "ENV_MISSING",
    },
    {
      name: "invalid_recipient",
      directory: await project(base.replace(recipient, "invalid")),
      fetch: rpcFetch(),
      expected: "RECIPIENT_INVALID",
    },
    {
      name: "unsupported_node",
      directory: await project(base),
      fetch: rpcFetch(),
      nodeVersion: "20.0.0",
      expected: "NODE_UNSUPPORTED",
    },
    {
      name: "rpc_unavailable",
      directory: await project(base),
      fetch: rpcFetch({ offline: true }),
      expected: "RPC_UNAVAILABLE",
    },
    {
      name: "wrong_network",
      directory: await project(base),
      fetch: rpcFetch({ genesis: "mainnet" }),
      expected: "RPC_WRONG_NETWORK",
    },
    {
      name: "token_account_missing",
      directory: await project(base),
      fetch: rpcFetch({ accounts: [] }),
      expected: "TOKEN_ACCOUNT_MISSING",
    },
    {
      name: "facilitator_unavailable",
      directory: await project(base),
      fetch: rpcFetch({ facilitatorStatus: 503 }),
      expected: "FACILITATOR_UNAVAILABLE",
    },
    {
      name: "endpoint_unavailable",
      directory: await project(base),
      fetch: rpcFetch({ endpointStatus: 503 }),
      url: "http://localhost:3000/premium",
      expected: "ENDPOINT_FAILED",
    },
    {
      name: "database_unavailable",
      directory: await project(
        `${base.replace("memory", "postgres")}DATABASE_URL=postgresql://private:secret@127.0.0.1:1/db\n`,
      ),
      fetch: rpcFetch(),
      expected: "DATABASE_UNAVAILABLE",
    },
    {
      name: "settlement_timeout",
      directory: await project(base),
      fetch: rpcFetch(),
      paymentResultPath: timedOutResult,
      expected: "SETTLEMENT_UNKNOWN",
    },
    {
      name: "explorer_disagreement",
      directory: await project(base),
      fetch: rpcFetch(),
      paymentResultPath: conflictingResult,
      expected: "SETTLEMENT_SOURCE_CONFLICT",
    },
  ];
  const results = [];
  for (const fixture of cases) {
    const report = await doctorProject({
      project: fixture.directory,
      fetch: fixture.fetch,
      timeoutMs: 20,
      ...(fixture.nodeVersion ? { nodeVersion: fixture.nodeVersion } : {}),
      ...(fixture.url ? { url: fixture.url, allowLocalhost: true } : {}),
      ...(fixture.paymentResultPath
        ? { paymentResultPath: fixture.paymentResultPath }
        : {}),
    });
    const finding = report.findings.find(
      ({ code }) => code === fixture.expected,
    );
    if (!finding) throw new Error(`RECOVERY_CASE_FAILED_${fixture.name}`);
    if (finding.state === "passed")
      throw new Error(`RECOVERY_FALSE_SUCCESS_${fixture.name}`);
    if (!finding.remediation)
      throw new Error(`RECOVERY_ACTION_MISSING_${fixture.name}`);
    const serialized = JSON.stringify(finding);
    if (/private:secret|DATABASE_URL=|payment-signature/i.test(serialized))
      throw new Error(`RECOVERY_SECRET_LEAK_${fixture.name}`);
    results.push({
      name: fixture.name,
      code: finding.code,
      state: finding.state,
    });
  }
  return results;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  process.stdout.write(
    `${JSON.stringify(await runRecoveryMatrix(), null, 2)}\n`,
  );
}
