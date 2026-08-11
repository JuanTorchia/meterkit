"use client";

import { useState } from "react";
import type { Locale } from "../locale";

const gateway = process.env.NEXT_PUBLIC_GATEWAY_URL ?? "http://localhost:3402";

type Check = {
  name: string;
  ok: boolean;
  error?: string;
  // The verifier marks a policy check it could not evaluate with
  // `enforced: false`, which is how the hosted report tells "your endpoint is
  // wrong" apart from "we were not given a policy to compare against".
  evidence?: { enforced?: boolean } & Record<string, unknown>;
};

type Report = {
  passed: boolean;
  checkedAt: string;
  endpoint: string;
  checks: Check[];
  requirement?: {
    network: string;
    mint: string;
    amountAtomic: string;
    recipient: string;
    scheme: string;
  };
  notice: string;
};

const copy = {
  en: {
    label: "Endpoint to verify",
    placeholder: "https://your-api.example/premium",
    run: "Verify readiness",
    running: "Verifying…",
    again: "Verify another",
    heading: "Protocol readiness certificate",
    unenforced: "Not evaluated without a policy",
    unenforcedBody:
      "These compare the challenge against limits you decide: which network, mint and recipient you accept, and the most you will pay. The command line check below takes a policy file and evaluates them.",
    passed: "Ready",
    failed: "Not ready",
    checked: "Checked",
    endpoint: "Instrument",
    terms: "Terms read from the challenge",
    network: "Network",
    mint: "Mint",
    amount: "Amount",
    recipient: "Recipient",
    scheme: "Scheme",
    invalid: "That is not a URL the verifier can read. Use a full https URL.",
    limited:
      "Too many verifications from this address. The check makes a real request to your endpoint, so it is limited to six per minute. Wait a minute and try again.",
    unreachable:
      "The verifier could not complete. Your endpoint may be slow or offline; try again, or run the CLI below against it.",
    unavailable:
      "The hosted verifier is not answering right now. This is on our side, not your endpoint. The command line check below runs the same verification locally.",
  },
  es: {
    label: "Endpoint a verificar",
    placeholder: "https://tu-api.example/premium",
    run: "Verificar preparación",
    running: "Verificando…",
    again: "Verificar otro",
    heading: "Certificado de preparación de protocolo",
    unenforced: "No evaluado sin una política",
    unenforcedBody:
      "Estos comparan el desafío contra límites que definís vos: qué red, mint y destinatario aceptás, y cuánto es lo máximo que pagás. El chequeo de línea de comandos de abajo toma un archivo de política y los evalúa.",
    passed: "Listo",
    failed: "No listo",
    checked: "Verificado",
    endpoint: "Instrumento",
    terms: "Términos leídos del desafío",
    network: "Red",
    mint: "Mint",
    amount: "Monto",
    recipient: "Destinatario",
    scheme: "Esquema",
    invalid:
      "El verificador no puede leer esa URL. Usá una URL https completa.",
    limited:
      "Demasiadas verificaciones desde esta dirección. El chequeo hace una request real a tu endpoint, así que está limitado a seis por minuto. Esperá un minuto y reintentá.",
    unreachable:
      "El verificador no pudo completar. Tu endpoint puede estar lento o caído; reintentá, o corré el CLI de abajo contra él.",
    unavailable:
      "El verificador hospedado no está respondiendo. Esto es de nuestro lado, no de tu endpoint. El chequeo de línea de comandos de abajo corre la misma verificación localmente.",
  },
  "pt-BR": {
    label: "Endpoint a verificar",
    placeholder: "https://sua-api.example/premium",
    run: "Verificar prontidão",
    running: "Verificando…",
    again: "Verificar outro",
    heading: "Certificado de prontidão de protocolo",
    unenforced: "Não avaliado sem uma política",
    unenforcedBody:
      "Estes comparam o desafio com limites que você define: qual rede, mint e destinatário aceita, e o máximo que paga. A checagem de linha de comando abaixo recebe um arquivo de política e os avalia.",
    passed: "Pronto",
    failed: "Não pronto",
    checked: "Verificado",
    endpoint: "Instrumento",
    terms: "Termos lidos do desafio",
    network: "Rede",
    mint: "Mint",
    amount: "Valor",
    recipient: "Destinatário",
    scheme: "Esquema",
    invalid:
      "O verificador não consegue ler essa URL. Use uma URL https completa.",
    limited:
      "Verificações demais deste endereço. A checagem faz uma requisição real ao seu endpoint, então é limitada a seis por minuto. Aguarde um minuto e tente de novo.",
    unreachable:
      "O verificador não conseguiu concluir. Seu endpoint pode estar lento ou fora do ar; tente de novo, ou rode o CLI abaixo contra ele.",
    unavailable:
      "O verificador hospedado não está respondendo. Isso é do nosso lado, não do seu endpoint. A checagem de linha de comando abaixo roda a mesma verificação localmente.",
  },
} as const;

