import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "External developer pilot",
  description: "Verify an x402 endpoint against an enforced Solana devnet USDC policy, then complete a correlated payment and replay test.",
  alternates: { canonical: "/pilots" },
  openGraph: {
    title: "External developer pilot | MeterKit",
    description: "Verify an x402 endpoint against an enforced Solana devnet USDC policy, then complete a correlated payment and replay test.",
    type: "website",
    url: "/pilots",
  },
};

export default function PilotsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
