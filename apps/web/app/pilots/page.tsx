"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { isLocale, localeLabels, locales, type Locale } from "../locale";
import { MobileProductLinks } from "../product-links";

const copy = {
  en: {
    badge: "Self-service · Devnet only", kicker: "EXTERNAL DEVELOPER PILOT",
    title: "Verify your first paid endpoint without sharing a key.",
    intro: "The pilot verifier reads an unpaid HTTP 402, checks your policy and creates a portable JSON report. It never signs, pays or receives wallet secrets.",
    start: "1 · START", startTitle: "Clone and build once.", configure: "2 · CONFIGURE",
    configureTitle: "Set your endpoint and limits.", verify: "3 · VERIFY", verifyTitle: "Export readiness evidence.",
    checks: "WHAT IT CHECKS", next: "WHAT COUNTS AS A PILOT",
    nextBody: "Readiness is step one. A completed external pilot also settles test USDC on devnet, opens the Explorer receipt and confirms the payment proof cannot be reused.",
    report: "Submit pilot report →", github: "Open quickstart ↗",
    items: ["HTTP 402 response", "x402 v2 challenge", "Solana network", "USDC mint", "Maximum amount", "Exact recipient"],
  },
  es: {
    badge: "Autoservicio · Sólo devnet", kicker: "PILOTO PARA DESARROLLADORES EXTERNOS",
    title: "Verifica tu primer endpoint pago sin compartir claves.",
    intro: "El verificador lee un HTTP 402 sin pagar, controla tu política y crea un reporte JSON portable. Nunca firma, paga ni recibe secretos de wallet.",
    start: "1 · INICIO", startTitle: "Clona y compila una vez.", configure: "2 · CONFIGURA",
    configureTitle: "Define endpoint y límites.", verify: "3 · VERIFICA", verifyTitle: "Exporta evidencia de preparación.",
    checks: "QUÉ VERIFICA", next: "QUÉ CUENTA COMO PILOTO",
    nextBody: "La preparación es el primer paso. Un piloto externo completo también liquida USDC de prueba en devnet, abre el recibo en Explorer y confirma que el comprobante no puede reutilizarse.",
    report: "Enviar reporte de piloto →", github: "Abrir guía rápida ↗",
    items: ["Respuesta HTTP 402", "Desafío x402 v2", "Red Solana", "Mint USDC", "Monto máximo", "Destinatario exacto"],
  },
  "pt-BR": {
    badge: "Autosserviço · Apenas devnet", kicker: "PILOTO PARA DESENVOLVEDORES EXTERNOS",
    title: "Verifique seu primeiro endpoint pago sem compartilhar chaves.",
    intro: "O verificador lê um HTTP 402 sem pagar, confere sua política e cria um relatório JSON portátil. Nunca assina, paga ou recebe segredos da carteira.",
    start: "1 · INÍCIO", startTitle: "Clone e compile uma vez.", configure: "2 · CONFIGURE",
    configureTitle: "Defina endpoint e limites.", verify: "3 · VERIFIQUE", verifyTitle: "Exporte evidência de preparação.",
    checks: "O QUE VERIFICA", next: "O QUE CONTA COMO PILOTO",
    nextBody: "A preparação é o primeiro passo. Um piloto externo completo também liquida USDC de teste na devnet, abre o recibo no Explorer e confirma que o comprovante não pode ser reutilizado.",
    report: "Enviar relatório do piloto →", github: "Abrir guia rápido ↗",
    items: ["Resposta HTTP 402", "Desafio x402 v2", "Rede Solana", "Mint USDC", "Valor máximo", "Destinatário exato"],
  },
} as const;

export default function PilotsPage() {
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

  return <main className="pilotsPage">
    <nav className="workspaceNav">
      <Link className="brand" href="/"><span className="mark" aria-hidden="true">M</span> MeterKit</Link>
      <span className="devnetBadge">● {text.badge}</span>
      <div className="navActions">
        <Link href="/demo">Demo</Link>
        <div className="localeSwitch" role="group" aria-label="Language">{locales.map((option) =>
          <button key={option} className={locale === option ? "active" : ""} aria-label={localeLabels[option]}
            aria-pressed={locale === option} onClick={() => setLocale(option)}>
            {option === "pt-BR" ? "PT" : option.toUpperCase()}
          </button>)}</div>
      </div>
      <MobileProductLinks locale={locale} />
    </nav>
    <header className="pilotHero">
      <span className="kicker">{text.kicker}</span><h1>{text.title}</h1><p>{text.intro}</p>
      <div className="pilotTrust"><span>✓ READ ONLY</span><span>✓ NO WALLET</span><span>✓ JSON EVIDENCE</span></div>
    </header>
    <section className="pilotCommands">
      <article><span>{text.start}</span><h2>{text.startTitle}</h2><pre>git clone https://github.com/JuanTorchia/meterkit{"\n"}cd meterkit{"\n"}pnpm install --frozen-lockfile</pre></article>
      <article><span>{text.configure}</span><h2>{text.configureTitle}</h2><pre>pnpm pilot:init -- \{"\n  "}https://your-api.test/premium</pre></article>
      <article><span>{text.verify}</span><h2>{text.verifyTitle}</h2><pre>pnpm pilot:verify -- \{"\n  "}--config meterkit-pilot.json \{"\n  "}--out pilot-report.json</pre></article>
    </section>
    <section className="pilotEvidence">
      <div><span className="kicker">{text.checks}</span><div className="checkGrid">{text.items.map((item) => <span key={item}>✓ {item}</span>)}</div></div>
      <div className="pilotCompletion"><span className="kicker">{text.next}</span><h2>402 → USDC → receipt → replay rejected</h2><p>{text.nextBody}</p>
        <div className="actions">
          <a className="primary" href="https://github.com/JuanTorchia/meterkit/issues/new?template=pilot-report.yml" target="_blank" rel="noreferrer">{text.report}</a>
          <a className="secondary" href="https://github.com/JuanTorchia/meterkit/blob/main/docs/pilot-quickstart.md" target="_blank" rel="noreferrer">{text.github}</a>
        </div>
      </div>
    </section>
  </main>;
}
