import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "MeterKit — USDC payments for APIs",
  description: "Monetize APIs and MCP tools with USDC on Solana.",
  applicationName: "MeterKit",
  keywords: ["x402", "Solana", "USDC", "API payments", "MCP payments"],
  openGraph: {
    title: "MeterKit — USDC payments for APIs",
    description: "Monetize APIs and MCP tools with USDC on Solana.",
    type: "website",
  },
};

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
