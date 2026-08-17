import { createMeterKitResourceServer, SOLANA_DEVNET } from "@usemeterkit/sdk";
import { withX402 } from "@x402/next";
import { NextResponse, type NextRequest } from "next/server";
import { paymentStore } from "../../payment-store";

async function createPremiumRoute(wallet: string) {
  const port = process.env.PORT ?? "3000";
  const product = {
    id: "premium",
    name: "Premium API",
    description: "Protected data",
    resource: `http://localhost:${port}/api/premium`,
    priceAtomic: "10000",
    assetMint: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
    payTo: wallet,
    network: SOLANA_DEVNET,
  } as const;
  const server = createMeterKitResourceServer({
    product,
    store: await paymentStore,
    rpcUrl: process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com",
  });
  const handler = async () => NextResponse.json({ protected: true });
  return withX402(
    handler,
    {
      accepts: {
        scheme: "exact",
        price: { amount: product.priceAtomic, asset: product.assetMint },
        network: SOLANA_DEVNET,
        payTo: product.payTo,
        maxTimeoutSeconds: 300,
      },
      description: product.description,
      mimeType: "application/json",
    },
    server,
  );
}

let configuredRoute: Awaited<ReturnType<typeof createPremiumRoute>> | undefined;

export async function GET(request: NextRequest) {
  const wallet = process.env.MERCHANT_WALLET;
  if (!wallet)
    return NextResponse.json(
      { error: "server_not_configured", required: "MERCHANT_WALLET" },
      { status: 503 },
    );
  configuredRoute ??= await createPremiumRoute(wallet);
  return configuredRoute(request);
}
