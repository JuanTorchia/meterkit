import { SOLANA_DEVNET, type Product } from "@usemeterkit/sdk";

export function premiumProduct(wallet: string): Product {
  return {
    id: "next-premium",
    name: "Next Premium API",
    description: "A protected Next.js route response",
    resource: "http://localhost:3000/api/premium",
    priceAtomic: "10000",
    assetMint: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
    payTo: wallet,
    network: SOLANA_DEVNET,
  };
}
