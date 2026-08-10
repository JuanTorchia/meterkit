import { createServer } from "node:http";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { publicPaymentReceiptSchema } from "@usemeterkit/core";

const payTo = "7NXuBzJ3EQV4CuxpSVELD3t1bs5xZ6ocfGvwjFDbCZUE";
let facilitator: ReturnType<typeof createServer>;
let facilitatorUrl: string;

beforeAll(async () => {
  facilitator = createServer((request, response) => {
    if (request.url === "/supported") {
      response.setHeader("content-type", "application/json");
      response.end(
        JSON.stringify({
          kinds: [
            {
              x402Version: 2,
              scheme: "exact",
              network: "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1",
              extra: { feePayer: payTo },
            },
          ],
          extensions: [],
          signers: {},
        }),
      );
      return;
    }
    response.statusCode = 500;
    response.end();
  });
  await new Promise<void>((resolve) =>
    facilitator.listen(0, "127.0.0.1", resolve),
  );
  const address = facilitator.address();
  if (!address || typeof address === "string")
    throw new Error("mock facilitator failed");
  facilitatorUrl = `http://127.0.0.1:${address.port}`;
});

afterAll(
  async () =>
    new Promise<void>((resolve, reject) =>
      facilitator.close((error) => (error ? reject(error) : resolve())),
    ),
);

describe("MCP Scout stdio contract", () => {
  it("shares the canonical sanitized receipt contract", () => {
    const now = new Date().toISOString();
    expect(
      publicPaymentReceiptSchema.parse({
        schemaVersion: 1,
        receiptId: crypto.randomUUID(),
        productId: "solana-project-scout",
        network: "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1",
        assetMint: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
        amountAtomic: "20000",
        recipient: payTo,
        resource: "mcp://tool/scout_project",
        decision: "accepted",
        settlement: "confirmed",
        signatureFingerprint: "sha256:0123456789abcdef",
        policyDecisions: [],
        createdAt: now,
        updatedAt: now,
        reasonCode: "SETTLEMENT_CONFIRMED",
      }).amountAtomic,
    ).toBe("20000");
  });
  it("advertises the useful tools and challenges an unpaid full report", async () => {
    const inheritedEnv = Object.fromEntries(
      Object.entries(process.env).filter(
        (entry): entry is [string, string] => typeof entry[1] === "string",
      ),
    );
    const transport = new StdioClientTransport({
      command: "pnpm",
      args: ["exec", "tsx", "src/server.ts"],
      cwd: new URL("..", import.meta.url).pathname,
      env: {
        ...inheritedEnv,
        MERCHANT_WALLET: payTo,
        X402_FACILITATOR_URL: facilitatorUrl,
        SOLANA_RPC_URL: "https://api.devnet.solana.com",
      },
      stderr: "pipe",
    });
    const client = new Client({ name: "meterkit-test", version: "0.1.0" });
    try {
      await client.connect(transport);
      const tools = await client.listTools();
      expect(tools.tools.map((tool) => tool.name)).toEqual([
        "scout_project_preview",
        "scout_project",
      ]);
      const result = await client.callTool({
        name: "scout_project",
        arguments: { githubRepository: "solana-foundation/kit" },
      });
      expect(result.isError).toBe(true);
      const serialized = JSON.stringify(result);
      expect(serialized.toLowerCase()).toContain("payment");
      expect(serialized).toContain("20000");
      expect(serialized).toContain("mcp://tool/scout_project");
    } finally {
      await client.close();
    }
  }, 15_000);
});
