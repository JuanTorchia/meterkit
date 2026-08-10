import { NextResponse, type NextRequest } from "next/server";
import { withX402 } from "@x402/next";
import {
  MemoryPaymentStore,
  createMeterKitResourceServer,
} from "@usemeterkit/sdk";
import { SOLANA_DEVNET } from "@usemeterkit/sdk";
import { premiumProduct } from "./product";

export function createPremiumRoute(wallet: string) {
  const product = premiumProduct(wallet);
  const server = createMeterKitResourceServer({
    product,
    store: new MemoryPaymentStore(),
    rpcUrl: false,
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

let configuredRoute: ReturnType<typeof createPremiumRoute> | undefined;
export async function GET(request: NextRequest) {
  const merchantWallet = process.env.MERCHANT_WALLET;
  if (!merchantWallet) {
    return NextResponse.json(
      { error: "server_not_configured", required: "MERCHANT_WALLET" },
      { status: 503 },
    );
  }
  configuredRoute ??= createPremiumRoute(merchantWallet);
  return configuredRoute(request);
}
