import { createHash } from "node:crypto";
import { chmod, readFile, writeFile } from "node:fs/promises";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { createKeyPairSignerFromBytes } from "@solana/kit";
import { createx402MCPClient } from "@x402/mcp";
import { ExactSvmScheme } from "@x402/svm/exact/client";

const SOLANA_DEVNET = "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1";
const USDC_DEVNET = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
const PRICE_ATOMIC = "20000";

function fingerprint(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 16);
}

function sanitizePayment(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitizePayment);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => {
      if (
        typeof entry === "string" &&
        /(?:signature|transaction)/i.test(key) &&
        entry.length > 32
      ) {
        return [`${key}Fingerprint`, fingerprint(entry)];
      }
      return [key, sanitizePayment(entry)];
    }),
  );
}

async function privateKeyFromEnvironment(): Promise<Uint8Array> {
  const encoded = process.env.SOLANA_KEYPAIR_PATH
    ? await readFile(process.env.SOLANA_KEYPAIR_PATH, "utf8")
    : process.env.SOLANA_PRIVATE_KEY;
  if (!encoded)
    throw new Error("SOLANA_KEYPAIR_PATH or SOLANA_PRIVATE_KEY is required");
  const parsed: unknown = JSON.parse(encoded);
  if (
    !Array.isArray(parsed) ||
    parsed.length !== 64 ||
    !parsed.every((item) => Number.isInteger(item) && item >= 0 && item <= 255)
  ) {
    throw new Error("SOLANA_PRIVATE_KEY must contain exactly 64 bytes");
  }
  return Uint8Array.from(parsed as number[]);
}

async function main() {
  const payTo = process.env.MERCHANT_WALLET;
  if (!payTo) throw new Error("MERCHANT_WALLET is required");
  const maxSessionAtomic = BigInt(
    process.env.MAX_SESSION_SPEND_ATOMIC ?? PRICE_ATOMIC,
  );
  let authorizedAtomic = 0n;

  const signer = await createKeyPairSignerFromBytes(
    await privateKeyFromEnvironment(),
  );
  const client = createx402MCPClient({
    name: "meterkit-scout-devnet-buyer",
    version: "0.1.0",
    schemes: [
      {
        network: SOLANA_DEVNET,
        client: new ExactSvmScheme(signer, {
          rpcUrl: process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com",
        }),
      },
    ],
    autoPayment: true,
    onPaymentRequested: ({ paymentRequired }) => {
      const requirement = paymentRequired.accepts.find(
        (candidate) =>
          candidate.scheme === "exact" &&
          candidate.network === SOLANA_DEVNET &&
          candidate.asset === USDC_DEVNET &&
          candidate.amount === PRICE_ATOMIC &&
          candidate.payTo === payTo &&
          paymentRequired.resource.url === "mcp://tool/scout_project" &&
          authorizedAtomic + BigInt(candidate.amount) <= maxSessionAtomic,
      );
      if (!requirement) {
        process.stderr.write(
          `${JSON.stringify({
            error: "Rejected unexpected payment requirements",
            accepts: paymentRequired.accepts.map((candidate) => ({
              scheme: candidate.scheme,
              network: candidate.network,
              asset: candidate.asset,
              amount: candidate.amount,
              payTo: candidate.payTo,
            })),
          })}\n`,
        );
      }
      if (requirement) authorizedAtomic += BigInt(requirement.amount);
      return Boolean(requirement);
    },
  });
  let submittedPayload:
    Parameters<typeof client.callToolWithPayment>[2] | undefined;
  client.onAfterPayment(({ paymentPayload }) => {
    submittedPayload ??= paymentPayload;
  });
  const inheritedEnv = Object.fromEntries(
    Object.entries(process.env).filter(
      (entry): entry is [string, string] =>
        typeof entry[1] === "string" &&
        entry[0] !== "SOLANA_PRIVATE_KEY" &&
        entry[0] !== "SOLANA_KEYPAIR_PATH",
    ),
  );
  const transport = new StdioClientTransport({
    command: "pnpm",
    args: ["exec", "tsx", "src/server.ts"],
    cwd: new URL("..", import.meta.url).pathname,
    env: inheritedEnv,
    stderr: "inherit",
  });

  try {
    await client.connect(transport);
    const repository = process.argv[2] ?? "anza-xyz/kit";
    const result = await client.callTool("scout_project", {
      githubRepository: repository,
    });
    if (result.isError || !result.paymentMade || !result.paymentResponse) {
      throw new Error(
        `The paid MCP call did not settle: ${JSON.stringify({
          isError: result.isError,
          paymentMade: result.paymentMade,
          paymentResponse: sanitizePayment(result.paymentResponse),
          content: result.content,
        })}`,
      );
    }
    if (!submittedPayload)
      throw new Error("Paid MCP call did not expose its submitted payload");
    let replayRejected = false;
    try {
      const replay = await client.callToolWithPayment(
        "scout_project",
        { githubRepository: repository },
        submittedPayload,
      );
      replayRejected = replay.isError === true;
    } catch {
      replayRejected = true;
    }
    if (!replayRejected) {
      throw new Error("MCP payment payload replay was accepted");
    }
    const evidencePath = process.env.MCP_EVIDENCE_PATH;
    if (evidencePath) {
      await writeFile(
        evidencePath,
        `${JSON.stringify(
          {
            checkedAt: new Date().toISOString(),
            factualScope:
              "internal Solana devnet validation; not external adoption or revenue",
            network: SOLANA_DEVNET,
            repository,
            amountAtomic: PRICE_ATOMIC,
            recipient: payTo,
            payment: result.paymentResponse,
            replayRejected,
          },
          null,
          2,
        )}\n`,
      );
      await chmod(evidencePath, 0o600);
    }
    process.stdout.write(
      `${JSON.stringify(
        {
          repository,
          payment: sanitizePayment(result.paymentResponse),
          replayRejected,
          report: result.content,
        },
        null,
        2,
      )}\n`,
    );
  } finally {
    await client.close();
  }
}

main().catch((error: unknown) => {
  process.stderr.write(
    `${error instanceof Error ? error.message : String(error)}\n`,
  );
  process.exitCode = 1;
});
