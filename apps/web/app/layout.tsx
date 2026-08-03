import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "MeterKit — USDC payments for APIs",
  description: "Monetiza APIs y herramientas MCP con USDC sobre Solana.",
};

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body>{children}</body></html>;
}
