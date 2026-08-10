import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://meterkit.juanchi.dev",
  ),
  title: {
    default: "MeterKit — USDC payments for APIs",
    template: "%s | MeterKit",
  },
  description: "Monetize APIs and MCP tools with USDC on Solana.",
  applicationName: "MeterKit",
  keywords: ["x402", "Solana", "USDC", "API payments", "MCP payments"],
  openGraph: {
    title: "MeterKit — USDC payments for APIs",
    description: "Monetize APIs and MCP tools with USDC on Solana.",
    type: "website",
    url: "/",
  },
  alternates: { canonical: "/" },
};

export default function Layout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <a className="skipLink" href="#main-content">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
