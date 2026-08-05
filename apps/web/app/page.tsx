"use client";

import Link from "next/link";
import { PaymentFlowVisual } from "./payment-flow-visual";
import { localeLabels, locales, type Locale } from "./locale";
import { MobileProductLinks } from "./product-links";
import { useLocale } from "./use-locale";

const copy = {
  en: {
    products: "Product", demo: "Live demo", pilots: "Pilots", docs: "Docs", dashboard: "Provider workspace",
    eyebrow: "OPEN SOURCE · NON-CUSTODIAL · SOLANA",
    title: <>Turn an API call into<br /><em>a direct USDC payment.</em></>,
    intro: "Add pay-per-request to an API or MCP tool in minutes. The customer pays your wallet directly; MeterKit never holds the funds.",
    run: "Run the live demo →", github: "View on GitHub",
    proof: ["Direct to your wallet", "No account or card", "Verifiable on Solana"],
    outcome: "ONE REQUEST. ONE PAYMENT. ONE RECEIPT.",
    outcomeTitle: "The payment is part of the request.",
    outcomeBody: "The agent receives a price, validates its policy, pays exact test USDC and retries. Your service returns the protected result only after settlement.",
    provider: "Provider", publish: "Publish an endpoint", price: "Set 0.01 USDC per request",
    agent: "AI agent", request: "Call the protected API", policy: "Validate price and recipient",
    chain: "Solana", settle: "Settle directly", receipt: "Finalize a public receipt",
    sdk: "Developer first", sdkTitle: "Protect the route. Keep your stack.",
    sdkBody: "MeterKit is middleware, not a custody layer. Keep your API, wallet and customer relationship.",
    openWorkspace: "Open provider workspace",
    footer: "USDC commerce infrastructure for APIs and agents.",
  },
  es: {
    products: "Producto", demo: "Demo en vivo", pilots: "Pilotos", docs: "Docs", dashboard: "Workspace del proveedor",
    eyebrow: "OPEN SOURCE · NO CUSTODIAL · SOLANA",
    title: <>Convierte una llamada API en<br /><em>un pago directo en USDC.</em></>,
    intro: "Agrega cobro por solicitud a una API o herramienta MCP en minutos. El cliente paga directamente a tu wallet; MeterKit nunca recibe los fondos.",
    run: "Ejecutar demo en vivo →", github: "Ver en GitHub",
    proof: ["Directo a tu wallet", "Sin cuenta ni tarjeta", "Verificable en Solana"],
    outcome: "UNA SOLICITUD. UN PAGO. UN RECIBO.",
    outcomeTitle: "El pago forma parte de la solicitud.",
    outcomeBody: "El agente recibe el precio, valida su política, paga USDC de prueba exacto y reintenta. Tu servicio entrega el resultado sólo después de liquidar.",
    provider: "Proveedor", publish: "Publica un endpoint", price: "Fija 0,01 USDC por solicitud",
    agent: "Agente de IA", request: "Llama a la API protegida", policy: "Valida precio y destinatario",
    chain: "Solana", settle: "Liquida directamente", receipt: "Finaliza un recibo público",
    sdk: "Para desarrolladores", sdkTitle: "Protege la ruta. Conserva tu stack.",
    sdkBody: "MeterKit es middleware, no una capa de custodia. Conserva tu API, wallet y relación con el cliente.",
    openWorkspace: "Abrir workspace del proveedor",
    footer: "Infraestructura comercial en USDC para APIs y agentes.",
  },
  "pt-BR": {
    products: "Produto", demo: "Demo ao vivo", pilots: "Pilotos", docs: "Docs", dashboard: "Workspace do provedor",
    eyebrow: "OPEN SOURCE · SEM CUSTÓDIA · SOLANA",
    title: <>Transforme uma chamada de API em<br /><em>um pagamento direto em USDC.</em></>,
    intro: "Adicione cobrança por requisição a uma API ou ferramenta MCP em minutos. O cliente paga diretamente à sua carteira; MeterKit nunca recebe os fundos.",
    run: "Executar demo ao vivo →", github: "Ver no GitHub",
    proof: ["Direto para sua carteira", "Sem conta ou cartão", "Verificável na Solana"],
    outcome: "UMA REQUISIÇÃO. UM PAGAMENTO. UM RECIBO.",
    outcomeTitle: "O pagamento faz parte da requisição.",
    outcomeBody: "O agente recebe o preço, valida sua política, paga o USDC de teste exato e tenta novamente. Seu serviço entrega o resultado somente após a liquidação.",
    provider: "Provedor", publish: "Publique um endpoint", price: "Defina 0,01 USDC por requisição",
    agent: "Agente de IA", request: "Chame a API protegida", policy: "Valide preço e destinatário",
    chain: "Solana", settle: "Liquide diretamente", receipt: "Finalize um recibo público",
    sdk: "Para desenvolvedores", sdkTitle: "Proteja a rota. Mantenha seu stack.",
    sdkBody: "MeterKit é middleware, não uma camada de custódia. Mantenha sua API, carteira e relação com o cliente.",
    openWorkspace: "Abrir workspace do provedor",
    footer: "Infraestrutura comercial em USDC para APIs e agentes.",
  },
} as const;

