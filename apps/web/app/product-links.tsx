import Link from "next/link";
import type { Locale } from "./locale";

const labels = {
  en: { demo: "Demo", pilots: "Pilots", provider: "Provider", payer: "Payer", scout: "MCP Scout" },
  es: { demo: "Demo", pilots: "Pilotos", provider: "Proveedor", payer: "Pagador", scout: "MCP Scout" },
  "pt-BR": { demo: "Demo", pilots: "Pilotos", provider: "Provedor", payer: "Pagador", scout: "MCP Scout" },
} as const;

export function MobileProductLinks({ locale }: { locale: Locale }) {
  const text = labels[locale];
  return <div className="mobileProductNav" role="navigation" aria-label="Product areas">
    <Link href="/demo">{text.demo}</Link>
    <Link href="/pilots">{text.pilots}</Link>
    <Link href="/dashboard">{text.provider}</Link>
    <Link href="/agent/allowances">{text.payer}</Link>
    <a href="https://github.com/JuanTorchia/meterkit/tree/main/examples/mcp-scout"
      target="_blank" rel="noreferrer">{text.scout} ↗</a>
  </div>;
}
