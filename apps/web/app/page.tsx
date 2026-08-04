"use client";

import { useState } from "react";
import { DashboardClient } from "./dashboard-client";

const copy = {
  en: {
    products: "Products", payments: "Payments", open: "Open dashboard",
    title: <>Your API should<br /><em>charge by itself.</em></>,
    intro: "Connect a wallet, set a price, and accept USDC per request or subscription. No accounts, cards, or custody.",
    create: "Create a product →", integration: "View integration",
    proof: ["✓ Direct settlement", "✓ Verifiable receipts", "✓ Native x402"],
    kicker: "THREE LINES", codeTitle: <>Protect your endpoint.<br />Keep building.</>,
    codeBody: "MeterKit returns 402, validates payment, and serves the content. You stay in control and receive USDC directly.",
  },
  es: {
    products: "Productos", payments: "Pagos", open: "Abrir dashboard",
    title: <>Tu API merece<br /><em>cobrar por sí sola.</em></>,
    intro: "Conecta una wallet, fija un precio y acepta USDC por solicitud o suscripción. Sin cuentas, tarjetas ni custodia.",
    create: "Crear un producto →", integration: "Ver integración",
    proof: ["✓ Liquidación directa", "✓ Recibos verificables", "✓ x402 nativo"],
    kicker: "TRES LÍNEAS", codeTitle: <>Protege tu endpoint.<br />Sigue construyendo.</>,
    codeBody: "MeterKit responde 402, valida el pago y entrega el contenido. Tú conservas el control y recibes USDC directamente.",
  },
} as const;

export default function Home() {
  const [locale, setLocale] = useState<"en" | "es">("en");
  const text = copy[locale];
  return (
    <main>
      <nav>
        <a className="brand" href="#"><span className="mark">M</span> MeterKit</a>
        <div className="navlinks"><a href="#products">{text.products}</a><a href="#payments">{text.payments}</a><a href="#docs">Docs</a></div>
        <div className="navActions">
          <div className="localeSwitch" aria-label="Language">
            <button className={locale === "en" ? "active" : ""} onClick={() => setLocale("en")}>EN</button>
            <button className={locale === "es" ? "active" : ""} onClick={() => setLocale("es")}>ES</button>
          </div>
          <a className="wallet" href="#products"><span className="dot" /> {text.open}</a>
        </div>
      </nav>

      <section className="hero">
        <div className="eyebrow">OPEN SOURCE · SOLANA DEVNET</div>
        <h1>{text.title}</h1>
        <p>{text.intro}</p>
        <div className="actions"><a className="primary" href="#products">{text.create}</a><a className="secondary" href="#docs">{text.integration}</a></div>
        <div className="proof">{text.proof.map((item) => <span key={item}>{item}</span>)}</div>
      </section>

      <DashboardClient locale={locale} />

      <section className="codeSection" id="docs">
        <div><span className="kicker">{text.kicker}</span><h2>{text.codeTitle}</h2><p>{text.codeBody}</p></div>
        <pre><span>import</span> {"{ createX402Middleware }"} <span>from</span> <b>&quot;@meterkit/sdk&quot;</b>;{"\n\n"}app.get(<b>&quot;/premium&quot;</b>, createX402Middleware({"{\n  "}product, store,{"\n  "}facilitatorUrl: <b>&quot;https://x402.org/facilitator&quot;</b>{"\n}"}), handler);</pre>
      </section>
      <footer><a className="brand" href="#"><span className="mark">M</span> MeterKit</a><span>USDC payments for the agentic web.</span><span>Apache-2.0 · No custody · No token</span></footer>
    </main>
  );
}
