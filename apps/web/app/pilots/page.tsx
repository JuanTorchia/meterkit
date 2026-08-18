"use client";

import Link from "next/link";
import { useState } from "react";
import { localeLabels, locales } from "../locale";
import { MobileProductLinks } from "../product-links";
import { useLocale } from "../use-locale";
import { ReadinessCheck } from "./readiness-check";
import styles from "./pilots.module.css";

const commands = {
  released:
    "mkdir meterkit-pilot && cd meterkit-pilot\npnpm init\npnpm add @usemeterkit/sdk@0.3.1 express",
  generated:
    "npm create meterkit@0.3.1 -- meterkit-pilot --surface express --package-manager pnpm --recipient <DEVNET_PUBLIC_WALLET> --yes",
  install:
    "git clone https://github.com/JuanTorchia/meterkit.git\ncd meterkit\npnpm install --frozen-lockfile",
  configure: "pnpm pilot:init -- https://your-api.test/premium",
  verify:
    "pnpm pilot:verify -- \\\n  --config meterkit-pilot.json \\\n  --out pilot-report.json",
} as const;
const selfServiceReleaseAvailable =
  process.env.NEXT_PUBLIC_SELF_SERVICE_VERSION === "0.3.1";

const copy = {
  en: {
    badge: "Self-service · Devnet only",
    barWarn: "Devnet only — do not send mainnet assets",
    kicker: "EXTERNAL DEVELOPER PILOT",
    navDemo: "Demo",
    navProvider: "Provider",
    navDocs: "Docs",
    title: "Verify your first paid endpoint without sharing a key.",
    intro:
      "The pilot verifier reads an unpaid HTTP 402, checks your policy and creates a portable JSON report. It never signs, pays or receives wallet secrets.",
    trust: ["READ ONLY", "NO WALLET", "JSON EVIDENCE"],
    prerequisites: "Prerequisites",
    prerequisitesBody:
      "Node.js 22+, pnpm 11 and a test endpoint that returns an x402 challenge. Localhost is supported with an explicit development flag. No wallet is required for readiness.",
    releasePending:
      "The 0.3.1 self-service packages are still a release candidate. Installation commands stay disabled until the exact npm registry matrix passes.",
    offer: "FREE FIVE-PERSON DEVNET BETA",
    offerTitle: "Install and verify one endpoint at no charge.",
    offerBody:
      "Five independent builders can use the devnet beta for free. Participants are not charged and are not paid or compensated to test it. Start from the public initializer and try without a call; optional support is limited to one 45-minute session. Separately, if you ask MeterKit to perform the integration for you, the optional founder setup service costs USD 100. The open-source software never requires that service.",
    offerBoundary:
      "MeterKit never requests wallet keys, mainnet funds, private endpoint URLs or permission to name you. Technical participation, private evidence retention, day-seven follow-up and public attribution are separate choices that you may deny or withdraw.",
    paths: "CHOOSE YOUR STARTING PATH",
    pathsTitle: "Use the public SDK or generate a reviewable project.",
    pathsBody:
      "The 0.3.1 SDK and initializer candidate is devnet-only and generates no wallet keys. Use it only after the exact-version registry gate passes.",
    released: "A · RELEASED SDK",
    releasedTitle: "Add the exact verified 0.3.1 package.",
    generated: "B · GENERATED PROJECT",
    generatedTitle:
      "Generate a reviewable project from the public initializer.",
    readiness: "PHASE A · READINESS",
    readinessTitle: "Check the policy before moving funds.",
    readinessBody:
      "These three steps produce readiness evidence only. They do not count as a completed external pilot.",
    readinessAlso:
      "The same check runs from the command line, where it takes a policy file and writes a portable JSON report you can attach to a pilot.",
    start: "1 · START",
    startTitle: "Clone and install once.",
    configure: "2 · CONFIGURE",
    configureTitle: "Set your endpoint and limits.",
    verify: "3 · VERIFY",
    verifyTitle: "Export readiness evidence.",
    copy: "Copy",
    copied: "Copied",
    copyFailed: "Copy failed",
    checks: "What readiness checks",
    items: [
      "HTTP 402 response",
      "x402 protocol version",
      "Solana network",
      "USDC mint",
      "Maximum amount",
      "Exact recipient",
    ],
    completed: "PHASE B · COMPLETED PILOT",
    completedTitle: "Settle once, inspect the receipt and reject replay.",
    completedBody:
      "Continue with a disposable devnet wallet and test funds only. MeterKit never needs your private key.",
    registerStart: "Register this public pilot start →",
    completedSteps: [
      [
        "Protect a test endpoint",
        "Use the middleware on non-sensitive test data.",
      ],
      [
        "Settle test USDC",
        "Pay on devnet and confirm the protected response unlocks.",
      ],
      [
        "Inspect public evidence",
        "Open the finalized transaction in Solana Explorer.",
      ],
      [
        "Reject proof reuse",
        "Replay the same payment proof and confirm it fails closed.",
      ],
    ],
    startReadiness: "Start readiness check →",
    continue: "Continue to complete the pilot →",
    report: "Submit completed pilot report →",
    github: "Open full quickstart ↗",
    publicIssue:
      "The report opens a public GitHub issue and requires a GitHub account.",
    warning:
      "Never include private keys, seed phrases, .env contents, session tokens or mainnet transactions.",
    support: "Need help?",
    supportBody:
      "Open a public support issue before sharing evidence. Maintainer responses and implementation details remain public and auditable.",
    supportLink: "Open a support issue ↗",
    source: "Review source ↗",
    security: "Security policy ↗",
    license: "Apache-2.0 license ↗",
  },
  es: {
    badge: "Autoservicio · Sólo devnet",
    barWarn: "Solo devnet — no envíes activos de mainnet",
    kicker: "PILOTO PARA DESARROLLADORES EXTERNOS",
    navDemo: "Demo",
    navProvider: "Proveedor",
    navDocs: "Docs",
    title: "Verifica tu primer endpoint pago sin compartir claves.",
    intro:
      "El verificador lee un HTTP 402 sin pagar, controla tu política y crea un reporte JSON portable. Nunca firma, paga ni recibe secretos de wallet.",
    trust: ["SÓLO LECTURA", "SIN WALLET", "EVIDENCIA JSON"],
    prerequisites: "Requisitos",
    prerequisitesBody:
      "Node.js 22+, pnpm 11 y un endpoint de prueba que devuelva un desafío x402. Localhost funciona con una opción explícita de desarrollo. La preparación no requiere wallet.",
    releasePending:
      "Los paquetes de autoservicio 0.3.1 todavía son candidatos. Los comandos permanecen deshabilitados hasta pasar la matriz exacta contra npm.",
    offer: "BETA DEVNET GRATUITA PARA CINCO PERSONAS",
    offerTitle: "Instala y verifica un endpoint sin costo.",
    offerBody:
      "Cinco builders independientes pueden usar gratis la beta devnet. No se les cobra ni se les paga o compensa por probarla. Empieza con el inicializador público e intenta hacerlo sin llamada; el soporte opcional se limita a una sesión de 45 minutos. Por separado, si solicitas que MeterKit haga la integración por ti, el servicio opcional de implementación cuesta USD 100. El software open source nunca exige ese servicio.",
    offerBoundary:
      "MeterKit nunca solicita claves de wallet, fondos mainnet, URLs privadas ni permiso para nombrarte. La participación técnica, retención privada, seguimiento al día siete y atribución pública son decisiones separadas que puedes negar o retirar.",
    paths: "ELIGE TU PUNTO DE PARTIDA",
    pathsTitle: "Usa el SDK público o genera un proyecto revisable.",
    pathsBody:
      "El SDK y el inicializador candidato 0.3.1 son sólo devnet y no generan claves. Úsalos después del gate exacto contra el registry.",
    released: "A · SDK PUBLICADO",
    releasedTitle: "Agrega el paquete exacto 0.3.1 verificado.",
    generated: "B · PROYECTO GENERADO",
    generatedTitle:
      "Genera un proyecto revisable con el inicializador público.",
    readiness: "FASE A · PREPARACIÓN",
    readinessTitle: "Verifica la política antes de mover fondos.",
    readinessBody:
      "Estos tres pasos sólo producen evidencia de preparación. No cuentan como piloto externo completado.",
    readinessAlso:
      "El mismo chequeo corre desde la línea de comandos, donde toma un archivo de política y escribe un reporte JSON portable que podés adjuntar a un piloto.",
    start: "1 · INICIO",
    startTitle: "Clona e instala una vez.",
    configure: "2 · CONFIGURA",
    configureTitle: "Define endpoint y límites.",
    verify: "3 · VERIFICA",
    verifyTitle: "Exporta evidencia de preparación.",
    copy: "Copiar",
    copied: "Copiado",
    copyFailed: "No se pudo copiar",
    checks: "Qué verifica la preparación",
    items: [
      "Respuesta HTTP 402",
      "Versión de protocolo x402",
      "Red Solana",
      "Mint USDC",
      "Monto máximo",
      "Destinatario exacto",
    ],
    completed: "FASE B · PILOTO COMPLETADO",
    completedTitle:
      "Liquida una vez, inspecciona el recibo y rechaza el replay.",
    completedBody:
      "Continúa sólo con una wallet descartable de devnet y fondos de prueba. MeterKit nunca necesita tu clave privada.",
    registerStart: "Registrar públicamente el inicio →",
    completedSteps: [
      [
        "Protege un endpoint de prueba",
        "Usa el middleware con datos de prueba no sensibles.",
      ],
      [
        "Liquida USDC de prueba",
        "Paga en devnet y confirma que la respuesta protegida se desbloquea.",
      ],
      [
        "Inspecciona evidencia pública",
        "Abre la transacción finalizada en Solana Explorer.",
      ],
      [
        "Rechaza la reutilización",
        "Repite el mismo comprobante y confirma que falla de forma segura.",
      ],
    ],
    startReadiness: "Comenzar verificación →",
    continue: "Continuar para completar el piloto →",
    report: "Enviar reporte del piloto completado →",
    github: "Abrir guía completa ↗",
    publicIssue:
      "El reporte abre un issue público en GitHub y requiere una cuenta de GitHub.",
    warning:
      "Nunca incluyas claves privadas, seed phrases, contenidos de .env, tokens de sesión ni transacciones de mainnet.",
    support: "¿Necesitas ayuda?",
    supportBody:
      "Abre un issue público de soporte antes de compartir evidencia. Las respuestas y los detalles de implementación permanecen públicos y auditables.",
    supportLink: "Abrir issue de soporte ↗",
    source: "Revisar código ↗",
    security: "Política de seguridad ↗",
    license: "Licencia Apache-2.0 ↗",
  },
  "pt-BR": {
    badge: "Autosserviço · Apenas devnet",
    barWarn: "Somente devnet — não envie ativos da mainnet",
    kicker: "PILOTO PARA DESENVOLVEDORES EXTERNOS",
    navDemo: "Demo",
    navProvider: "Provedor",
    navDocs: "Docs",
    title: "Verifique seu primeiro endpoint pago sem compartilhar chaves.",
    intro:
      "O verificador lê um HTTP 402 sem pagar, confere sua política e cria um relatório JSON portátil. Nunca assina, paga ou recebe segredos da carteira.",
    trust: ["SOMENTE LEITURA", "SEM CARTEIRA", "EVIDÊNCIA JSON"],
    prerequisites: "Pré-requisitos",
    prerequisitesBody:
      "Node.js 22+, pnpm 11 e um endpoint de teste que retorne um desafio x402. Localhost funciona com uma opção explícita de desenvolvimento. A preparação não requer carteira.",
    releasePending:
      "Os pacotes de autosserviço 0.3.1 ainda são candidatos. Os comandos ficam desativados até a matriz exata do npm passar.",
    offer: "BETA DEVNET GRATUITA PARA CINCO PESSOAS",
    offerTitle: "Instale e verifique um endpoint sem custo.",
    offerBody:
      "Cinco builders independentes podem usar gratuitamente a beta devnet. Participantes não pagam e não recebem pagamento ou compensação pelo teste. Comece pelo inicializador público e tente sem chamada; o suporte opcional é limitado a uma sessão de 45 minutos. Separadamente, se você pedir que a MeterKit faça a integração, o serviço opcional custa USD 100. O software open source nunca exige esse serviço.",
    offerBoundary:
      "MeterKit nunca solicita chaves da carteira, fundos mainnet, URLs privadas ou permissão para identificar você. Participação técnica, retenção privada, acompanhamento no dia sete e atribuição pública são escolhas separadas que podem ser negadas ou retiradas.",
    paths: "ESCOLHA SEU PONTO DE PARTIDA",
    pathsTitle: "Use o SDK público ou gere um projeto revisável.",
    pathsBody:
      "O SDK e o inicializador candidato 0.3.1 são apenas devnet e não geram chaves. Use-os após o gate exato no registry.",
    released: "A · SDK PUBLICADO",
    releasedTitle: "Adicione o pacote exato 0.3.1 verificado.",
    generated: "B · PROJETO GERADO",
    generatedTitle: "Gere um projeto revisável com o inicializador público.",
    readiness: "FASE A · PREPARAÇÃO",
    readinessTitle: "Confira a política antes de movimentar fundos.",
    readinessBody:
      "Estas três etapas produzem apenas evidência de preparação. Elas não contam como piloto externo concluído.",
    readinessAlso:
      "A mesma checagem roda pela linha de comando, onde recebe um arquivo de política e escreve um relatório JSON portátil que você pode anexar a um piloto.",
    start: "1 · INÍCIO",
    startTitle: "Clone e instale uma vez.",
    configure: "2 · CONFIGURE",
    configureTitle: "Defina endpoint e limites.",
    verify: "3 · VERIFIQUE",
    verifyTitle: "Exporte evidência de preparação.",
    copy: "Copiar",
    copied: "Copiado",
    copyFailed: "Não foi possível copiar",
    checks: "O que a preparação verifica",
    items: [
      "Resposta HTTP 402",
      "Versão de protocolo x402",
      "Rede Solana",
      "Mint USDC",
      "Valor máximo",
      "Destinatário exato",
    ],
    completed: "FASE B · PILOTO CONCLUÍDO",
    completedTitle: "Liquide uma vez, confira o recibo e rejeite o replay.",
    completedBody:
      "Continue apenas com uma carteira descartável de devnet e fundos de teste. MeterKit nunca precisa da sua chave privada.",
    registerStart: "Registrar publicamente o início →",
    completedSteps: [
      [
        "Proteja um endpoint de teste",
        "Use o middleware com dados de teste não sensíveis.",
      ],
      [
        "Liquide USDC de teste",
        "Pague na devnet e confirme que a resposta protegida é liberada.",
      ],
      [
        "Confira a evidência pública",
        "Abra a transação finalizada no Solana Explorer.",
      ],
      [
        "Rejeite a reutilização",
        "Repita o mesmo comprovante e confirme que ele falha de forma segura.",
      ],
    ],
    startReadiness: "Iniciar verificação →",
    continue: "Continuar para concluir o piloto →",
    report: "Enviar relatório do piloto concluído →",
    github: "Abrir guia completa ↗",
    publicIssue:
      "O relatório abre uma issue pública no GitHub e requer uma conta do GitHub.",
    warning:
      "Nunca inclua chaves privadas, seed phrases, conteúdo de .env, tokens de sessão ou transações de mainnet.",
    support: "Precisa de ajuda?",
    supportBody:
      "Abra uma issue pública de suporte antes de compartilhar evidências. As respostas e os detalhes de implementação permanecem públicos e auditáveis.",
    supportLink: "Abrir issue de suporte ↗",
    source: "Revisar código ↗",
    security: "Política de segurança ↗",
    license: "Licença Apache-2.0 ↗",
  },
} as const;