export function ReadinessCheck({ locale }: { locale: Locale }) {
  const text = copy[locale];
  const [endpoint, setEndpoint] = useState("");
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const run = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setReport(null);
    try {
      const response = await fetch(`${gateway}/v1/pilot/verify`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ endpoint }),
      });
      if (response.status === 400) throw new Error(text.invalid);
      if (response.status === 429) throw new Error(text.limited);
      // A 404 or 5xx here is our gateway, not the endpoint under test. Saying
      // "your endpoint may be offline" would blame the provider for our fault.
      if (response.status === 404 || response.status >= 500)
        throw new Error(text.unavailable);
      if (!response.ok) throw new Error(text.unreachable);
      setReport((await response.json()) as Report);
    } catch (cause) {
      // A thrown TypeError is the browser refusing the request itself: the
      // gateway is unreachable or the origin is not allowed, both ours.
      setError(
        cause instanceof TypeError
          ? text.unavailable
          : cause instanceof Error && cause.message.length < 400
            ? cause.message
            : text.unreachable,
      );
    } finally {
      setBusy(false);
    }
  };

  // A check the verifier could not evaluate is not a failure of the endpoint,
  // so it must not drag the certificate to "not ready".
  const evaluated =
    report?.checks.filter((check) => check.evidence?.enforced !== false) ?? [];
  const unevaluated =
    report?.checks.filter((check) => check.evidence?.enforced === false) ?? [];
  const protocolPassed = evaluated.every((check) => check.ok);

  return (
    <div className="readiness">
      <form className="readinessForm" onSubmit={run}>
        <label htmlFor="readiness-endpoint">{text.label}</label>
        <div className="readinessRow">
          <input
            id="readiness-endpoint"
            type="url"
            required
            value={endpoint}
            placeholder={text.placeholder}
            onChange={(event) => setEndpoint(event.target.value)}
          />
          <button type="submit" disabled={busy || !endpoint}>
            {busy ? text.running : report ? text.again : text.run}
          </button>
        </div>
      </form>

      {error ? (
        <p className="errorBanner" role="alert">
          {error}
        </p>
      ) : null}

      {report ? (
        <div className="readinessReport" aria-live="polite">
          <div className="readinessHead">
            <span className="label">{text.heading}</span>
            <span
              className="seal"
              data-state={protocolPassed ? "finalized" : "failed"}
            >
              {protocolPassed ? text.passed : text.failed}
            </span>
          </div>

          <dl className="docsRecord">
            <div>
              <dt>{text.endpoint}</dt>
              <dd>{report.endpoint}</dd>
            </div>
            <div>
              <dt>{text.checked}</dt>
              <dd>{new Date(report.checkedAt).toISOString()}</dd>
            </div>
          </dl>

          <ol className="paymentTimeline">
            {evaluated.map((check) => (
              <li
                key={check.name}
                className={check.ok ? "done" : "failedCheck"}
              >
                {check.name}
                {check.error ? <em> — {check.error}</em> : null}
              </li>
            ))}
          </ol>

          {unevaluated.length ? (
            <div className="readinessUnenforced">
              <span className="label">{text.unenforced}</span>
              <ol className="paymentTimeline">
                {unevaluated.map((check) => (
                  <li key={check.name}>{check.name}</li>
                ))}
              </ol>
              <p>{text.unenforcedBody}</p>
            </div>
          ) : null}

          {report.requirement ? (
            <>
              <span className="label">{text.terms}</span>
              <dl className="docsRecord">
                <div>
                  <dt>{text.amount}</dt>
                  <dd>{report.requirement.amountAtomic}</dd>
                </div>
                <div>
                  <dt>{text.network}</dt>
                  <dd>{report.requirement.network}</dd>
                </div>
                <div>
                  <dt>{text.recipient}</dt>
                  <dd>{report.requirement.recipient}</dd>
                </div>
                <div>
                  <dt>{text.scheme}</dt>
                  <dd>{report.requirement.scheme}</dd>
                </div>
              </dl>
            </>
          ) : null}

          <p className="readinessNotice">{report.notice}</p>
        </div>
      ) : null}
    </div>
  );
}