export default function Home() {
  const [locale, setLocale] = useLocale();
  const text = copy[locale];

  return <main id="main-content">
    <MarketingNav locale={locale} setLocale={setLocale} text={text} />
    <section className="newHero">
      <div className="newHeroCopy">
        <span className="eyebrow">{text.eyebrow}</span>
        <h1>{text.title}</h1>
        <p>{text.intro}</p>
        <div className="actions">
          <Link className="primary" href="/demo">{text.run}</Link>
          <a className="secondary" href="https://github.com/JuanTorchia/meterkit" target="_blank" rel="noreferrer">{text.github}</a>
        </div>
        <div className="proof">{text.proof.map((item) => <span key={item}>✓ {item}</span>)}</div>
      </div>
      <PaymentFlowVisual locale={locale} />
    </section>

    <section className="productStory" id="product">
      <span className="kicker">{text.outcome}</span>
      <div className="storyHeading"><h2>{text.outcomeTitle}</h2><p>{text.outcomeBody}</p></div>
      <div className="roleGrid">
        <article><span>01 · {text.provider}</span><h3>{text.publish}</h3><p>{text.price}</p></article>
        <article><span>02 · {text.agent}</span><h3>{text.request}</h3><p>{text.policy}</p></article>
        <article><span>03 · {text.chain}</span><h3>{text.settle}</h3><p>{text.receipt}</p></article>
      </div>
    </section>

    <section className="codeSection compactCode" id="docs">
      <div><span className="kicker">{text.sdk}</span><h2>{text.sdkTitle}</h2><p>{text.sdkBody}</p><Link className="darkLink" href="/dashboard">{text.openWorkspace} →</Link></div>
      <pre><span>import</span> {"{ createX402Middleware }"} <span>from</span> <b>&quot;@meterkit/sdk&quot;</b>;{"\n\n"}app.get(<b>&quot;/premium&quot;</b>, createX402Middleware({"{\n  "}price: <b>&quot;$0.01&quot;</b>,{"\n  "}payTo: providerWallet{"\n}"}), handler);</pre>
    </section>
    <footer><span className="brand"><span className="mark">M</span> MeterKit</span><span>{text.footer}</span><span>Apache-2.0 · Devnet · No token</span></footer>
  </main>;
}

function MarketingNav({ locale, setLocale, text }: {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  text: (typeof copy)[Locale];
}) {
  return <nav className="marketingNav">
    <Link className="brand" href="/"><span className="mark">M</span> MeterKit</Link>
    <div className="navlinks"><a href="#product">{text.products}</a><Link href="/demo">{text.demo}</Link><Link href="/pilots">{text.pilots}</Link><a href="#docs">{text.docs}</a></div>
    <div className="navActions">
      <div className="localeSwitch" aria-label="Language">
        {locales.map((option) => <button key={option} className={locale === option ? "active" : ""} aria-pressed={locale === option} aria-label={localeLabels[option]} onClick={() => setLocale(option)}>{option === "pt-BR" ? "PT" : option.toUpperCase()}</button>)}
      </div>
      <Link className="wallet navWorkspace" href="/dashboard"><span className="dot" /> {text.dashboard}</Link>
    </div>
    <MobileProductLinks locale={locale} />
  </nav>;
}
