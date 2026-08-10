"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { localeLabels, locales } from "../locale";
import { MobileProductLinks } from "../product-links";
import { useLocale } from "../use-locale";

const gateway = process.env.NEXT_PUBLIC_GATEWAY_URL ?? "http://localhost:3402";
const expectedProduct = "premium-weather";
const expectedNetwork = "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1";
type Phase =
  | "idle"
  | "requesting"
  | "required"
  | "validating"
  | "settled"
  | "unlocked"
  | "error";
type Requirement = {
  amount: string;
  payTo: string;
  network: string;
  asset: string;
};
type Receipt = {
  productId: string;
  amountAtomic: string;
  network: string;
  status: string;
  signature: string;
  explorerUrl: string;
  settledAt: string;
};

const copy = {
  en: {
    badge: "Guided proof · Solana Devnet",
    workspace: "Provider workspace →",
    kicker: "VERIFIABLE PRODUCT WALKTHROUGH",
    title: "Watch one API request expose its payment terms.",
    intro:
      "The HTTP 402 challenge is fetched live. The settlement section shows a clearly identified, previously finalized synthetic devnet receipt—not a new wallet payment.",
    provider: "PROVIDER",
    description: "Protected forecast with provenance and retrieval time.",
    perRequest: "test USDC\nper request",
    paidTo: "Paid directly to",
    agent: "AI AGENT / CUSTOMER",
    console: "Request console",
    run: "Run live request",
    sent: "Request sent",
    calling: "Calling the protected endpoint…",
    required: "PAYMENT REQUIRED",
    recipient: "recipient",
    proof: "Show matching public receipt →",
    validating: "Loading matching public evidence…",
    checks: [
      "Live 402 fields present; devnet network validated",
      "Previously signed by a synthetic devnet wallet",
      "Finalized receipt matches product, amount and network",
    ],
    responseLabel: "PROTECTED RESPONSE ILLUSTRATION",
    response: "21°C · Buenos Aires",
    responseDetail:
      "Example payload · no request was unlocked in this playback",
    receipt: "Previously finalized receipt",
    reset: "Start again",
    error: "The proof could not be completed.",
    retry: "Retry",
    steps: ["1 Request", "2 Terms", "3 Evidence", "4 Explain"],
  },
  es: {
    badge: "Prueba guiada · Solana Devnet",
    workspace: "Panel del proveedor →",
    kicker: "RECORRIDO VERIFICABLE",
    title: "Mira cómo una solicitud API expone sus condiciones de pago.",
    intro:
      "El desafío HTTP 402 se obtiene en vivo. La liquidación muestra un recibo sintético de devnet previamente finalizado e identificado; no realiza un pago nuevo.",
    provider: "PROVEEDOR",
    description: "Pronóstico protegido con procedencia y fecha de consulta.",
    perRequest: "USDC de prueba\npor solicitud",
    paidTo: "Pago directo a",
    agent: "AGENTE IA / CLIENTE",
    console: "Consola de solicitud",
    run: "Ejecutar solicitud",
    sent: "Solicitud enviada",
    calling: "Consultando el endpoint protegido…",
    required: "PAGO REQUERIDO",
    recipient: "destinatario",
    proof: "Mostrar recibo público coincidente →",
    validating: "Buscando evidencia pública coincidente…",
    checks: [
      "Campos 402 presentes; red devnet validada",
      "Firmado previamente por una wallet sintética de devnet",
      "Recibo finalizado coincide en producto, monto y red",
    ],
    responseLabel: "ILUSTRACIÓN DE RESPUESTA PROTEGIDA",
    response: "21°C · Buenos Aires",
    responseDetail:
      "Payload de ejemplo · este playback no desbloqueó una solicitud",
    receipt: "Recibo previamente finalizado",
    reset: "Comenzar otra vez",
    error: "No se pudo completar la prueba.",
    retry: "Reintentar",
    steps: ["1 Solicitud", "2 Condiciones", "3 Evidencia", "4 Explicación"],
  },
  "pt-BR": {
    badge: "Prova guiada · Solana Devnet",
    workspace: "Painel do provedor →",
    kicker: "DEMONSTRAÇÃO VERIFICÁVEL",
    title: "Veja uma requisição de API expor suas condições de pagamento.",
    intro:
      "O desafio HTTP 402 é obtido ao vivo. A liquidação mostra um recibo sintético de devnet previamente finalizado e identificado; não realiza um novo pagamento.",
    provider: "PROVEDOR",
    description: "Previsão protegida com procedência e data da consulta.",
    perRequest: "USDC de teste\npor requisição",
    paidTo: "Pagamento direto para",
    agent: "AGENTE DE IA / CLIENTE",
    console: "Console da requisição",
    run: "Executar requisição",
    sent: "Requisição enviada",
    calling: "Consultando o endpoint protegido…",
    required: "PAGAMENTO NECESSÁRIO",
    recipient: "destinatário",
    proof: "Mostrar recibo público correspondente →",
    validating: "Buscando evidência pública correspondente…",
    checks: [
      "Campos 402 presentes; rede devnet validada",
      "Assinado anteriormente por uma carteira sintética de devnet",
      "Recibo finalizado corresponde a produto, valor e rede",
    ],
    responseLabel: "ILUSTRAÇÃO DA RESPOSTA PROTEGIDA",
    response: "21°C · Buenos Aires",
    responseDetail:
      "Payload de exemplo · este playback não desbloqueou uma requisição",
    receipt: "Recibo previamente finalizado",
    reset: "Começar novamente",
    error: "Não foi possível completar a prova.",
    retry: "Tentar novamente",
    steps: ["1 Requisição", "2 Condições", "3 Evidência", "4 Explicação"],
  },
} as const;

