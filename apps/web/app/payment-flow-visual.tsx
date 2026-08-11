"use client";

import { useEffect, useState } from "react";
import type { Locale } from "./locale";

const labels = {
  en: {
    run: "Run request",
    running: "Running…",
    again: "Run again",
    agent: "AI agent",
    api: "Provider API",
    request: "GET /weather",
    required: "402 · 0.01 USDC",
    paid: "USDC direct to provider",
    response: "200 · Weather unlocked",
    meterkit: "Policy, verification & receipt",
    devnet: "LIVE PRODUCT FLOW · DEVNET SIMULATION",
  },
  es: {
    run: "Ejecutar solicitud",
    running: "Ejecutando…",
    again: "Repetir",
    agent: "Agente IA",
    api: "API proveedora",
    request: "GET /weather",
    required: "402 · 0,01 USDC",
    paid: "USDC directo al proveedor",
    response: "200 · Clima desbloqueado",
    meterkit: "Política, verificación y recibo",
    devnet: "FLUJO DEL PRODUCTO · SIMULACIÓN DEVNET",
  },
  "pt-BR": {
    run: "Executar requisição",
    running: "Executando…",
    again: "Executar novamente",
    agent: "Agente IA",
    api: "API provedora",
    request: "GET /weather",
    required: "402 · 0,01 USDC",
    paid: "USDC direto ao provedor",
    response: "200 · Clima desbloqueado",
    meterkit: "Política, verificação e recibo",
    devnet: "FLUXO DO PRODUTO · SIMULAÇÃO DEVNET",
  },
} as const;

export function PaymentFlowVisual({ locale }: { locale: Locale }) {
  const [step, setStep] = useState(0);
  const text = labels[locale];
  useEffect(() => {
    if (step === 0 || step >= 4) return;
    const timer = globalThis.setTimeout(
      () => setStep((value) => value + 1),
      850,
    );
    return () => globalThis.clearTimeout(timer);
  }, [step]);
  return (
    <div className="flowVisual" role="region" aria-label={text.devnet}>
      <div className="flowHeader">
        <span>
          <i className="dot" /> {text.devnet}
        </span>
        <strong>0.01 USDC</strong>
      </div>
      <div className="flowStage">
        <div className="flowNode agentNode">
          <svg className="nodeIcon" viewBox="0 0 16 16" aria-hidden="true">
            <circle cx="8" cy="8" r="4.25" />
            <path d="M8 0v3.2M8 12.8V16M0 8h3.2M12.8 8H16" />
          </svg>
          <small>{text.agent}</small>
          <strong>Scout-01</strong>
        </div>
        <div className="flowRail" aria-hidden="true">
          <i className={`packet requestPacket step-${step}`} />
          <i className={`packet paymentPacket step-${step}`} />
          <i className={`packet responsePacket step-${step}`} />
        </div>
        <div className="flowNode apiNode">
          <svg className="nodeIcon" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M4.5 1.5h-3v13h3M11.5 1.5h3v13h-3M8 5.25v5.5" />
          </svg>
          <small>{text.api}</small>
          <strong>Premium Weather</strong>
        </div>
      </div>
      <div className="flowEvents" aria-live="polite">
        <div className={step >= 1 ? "done" : ""}>
          <span>1</span>
          <p>{text.request}</p>
        </div>
        <div className={step >= 2 ? "done" : ""}>
          <span>2</span>
          <p>{text.required}</p>
        </div>
        <div className={step >= 3 ? "done" : ""}>
          <span>3</span>
          <p>{text.paid}</p>
        </div>
        <div className={step >= 4 ? "done" : ""}>
          <span>4</span>
          <p>{text.response}</p>
        </div>
      </div>
      <div className="flowFooter">
        <span>
          <b className="mark">MK</b> {text.meterkit}
        </span>
        <button onClick={() => setStep(1)} disabled={step > 0 && step < 4}>
          {step === 0 ? text.run : step < 4 ? text.running : text.again} →
        </button>
      </div>
    </div>
  );
}
