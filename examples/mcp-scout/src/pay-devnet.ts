import { readFile } from "node:fs/promises";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { createKeyPairSignerFromBytes } from "@solana/kit";
import { createx402MCPClient } from "@x402/mcp";
import { ExactSvmScheme } from "@x402/svm/exact/client";

const SOLANA_DEVNET = "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1";
const USDC_DEVNET = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
const PRICE_ATOMIC = "20000";

async function privateKeyFromEnvironment(): Promise<Uint8Array> {
  const encoded = process.env.SOLANA_KEYPAIR_PATH
    ? await readFile(process.env.SOLANA_KEYPAIR_PATH, "utf8")
    : process.env.SOLANA_PRIVATE_KEY;
  if (!encoded) throw new Error("SOLANA_KEYPAIR_PATH or SOLANA_PRIVATE_KEY is required");
  const parsed: unknown = JSON.parse(encoded);
  if (!Array.isArray(parsed) || parsed.length !== 64 ||
      !parsed.every((item) => Number.isInteger(item) && item >= 0 && item <= 255)) {
    throw new Error("SOLANA_PRIVATE_KEY must contain exactly 64 bytes");
  }
  return Uint8Array.from(parsed as number[]);
}

async function main() {
  const payTo = process.env.MERCHANT_WALLET;
  if (!payTo) throw new Error("MERCHANT_WALLET is required");
  const maxSessionAtomic = BigInt(process.env.MAX_SESSION_SPEND_ATOMIC ?? PRICE_ATOMIC);
  let authorizedAtomic = 0n;

  const signer = await createKeyPairSignerFromBytes(await privateKeyFromEnvironment());
  const client = createx402MCPClient({
    name: "meterkit-scout-devnet-buyer",
    version: "0.1.0",
    schemes: [{
      network: SOLANA_DEVNET,
      client: new ExactSvmScheme(signer, {
        rpcUrl: process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com",
      }),
    }],
    autoPayment: true,
    onPaymentRequested: ({ paymentRequired }) => {
      const requirement = paymentRequired.accepts.find((candidate) =>
        candidate.scheme === "exact" &&
        candidate.network === SOLANA_DEVNET &&
        candidate.asset === USDC_DEVNET &&
        candidate.amount === PRICE_ATOMIC &&
        candidate.payTo === payTo &&
        paymentRequired.resource.url === "mcp://tool/scout_project" &&
        authorizedAtomic + BigInt(candidate.amount) <= maxSessionAtomic
      );
      if (!requirement) {
        process.stderr.write(`${JSON.stringify({
          error: "Rejected unexpected payment requirements",
          accepts: paymentRequired.accepts.map((candidate) => ({
            scheme: candidate.scheme,
            network: candidate.network,
            asset: candidate.asset,
            amount: candidate.amount,
            payTo: candidate.payTo,
          })),
        })}\n`);
      }
      if (requirement) authorizedAtomic += BigInt(requirement.amount);
      return Boolean(requirement);
    },
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
    const result = await client.callTool("scout_project", { githubRepository: repository });
    if (result.isError || !result.paymentMade || !result.paymentResponse) {
      throw new Error(`The paid MCP call did not settle: ${JSON.stringify({
        isError: result.isError,
        paymentMade: result.paymentMade,
        paymentResponse: result.paymentResponse,
        content: result.content,
      })}`);
    }
    process.stdout.write(`${JSON.stringify({
      repository,
      payment: result.paymentResponse,
      report: result.content,
    }, null, 2)}\n`);
  } finally {
    await client.close();
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