export default function DemoPage() {
  const [locale, setLocale] = useLocale();
  const [phase, setPhase] = useState<Phase>("idle");
  const [requirement, setRequirement] = useState<Requirement>();
  const [receipt, setReceipt] = useState<Receipt>();
  const [error, setError] = useState("");
  const statusRef = useRef<HTMLDivElement>(null);
  const text = copy[locale];

  const run = async () => {
    setError("");
    setReceipt(undefined);
    setRequirement(undefined);
    setPhase("requesting");
    try {
      const response = await fetchWithTimeout(
        `${gateway}/v1/weather/premium?city=Buenos%20Aires`,
      );
      const header = response.headers.get("payment-required");
      if (response.status !== 402 || !header)
        throw new Error(
          "The endpoint did not return a valid HTTP 402 challenge.",
        );
      const decoded = JSON.parse(atob(header)) as {
        accepts?: Array<{
          amount?: string;
          payTo?: string;
          network?: string;
          asset?: string;
        }>;
      };
      const next = decoded.accepts?.[0];
      if (!next?.amount || !next.payTo || !next.network || !next.asset)
        throw new Error("The payment requirement is incomplete.");
      if (next.network !== expectedNetwork)
        throw new Error("The endpoint returned an unexpected network.");
      setRequirement({
        amount: next.amount,
        payTo: next.payTo,
        network: next.network,
        asset: next.asset,
      });
      setPhase("required");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Gateway unavailable.");
      setPhase("error");
    }
  };

  const showEvidence = async () => {
    if (!requirement) return;
    setError("");
    setPhase("validating");
    try {
      const response = await fetchWithTimeout(`${gateway}/v1/public/payments`);
      if (!response.ok)
        throw new Error(`Receipt index returned HTTP ${response.status}.`);
      const payments = (await response.json()) as Receipt[];
      const finalized = payments.find(
        (payment) =>
          payment.status === "finalized" &&
          payment.productId === expectedProduct &&
          payment.amountAtomic === requirement.amount &&
          payment.network === requirement.network &&
          typeof payment.signature === "string" &&
          typeof payment.explorerUrl === "string",
      );
      if (!finalized)
        throw new Error(
          "No finalized receipt matches this product, amount and network.",
        );
      setReceipt(finalized);
      setPhase("settled");
      await pause(500);
      setPhase("unlocked");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Public receipt evidence is unavailable.",
      );
      setPhase("error");
    }
  };

  const reset = () => {
    setPhase("idle");
    setError("");
    setReceipt(undefined);
    setRequirement(undefined);
  };
  const started = phase !== "idle" && phase !== "requesting";

  return (
    <main className="demoPage" id="main-content">
      <nav className="demoNav">
        <Link className="brand" href="/">
          <span className="mark" aria-hidden="true">
            M
          </span>{" "}
          MeterKit
        </Link>
        <span className="devnetBadge">● {text.badge}</span>
        <div className="navActions">
          <Link className="demoWorkspaceLink" href="/dashboard">
            {text.workspace}
          </Link>
          <div className="localeSwitch" role="group" aria-label="Language">
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
      <header className="demoIntro">
        <span className="kicker">{text.kicker}</span>
        <h1>{text.title}</h1>
        <p>{text.intro}</p>
      </header>
      <section className="demoConsole" aria-label="x402 payment walkthrough">
        <article className="persona providerPane">
          <span className="personaLabel">{text.provider}</span>
          <h2>Premium Weather API</h2>
          <p>{text.description}</p>
          <div className="demoPrice">
            <strong>0.01</strong>
            <span>
              {text.perRequest.split("\n").map((line) => (
                <span key={line}>
                  {line}
                  <br />
                </span>
              ))}
            </span>
          </div>
          <code>GET /v1/weather/premium</code>
          <small>
            {text.paidTo}{" "}
            {requirement ? short(requirement.payTo) : "the provider wallet"}
          </small>
        </article>
        <article className="persona agentPane">
          <span className="personaLabel">{text.agent}</span>
          <h2>{text.console}</h2>
          <div className="requestLine">
            <code>GET /premium</code>
            <button
              onClick={() => void run()}
              disabled={phase === "requesting" || phase === "validating"}
            >
              {phase === "requesting" ? text.sent : text.run} →
            </button>
          </div>
          <div
            className="srStatus"
            role={phase === "error" ? "alert" : "status"}
            aria-live="polite"
            ref={statusRef}
          >
            {phase === "requesting"
              ? text.calling
              : phase === "validating"
                ? text.validating
                : error}
          </div>
          {phase === "requesting" && (
            <p className="demoNotice">{text.calling}</p>
          )}
          {started && requirement && (
            <div className="paymentCard">
              <span>402 · {text.required}</span>
              <strong>{formatAmount(requirement.amount)} test USDC</strong>
              <p>
                Devnet · {text.recipient} {short(requirement.payTo)}
              </p>
              <code>{short(requirement.asset)}</code>
              {phase === "required" && (
                <button onClick={() => void showEvidence()}>
                  {text.proof}
                </button>
              )}
            </div>
          )}
          {phase === "error" && (
            <div className="demoError" role="alert">
              <strong>{text.error}</strong>
              <p>{error}</p>
              <button onClick={() => void run()}>{text.retry} →</button>
            </div>
          )}
          {(phase === "validating" ||
            phase === "settled" ||
            phase === "unlocked") && (
            <ol className="paymentTimeline">
              {text.checks.map((check, index) => (
                <li
                  key={check}
                  className={
                    index === 0 || phase !== "validating" ? "done" : ""
                  }
                >
                  {index === 0 || phase !== "validating" ? "✓" : "…"} {check}
                </li>
              ))}
            </ol>
          )}
          {phase === "unlocked" && receipt && (
            <div className="weatherResult">
              <span>200 · {text.responseLabel}</span>
              <strong>{text.response}</strong>
              <p>{text.responseDetail}</p>
              <a href={receipt.explorerUrl} target="_blank" rel="noreferrer">
                {text.receipt} {short(receipt.signature)} ↗
              </a>
              <small>
                {new Date(receipt.settledAt).toLocaleString(locale)}
              </small>
              <button className="textButton" onClick={reset}>
                {text.reset} ↻
              </button>
            </div>
          )}
        </article>
      </section>
      <div className="demoSteps" aria-label="Progress">
        {text.steps.map((step, index) => (
          <span key={step} className={stepActive(index, phase) ? "active" : ""}>
            {step}
          </span>
        ))}
      </div>
    </main>
  );
}

async function fetchWithTimeout(url: string) {
  return fetch(url, { signal: AbortSignal.timeout(10_000), cache: "no-store" });
}
function stepActive(index: number, phase: Phase) {
  if (phase === "idle" || phase === "error") return false;
  if (index === 0) return true;
  if (index === 1) return !["requesting"].includes(phase);
  if (index === 2) return ["validating", "settled", "unlocked"].includes(phase);
  return phase === "unlocked";
}
function pause(ms: number) {
  return new Promise((resolve) => globalThis.setTimeout(resolve, ms));
}
function short(value: string) {
  return value.length > 18 ? `${value.slice(0, 8)}…${value.slice(-6)}` : value;
}
function formatAmount(value: string) {
  return (Number(value) / 1_000_000).toFixed(2);
}
