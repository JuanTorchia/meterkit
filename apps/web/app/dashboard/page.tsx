"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DashboardClient } from "../dashboard-client";
import { isLocale, localeLabels, locales, type Locale } from "../locale";
import { MobileProductLinks } from "../product-links";

const copy = {
  en: { badge: "Public demo · Solana Devnet", demo: "Live demo", controls: "Payer controls", kicker: "PROVIDER WORKSPACE", title: "Products, payments and receipts.", intro: "Before connecting, this workspace shows public devnet demo data. Connect to manage only the products and payments owned by your wallet. Signing in is free and does not authorize a payment." },
  es: { badge: "Demo pública · Solana Devnet", demo: "Demo en vivo", controls: "Control del pagador", kicker: "PANEL DEL PROVEEDOR", title: "Productos, pagos y recibos.", intro: "Antes de conectar, este panel muestra datos públicos de demostración en devnet. Conecta tu wallet para gestionar únicamente tus productos y pagos. Iniciar sesión es gratis y no autoriza pagos." },
  "pt-BR": { badge: "Demo pública · Solana Devnet", demo: "Demo ao vivo", controls: "Controle do pagador", kicker: "PAINEL DO PROVEDOR", title: "Produtos, pagamentos e recibos.", intro: "Antes de conectar, este painel mostra dados públicos de demonstração na devnet. Conecte sua carteira para gerenciar somente seus produtos e pagamentos. Entrar é grátis e não autoriza pagamentos." },
} as const;

export default function DashboardPage() {
  const [locale, setLocale] = useState<Locale>("en");
  useEffect(() => {
    const saved = localStorage.getItem("meterkit-locale");
    if (isLocale(saved)) setLocale(saved);
  }, []);
  useEffect(() => {
    document.documentElement.lang = locale;
    localStorage.setItem("meterkit-locale", locale);
  }, [locale]);
  const text = copy[locale];
  return <main className="workspacePage">
    <nav className="workspaceNav">
      <Link className="brand" href="/"><span className="mark" aria-hidden="true">M</span> MeterKit</Link>
      <span className="devnetBadge">● {text.badge}</span>
      <div className="navActions"><Link href="/demo">{text.demo}</Link><Link href="/agent/allowances">{text.controls}</Link><div className="localeSwitch" role="group" aria-label="Language">{locales.map((option) => <button key={option} className={locale === option ? "active" : ""} aria-label={localeLabels[option]} aria-pressed={locale === option} onClick={() => setLocale(option)}>{option === "pt-BR" ? "PT" : option.toUpperCase()}</button>)}</div></div>
      <MobileProductLinks locale={locale} />
    </nav>
    <div className="workspaceIntro"><span className="kicker">{text.kicker}</span><h1>{text.title}</h1><p>{text.intro}</p></div>
    <DashboardClient locale={locale} />
  </main>;
}
