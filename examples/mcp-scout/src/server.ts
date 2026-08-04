import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createPaymentWrapper, x402ResourceServer } from "@x402/mcp";
import { HTTPFacilitatorClient } from "@x402/core/server";
import { ExactSvmScheme } from "@x402/svm/exact/server";
import { z } from "zod";
import { SolanaSettlementValidator } from "@meterkit/sdk";
import { fetchProject, renderReport } from "./scout.js";
import { FileReceiptGuard } from "./receipt-guard.js";

const SOLANA_DEVNET = "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1";
const USDC_DEVNET = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
const payTo = process.env.MERCHANT_WALLET;
if (!payTo) throw new Error("MERCHANT_WALLET is required for paid MCP tools");

const facilitator = new HTTPFacilitatorClient({
  url: process.env.X402_FACILITATOR_URL ?? "https://x402.org/facilitator",
});
const rpcUrl = process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com";
const settlementValidator = new SolanaSettlementValidator(rpcUrl);
const receiptGuard = new FileReceiptGuard(
  process.env.MCP_RECEIPT_DIR ?? ".meterkit/mcp-receipts",
);
const resourceServer = new x402ResourceServer(facilitator)
  .register(SOLANA_DEVNET, new ExactSvmScheme({}))
  .onAfterSettle(async ({ result, requirements }) => {
    if (!result.success || !result.transaction || !result.payer) {
      throw new Error("PAYMENT_SETTLEMENT_INCOMPLETE");
    }
    await settlementValidator.validate({
      signature: result.transaction,
      payer: result.payer,
      payTo: requirements.payTo,
      mint: requirements.asset,
      amountAtomic: requirements.amount,
    });
    await receiptGuard.claim(result.transaction);
  });
await resourceServer.initialize();
const accepts = await resourceServer.buildPaymentRequirements({
  scheme: "exact",
  network: SOLANA_DEVNET,
  payTo,
  price: { amount: "20000", asset: USDC_DEVNET },
  maxTimeoutSeconds: 300,
});
const paid = createPaymentWrapper(resourceServer, {
  accepts,
  resource: {
    url: "mcp://tool/scout_project",
    description: "Reporte factual verificable de un repositorio público de Solana",
    mimeType: "text/markdown",
    serviceName: "MeterKit Solana Project Scout",
    tags: ["solana", "open-source", "project-research"],
  },
});

const server = new McpServer({ name: "solana-project-scout", version: "0.1.0" });
let previewUsed = false;
const inputSchema = {
  githubRepository: z.string().regex(/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/)
    .describe("Repositorio público en formato owner/repo"),
};

server.registerTool(
  "scout_project_preview",
  {
    title: "Solana Project Scout — vista previa gratuita",
    description: "Una consulta gratuita: valida el repositorio y devuelve sus fuentes, sin análisis financiero.",
    inputSchema,
  },
  async ({ githubRepository }) => {
    if (previewUsed) {
      return { content: [{ type: "text", text:
        "La vista previa gratuita de esta sesión ya fue utilizada. Usa scout_project para el reporte pagado.",
      }] };
    }
    previewUsed = true;
    const report = await fetchProject(githubRepository);
    return { content: [{ type: "text", text: [
      `# ${report.name}`,
      report.description || "Sin descripción pública.",
      `Actualizado en GitHub: ${report.updatedAt}`,
      `Fuente: ${report.htmlUrl}`,
      `Consultado: ${report.checkedAt}`,
      "",
      "Vista previa gratuita. Usa scout_project para el reporte verificable completo.",
      "No es asesoramiento de inversión.",
    ].join("\n") }] };
  },
);

server.registerTool(
  "scout_project",
  {
    title: "Solana Project Scout",
    description: "Reporte factual verificable por 0,02 USDC devnet. Sin señales de compra ni asesoramiento financiero.",
    inputSchema,
  },
  paid(async ({ githubRepository }) => {
    const report = await fetchProject(String(githubRepository));
    return { content: [{ type: "text", text: renderReport(report) }] };
  }),
);

await server.connect(new StdioServerTransport());
