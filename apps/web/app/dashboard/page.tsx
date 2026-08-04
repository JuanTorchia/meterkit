"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DashboardClient } from "../dashboard-client";
import { isLocale, localeLabels, locales, type Locale } from "../locale";

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
  return <main className="workspacePage">
    <nav className="workspaceNav">
      <Link className="brand" href="/"><span className="mark">M</span> MeterKit</Link>
      <span className="devnetBadge">● Simulation · Solana Devnet</span>
      <div className="navActions"><Link href="/demo">Live demo</Link><div className="localeSwitch" aria-label="Language">{locales.map((option) => <button key={option} className={locale === option ? "active" : ""} aria-label={localeLabels[option]} onClick={() => setLocale(option)}>{option === "pt-BR" ? "PT" : option.toUpperCase()}</button>)}</div></div>
    </nav>
    <div className="workspaceIntro"><span className="kicker">PROVIDER WORKSPACE</span><h1>Products, payments and receipts.</h1><p>Connect to manage only the products and payments owned by your wallet. Signing in is free and does not authorize a payment.</p></div>
    <DashboardClient locale={locale} />
  </main>;
}
