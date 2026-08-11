"use client";

import Link from "next/link";
import { PaymentFlowVisual } from "./payment-flow-visual";
import { LiveTotalizer } from "./live-totalizer";
import { PriceGraticule } from "./price-graticule";
import { localeLabels, locales, type Locale } from "./locale";
import { MobileProductLinks } from "./product-links";
import { useLocale } from "./use-locale";

const copy = {
  en: {
    products: "Product",
    demo: "Live demo",
    pilots: "Pilots",
    docs: "Docs",
    dashboard: "Provider workspace",
    barNetwork: "Solana devnet",
    barCustody: "Non-custodial",
    barWarn: "Devnet only — do not send mainnet assets",
    title: (
      <>
        Every request is metered, settled,
        <br />
        <em>and certified on Solana.</em>
      </>
    ),
    intro:
      "Price an API or MCP tool per request. The customer pays your wallet directly, and every payment finalizes as a receipt anyone can check in an explorer. MeterKit never holds the funds.",
    install: "Install the SDK →",
    run: "Run the live demo",
    github: "View on GitHub",
    proof: [
      "Settles directly to your wallet",
      "No account, no card, no merchant review",
      "Apache-2.0, and the packages are on npm",
    ],
    outcomeTitle: "The payment is part of the request.",
    outcomeBody:
      "x402 turns an ordinary HTTP exchange into a metered one. Your service answers a price instead of a refusal, the client settles it, and the retry returns the protected result. Five steps, all of them on the wire.",
    steps: [
      {
        actor: "Provider",
        title: "Publish a priced endpoint",
        body: "Wrap the route in middleware and set the price. 0.01 USDC per request in the public demo.",
      },
      {
        actor: "Client",
        title: "Call it and receive HTTP 402",
        body: "The refusal carries the price, the recipient wallet and the network, so nothing is negotiated out of band.",
      },
      {
        actor: "Client",
        title: "Check the terms against its policy",
        body: "An autonomous client compares price and recipient to a bounded, revocable allowance before it spends anything.",
      },
      {
        actor: "Solana",
        title: "Settle the exact amount",
        body: "Payment goes wallet to wallet. MeterKit holds nothing at any point in the exchange.",
      },
      {
        actor: "Provider",
        title: "Return the result and the receipt",
        body: "The retry succeeds and the settlement finalizes as a signature a third party can verify without trusting us.",
      },
    ],
    sdkTitle: "Protect the route. Keep your stack.",
    sdkBody:
      "MeterKit is middleware, not a custody layer. Your API, your wallet, your customer relationship. Two published packages and one line around the handler.",
    releaseNote:
      "@usemeterkit/core and @usemeterkit/sdk are published at 0.1.0. The initializer, subscriptions and the pilot CLI are workspace candidates and are not on npm yet.",
    openWorkspace: "Open provider workspace",
    footer: "USDC commerce infrastructure for APIs and agents.",
  },
  es: {
    products: "Producto",
    demo: "Demo en vivo",
    pilots: "Pilotos",
    docs: "Docs",
    dashboard: "Workspace del proveedor",
    barNetwork: "Solana devnet",
    barCustody: "No custodial",
    barWarn: "Solo devnet — no envíes activos de mainnet",
    title: (
      <>
        Cada request se mide, se liquida
        <br />
        <em>y se certifica en Solana.</em>
      </>
    ),
    intro:
      "Ponele precio por request a una API o herramienta MCP. El cliente paga directo a tu wallet y cada pago finaliza como un recibo que cualquiera puede comprobar en un explorer. MeterKit nunca recibe los fondos.",
    install: "Instalar el SDK →",
    run: "Ejecutar demo en vivo",
    github: "Ver en GitHub",
    proof: [
      "Liquida directo a tu wallet",
      "Sin cuenta, sin tarjeta, sin revisión de comercio",
      "Apache-2.0, y los paquetes están en npm",
    ],
    outcomeTitle: "El pago forma parte de la solicitud.",
    outcomeBody:
      "x402 convierte un intercambio HTTP común en uno medido. Tu servicio responde un precio en vez de un rechazo, el cliente lo liquida y el reintento devuelve el resultado protegido. Cinco pasos, todos sobre el cable.",
    steps: [
      {
        actor: "Proveedor",
        title: "Publica un endpoint con precio",
        body: "Envolvés la ruta en el middleware y fijás el precio. 0,01 USDC por request en la demo pública.",
      },
      {
        actor: "Cliente",
        title: "Llama y recibe HTTP 402",
        body: "El rechazo lleva el precio, la wallet destinataria y la red, así no se negocia nada por fuera.",
      },
      {
        actor: "Cliente",
        title: "Compara los términos con su política",
        body: "Un cliente autónomo contrasta precio y destinatario contra un presupuesto acotado y revocable antes de gastar.",
      },
      {
        actor: "Solana",
        title: "Liquida el monto exacto",
        body: "El pago va de wallet a wallet. MeterKit no retiene nada en ningún punto del intercambio.",
      },
      {
        actor: "Proveedor",
        title: "Devuelve el resultado y el recibo",
        body: "El reintento funciona y la liquidación finaliza como una firma que un tercero puede verificar sin confiar en nosotros.",
      },
    ],
    sdkTitle: "Protege la ruta. Conserva tu stack.",
    sdkBody:
      "MeterKit es middleware, no una capa de custodia. Tu API, tu wallet, tu relación con el cliente. Dos paquetes publicados y una línea alrededor del handler.",
    releaseNote:
      "@usemeterkit/core y @usemeterkit/sdk están publicados en 0.1.0. El inicializador, las suscripciones y el CLI de pilotos son candidatos del workspace y todavía no están en npm.",
    openWorkspace: "Abrir workspace del proveedor",
    footer: "Infraestructura comercial en USDC para APIs y agentes.",
  },
  "pt-BR": {
    products: "Produto",
    demo: "Demo ao vivo",
    pilots: "Pilotos",
    docs: "Docs",
    dashboard: "Workspace do provedor",
    barNetwork: "Solana devnet",
    barCustody: "Sem custódia",
    barWarn: "Somente devnet — não envie ativos da mainnet",
    title: (
      <>
        Cada requisição é medida, liquidada
        <br />
        <em>e certificada na Solana.</em>
      </>
    ),
    intro:
      "Defina um preço por requisição para uma API ou ferramenta MCP. O cliente paga direto na sua carteira e cada pagamento finaliza como um recibo que qualquer pessoa pode conferir em um explorer. A MeterKit nunca recebe os fundos.",
    install: "Instalar o SDK →",
    run: "Executar demo ao vivo",
    github: "Ver no GitHub",
    proof: [
      "Liquida direto na sua carteira",
      "Sem conta, sem cartão, sem análise de lojista",
      "Apache-2.0, e os pacotes estão no npm",
    ],
    outcomeTitle: "O pagamento faz parte da requisição.",
    outcomeBody:
      "O x402 transforma uma troca HTTP comum em uma troca medida. Seu serviço responde um preço em vez de uma recusa, o cliente liquida e a nova tentativa devolve o resultado protegido. Cinco passos, todos no fio.",
    steps: [
      {
        actor: "Provedor",
        title: "Publique um endpoint com preço",
        body: "Envolva a rota no middleware e defina o preço. 0,01 USDC por requisição na demo pública.",
      },
      {
        actor: "Cliente",
        title: "Chama e recebe HTTP 402",
        body: "A recusa carrega o preço, a carteira destinatária e a rede, então nada é negociado por fora.",
      },
      {
        actor: "Cliente",
        title: "Confere os termos com sua política",
        body: "Um cliente autônomo compara preço e destinatário com um limite acotado e revogável antes de gastar.",
      },
      {
        actor: "Solana",
        title: "Liquida o valor exato",
        body: "O pagamento vai de carteira a carteira. A MeterKit não retém nada em nenhum ponto da troca.",
      },
      {
        actor: "Provedor",
        title: "Devolve o resultado e o recibo",
        body: "A nova tentativa funciona e a liquidação finaliza como uma assinatura que um terceiro pode verificar sem confiar em nós.",
      },
    ],
    sdkTitle: "Proteja a rota. Mantenha seu stack.",
    sdkBody:
      "MeterKit é middleware, não uma camada de custódia. Sua API, sua carteira, sua relação com o cliente. Dois pacotes publicados e uma linha ao redor do handler.",
    releaseNote:
      "@usemeterkit/core e @usemeterkit/sdk estão publicados em 0.1.0. O inicializador, as assinaturas e o CLI de pilotos são candidatos do workspace e ainda não estão no npm.",
    openWorkspace: "Abrir workspace do provedor",
    footer: "Infraestrutura comercial em USDC para APIs e agentes.",
  },
} as const;

