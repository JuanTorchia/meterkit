import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verifiable x402 devnet demo",
  description:
    "Inspect a live HTTP 402 challenge and its clearly identified historical Solana devnet receipt.",
  alternates: { canonical: "/demo" },
  openGraph: {
    title: "Verifiable x402 devnet demo | MeterKit",
    description:
      "Inspect a live HTTP 402 challenge and its clearly identified historical Solana devnet receipt.",
    type: "website",
    url: "/demo",
  },
};

export default function DemoLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
