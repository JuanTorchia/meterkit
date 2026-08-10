"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Locale } from "./locale";

const labels = {
  en: {
    demo: "Demo",
    pilots: "Pilots",
    provider: "Provider",
    payer: "Payer",
    scout: "MCP Scout",
  },
  es: {
    demo: "Demo",
    pilots: "Pilotos",
    provider: "Proveedor",
    payer: "Pagador",
    scout: "MCP Scout",
  },
  "pt-BR": {
    demo: "Demo",
    pilots: "Pilotos",
    provider: "Provedor",
    payer: "Pagador",
    scout: "MCP Scout",
  },
} as const;

export function MobileProductLinks({ locale }: { locale: Locale }) {
  const text = labels[locale];
  const pathname = usePathname();
  const areaLabel =
    locale === "en"
      ? "Product areas"
      : locale === "es"
        ? "Áreas del producto"
        : "Áreas do produto";
  const current = (href: string) =>
    pathname === href ? ("page" as const) : undefined;
  return (
    <div className="mobileProductNav" role="navigation" aria-label={areaLabel}>
      <Link href="/demo" aria-current={current("/demo")}>
        {text.demo}
      </Link>
      <Link href="/pilots" aria-current={current("/pilots")}>
        {text.pilots}
      </Link>
      <Link href="/dashboard" aria-current={current("/dashboard")}>
        {text.provider}
      </Link>
      <Link
        href="/agent/allowances"
        aria-current={current("/agent/allowances")}
      >
        {text.payer}
      </Link>
      <a
        href="https://github.com/JuanTorchia/meterkit/tree/main/examples/mcp-scout"
        target="_blank"
        rel="noreferrer"
      >
        {text.scout} ↗
      </a>
    </div>
  );
}