export default function Home() {
  const [locale, setLocale] = useLocale();
  const text = copy[locale];

  return (
    <main id="main-content">
      <div className="instrumentBar">
        <span>{text.barNetwork}</span>
        <span>{text.barCustody}</span>
        <span className="warn pushRight">{text.barWarn}</span>
      </div>

      <MarketingNav locale={locale} setLocale={setLocale} text={text} />

      <section className="newHero">
        <div className="newHeroCopy">
          <h1>{text.title}</h1>
          <p>{text.intro}</p>
        </div>

        <PriceGraticule locale={locale} />

        <LiveTotalizer
          locale={locale}
          actions={
            <div className="actions">
              <a
                className="primary"
                href="https://github.com/JuanTorchia/meterkit/blob/main/docs/sdk-quickstart.md"
                target="_blank"
                rel="noreferrer"
              >
                {text.install}
              </a>
              <Link className="secondary" href="/demo">
                {text.run}
              </Link>
            </div>
          }
        />

        <div className="heroFoot">
          <div className="proof">
            {text.proof.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
          <a
            className="sourceLink"
            href="https://github.com/JuanTorchia/meterkit"
            target="_blank"
            rel="noreferrer"
          >
            {text.github} ↗
          </a>
        </div>
      </section>

      <section className="productStory" id="product">
        <div className="storyHeading">
          <h2>{text.outcomeTitle}</h2>
          <p>{text.outcomeBody}</p>
        </div>
        <ol className="roleGrid">
          {text.steps.map((step, index) => (
            <li key={step.title}>
              <span>
                {String(index + 1).padStart(2, "0")} · {step.actor}
              </span>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </li>
          ))}
        </ol>
        <PaymentFlowVisual locale={locale} />
      </section>

      <section className="codeSection compactCode" id="docs">
        <div>
          <h2>{text.sdkTitle}</h2>
          <p>{text.sdkBody}</p>
          <p className="releaseNote">{text.releaseNote}</p>
          <Link className="darkLink" href="/dashboard">
            {text.openWorkspace} →
          </Link>
        </div>
        <pre tabIndex={0}>
          <span>import</span> {"{ createX402Middleware }"} <span>from</span>{" "}
          <b>&quot;@usemeterkit/sdk&quot;</b>;{"\n\n"}app.get(
          <b>&quot;/premium&quot;</b>, createX402Middleware({"{\n  "}product,
          store{"\n}"}), handler);
        </pre>
      </section>

      <footer>
        <span className="brand">
          <span className="mark">MK</span> MeterKit
        </span>
        <span>{text.footer}</span>
        <span>Apache-2.0 · Devnet · No token</span>
      </footer>
    </main>
  );
}

function MarketingNav({
  locale,
  setLocale,
  text,
}: {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  text: (typeof copy)[Locale];
}) {
  return (
    <nav className="marketingNav">
      <Link className="brand" href="/">
        <span className="mark">MK</span> MeterKit
      </Link>
      <div className="navlinks">
        <a href="#product">{text.products}</a>
        <Link href="/demo">{text.demo}</Link>
        <Link href="/pilots">{text.pilots}</Link>
        <Link href={`/${locale === "es" ? "es" : "en"}/docs`}>{text.docs}</Link>
      </div>
      <div className="navActions">
        <div className="localeSwitch" role="group" aria-label="Language">
          {locales.map((option) => (
            <button
              key={option}
              className={locale === option ? "active" : ""}
              aria-pressed={locale === option}
              aria-label={localeLabels[option]}
              onClick={() => setLocale(option)}
            >
              {option === "pt-BR" ? "PT" : option.toUpperCase()}
            </button>
          ))}
        </div>
        <Link className="wallet navWorkspace" href="/dashboard">
          <span className="dot" /> {text.dashboard}
        </Link>
      </div>
      <MobileProductLinks locale={locale} />
    </nav>
  );
}
