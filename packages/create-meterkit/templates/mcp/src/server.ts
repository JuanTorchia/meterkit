import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SOLANA_DEVNET, SolanaSettlementValidator } from "@usemeterkit/sdk";
import { HTTPFacilitatorClient } from "@x402/core/server";
import { createPaymentWrapper, x402ResourceServer } from "@x402/mcp";
import { ExactSvmScheme } from "@x402/svm/exact/server";
import { z } from "zod";
import { createPaymentStore } from "./payment-store.js";

const wallet = process.env.MERCHANT_WALLET;
if (!wallet)
  throw new Error("Set MERCHANT_WALLET to a disposable devnet address");
const USDC_DEVNET = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
const rpcUrl = process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com";
const settlementValidator = new SolanaSettlementValidator(rpcUrl);
// One process keeps one set of spent signatures. Persist this in a database
// before serving anything that matters: an in-memory set forgets every replay
// it has already rejected as soon as the process restarts.
const paymentStore = await createPaymentStore();

const resourceServer = new x402ResourceServer(
  new HTTPFacilitatorClient({
    url: process.env.X402_FACILITATOR_URL ?? "https://x402.org/facilitator",
  }),
)
  .register(SOLANA_DEVNET, new ExactSvmScheme({}))
  .onAfterSettle(async ({ result, requirements }) => {
    if (!result.success || !result.transaction || !result.payer)
      throw new Error("PAYMENT_SETTLEMENT_INCOMPLETE");
    if (await paymentStore.has(result.transaction))
      throw new Error("PAYMENT_PROOF_ALREADY_USED");
    await settlementValidator.validate({
      signature: result.transaction,
      payer: result.payer,
      payTo: requirements.payTo,
      mint: requirements.asset,
      amountAtomic: requirements.amount,
    });
    await paymentStore.save({
      id: crypto.randomUUID(),
      productId: "premium_tool",
      payer: result.payer,
      payTo: requirements.payTo,
      mint: requirements.asset,
      amountAtomic: requirements.amount,
      network: SOLANA_DEVNET,
      signature: result.transaction,
      settledAt: new Date().toISOString(),
      status: "confirmed",
    });
  });
await resourceServer.initialize();

const accepts = await resourceServer.buildPaymentRequirements({
  scheme: "exact",
  network: SOLANA_DEVNET,
  payTo: wallet,
  price: { amount: "10000", asset: USDC_DEVNET },
  maxTimeoutSeconds: 300,
});

if (process.argv.includes("--unpaid")) {
  process.stdout.write(`${JSON.stringify({ accepts }, null, 2)}\n`);
  process.exit(0);
}

const paid = createPaymentWrapper(resourceServer, {
  accepts,
  resource: {
    url: "mcp://tool/premium_tool",
    description: "A protected MCP tool result",
    mimeType: "application/json",
    serviceName: "MeterKit paid MCP tool",
    tags: ["meterkit"],
  },
});

const server = new McpServer({
  name: "meterkit-paid-mcp",
  version: "0.1.0",
});
server.registerTool(
  "premium_tool",
  {
    title: "Premium tool",
    description: "Returns a protected result for 0.01 devnet USDC.",
    inputSchema: { query: z.string().describe("What to look up") },
  },
  paid(async ({ query }) => ({
    content: [{ type: "text", text: `Protected result for: ${query}` }],
  })),
);

await server.connect(new StdioServerTransport());