export default function PilotsPage() {
  const [locale, setLocale] = useLocale();
  const text = copy[locale];

  return (
    <main className="pilotsPage" id="main-content">
      <div className="instrumentBar">
        <span>Solana devnet</span>
        <span>Non-custodial</span>
        <span className="warn pushRight">{text.barWarn}</span>
      </div>
      <nav className="workspaceNav" aria-label="MeterKit">
        <Link className="brand" href="/">
          <span className="mark" aria-hidden="true">
            MK
          </span>{" "}
          MeterKit
        </Link>
        <span className="devnetBadge">{text.badge}</span>
        <div className="navActions">
          <Link href="/demo">{text.navDemo}</Link>
          <Link href="/dashboard">{text.navProvider}</Link>
          <a
            href="https://github.com/JuanTorchia/meterkit/tree/main/docs"
            target="_blank"
            rel="noreferrer"
          >
            {text.navDocs} ↗
          </a>
          <div
            className="localeSwitch"
            role="group"
            aria-label={
              locale === "en"
                ? "Language"
                : locale === "es"
                  ? "Idioma"
                  : "Idioma"
            }
          >
            {locales.map((option) => (
              <button
                key={option}
                className={locale === option ? "active" : ""}
                aria-label={localeLabels[option]}
                aria-pressed={locale === option}
                onClick={() => setLocale(option)}
              >
                {option === "pt-BR" ? "PT" : option.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <MobileProductLinks locale={locale} />
      </nav>

      <header className="pilotHero">
        <h1>{text.title}</h1>
        <p>{text.intro}</p>
        <div className="pilotTrust">
          {text.trust.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
        <a className={`primary ${styles.heroCta}`} href="#readiness">
          {text.startReadiness}
        </a>
      </header>

      <section
        className={styles.prerequisites}
        aria-labelledby="prerequisites-title"
      >
        <h2 id="prerequisites-title">{text.prerequisites}</h2>
        <p>{text.prerequisitesBody}</p>
      </section>

      <section className={styles.offer} aria-labelledby="pilot-offer-title">
        <span>{text.offer}</span>
        <div>
          <h2 id="pilot-offer-title">{text.offerTitle}</h2>
          <p>{text.offerBody}</p>
          <p className={styles.offerBoundary}>{text.offerBoundary}</p>
        </div>
      </section>

      <section
        className={styles.phaseIntro}
        aria-labelledby="starting-path-title"
      >
        <h2 id="starting-path-title">{text.pathsTitle}</h2>
        <p>{text.pathsBody}</p>
        {!selfServiceReleaseAvailable ? (
          <p className="errorBanner" role="status">
            {text.releasePending}
          </p>
        ) : null}
      </section>
      <ol className={`pilotCommands ${styles.commandList}`}>
        <CommandStep
          label={text.released}
          title={text.releasedTitle}
          command={commands.released}
          copyLabel={text.copy}
          copiedLabel={text.copied}
          failedLabel={text.copyFailed}
          disabled={!selfServiceReleaseAvailable}
        />
        <CommandStep
          label={text.generated}
          title={text.generatedTitle}
          command={commands.generated}
          copyLabel={text.copy}
          copiedLabel={text.copied}
          failedLabel={text.copyFailed}
          disabled={!selfServiceReleaseAvailable}
        />
      </ol>

      <section
        id="readiness"
        className={styles.phaseIntro}
        aria-labelledby="readiness-title"
      >
        <h2 id="readiness-title">{text.readinessTitle}</h2>
        <p>{text.readinessBody}</p>
        {/* The hosted check first: the same verification the CLI below runs,
            without asking anyone to clone a repository to get an answer. */}
        <ReadinessCheck locale={locale} />
        <p className="readinessAlso">{text.readinessAlso}</p>
      </section>
      <ol className={`pilotCommands ${styles.commandList}`}>
        <CommandStep
          label={text.start}
          title={text.startTitle}
          command={commands.install}
          copyLabel={text.copy}
          copiedLabel={text.copied}
          failedLabel={text.copyFailed}
        />
        <CommandStep
          label={text.configure}
          title={text.configureTitle}
          command={commands.configure}
          copyLabel={text.copy}
          copiedLabel={text.copied}
          failedLabel={text.copyFailed}
        />
        <CommandStep
          label={text.verify}
          title={text.verifyTitle}
          command={commands.verify}
          copyLabel={text.copy}
          copiedLabel={text.copied}
          failedLabel={text.copyFailed}
        />
      </ol>

      <section
        className={`pilotEvidence ${styles.evidence}`}
        aria-labelledby="checks-title"
      >
        <div>
          <h2 id="checks-title">{text.checks}</h2>
          <ul className={`checkGrid ${styles.checkList}`}>
            {text.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div className="pilotCompletion">
          <h2>{text.completedTitle}</h2>
          <p>{text.completedBody}</p>
          <a
            className={styles.startLink}
            href="https://github.com/JuanTorchia/meterkit/issues/new?template=pilot-start.yml"
            target="_blank"
            rel="noreferrer"
          >
            {text.registerStart}
          </a>
          <ol className={styles.completionList}>
            {text.completedSteps.map(([title, body], index) => (
              <li key={title}>
                <span>{index + 1}</span>
                <div>
                  <strong>{title}</strong>
                  <p>{body}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="actions">
            <a
              className="primary"
              href="https://github.com/JuanTorchia/meterkit/blob/main/docs/pilot-quickstart.md#2-protect-one-developer-owned-test-endpoint"
              target="_blank"
              rel="noreferrer"
            >
              {text.continue}
            </a>
            <a
              className="secondary"
              href="https://github.com/JuanTorchia/meterkit/blob/main/docs/pilot-quickstart.md"
              target="_blank"
              rel="noreferrer"
            >
              {text.github}
            </a>
          </div>
          <div className={styles.reportBox}>
            <p>{text.publicIssue}</p>
            <strong>{text.warning}</strong>
            <a
              className="primary"
              href="https://github.com/JuanTorchia/meterkit/issues/new?template=pilot-report.yml"
              target="_blank"
              rel="noreferrer"
            >
              {text.report}
            </a>
          </div>
        </div>
      </section>

      <aside className={styles.trustPanel} aria-labelledby="support-title">
        <div>
          <h2 id="support-title">{text.support}</h2>
          <p>{text.supportBody}</p>
        </div>
        <div className={styles.trustLinks}>
          <a
            href="https://github.com/JuanTorchia/meterkit/issues/new?title=%5BPilot%20support%5D%20"
            target="_blank"
            rel="noreferrer"
          >
            {text.supportLink}
          </a>
          <a
            href="https://github.com/JuanTorchia/meterkit"
            target="_blank"
            rel="noreferrer"
          >
            {text.source}
          </a>
          <a
            href="https://github.com/JuanTorchia/meterkit/blob/main/docs/security.md"
            target="_blank"
            rel="noreferrer"
          >
            {text.security}
          </a>
          <a
            href="https://github.com/JuanTorchia/meterkit/blob/main/LICENSE"
            target="_blank"
            rel="noreferrer"
          >
            {text.license}
          </a>
        </div>
      </aside>
    </main>
  );
}

function CommandStep({
  label,
  title,
  command,
  copyLabel,
  copiedLabel,
  failedLabel,
  disabled = false,
}: {
  label: string;
  title: string;
  command: string;
  copyLabel: string;
  copiedLabel: string;
  failedLabel: string;
  disabled?: boolean;
}) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">(
    "idle",
  );
  const headingId = `command-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  const copyCommand = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
    globalThis.setTimeout(() => setCopyState("idle"), 1800);
  };
  return (
    <li>
      {/* Register pair, not a stacked label: the marker sits beside the heading
          the way the landing's step register does. A label above a heading is
          an eyebrow however the markup is arranged. */}
      <article aria-labelledby={headingId}>
        <span className="commandMark">{label}</span>
        <h2 id={headingId}>{title}</h2>
        <div className={styles.command}>
          <pre tabIndex={0}>{command}</pre>
          <button
            type="button"
            disabled={disabled}
            onClick={() => void copyCommand()}
            aria-label={`${copyLabel}: ${title}`}
          >
            {copyState === "copied"
              ? copiedLabel
              : copyState === "failed"
                ? failedLabel
                : copyLabel}
          </button>
          <span className={styles.copyStatus} aria-live="polite">
            {copyState === "copied"
              ? copiedLabel
              : copyState === "failed"
                ? failedLabel
                : ""}
          </span>
        </div>
      </article>
    </li>
  );
}
