"use client";

import { useEffect, useState } from "react";
import type { Locale } from "./locale";

const gateway = process.env.NEXT_PUBLIC_GATEWAY_URL ?? "http://localhost:3402";

type PublicPayment = {
  id: string;
  amountAtomic: string | number;
  network: string;
  signature: string;
  settledAt: string;
  status: string;
  explorerUrl: string;
};

type Reading = {
  finalized: number;
  unconfirmed: number;
  usdc: number;
  latest: PublicPayment | null;
};

const copy = {
  en: {
    heading: "Settled on devnet",
    unit: "requests",
    unconfirmed: "unconfirmed",
    volume: "Test USDC settled",
    latest: "Last settlement",
    custody: "Held by MeterKit",
    none: "none, ever",
    reading: "Reading gateway…",
    offline:
      "Gateway unreachable. The counter shows nothing rather than a guess.",
    pending: "awaiting first settlement",
  },
  es: {
    heading: "Liquidado en devnet",
    unit: "requests",
    unconfirmed: "sin confirmar",
    volume: "USDC de prueba liquidado",
    latest: "Última liquidación",
    custody: "En poder de MeterKit",
    none: "nada, nunca",
    reading: "Leyendo el gateway…",
    offline:
      "Gateway inalcanzable. El contador no muestra nada en vez de una estimación.",
    pending: "esperando la primera liquidación",
  },
  "pt-BR": {
    heading: "Liquidado na devnet",
    unit: "requests",
    unconfirmed: "não confirmados",
    volume: "USDC de teste liquidado",
    latest: "Última liquidação",
    custody: "Em poder da MeterKit",
    none: "nada, nunca",
    reading: "Lendo o gateway…",
    offline:
      "Gateway inacessível. O contador não mostra nada em vez de uma estimativa.",
    pending: "aguardando a primeira liquidação",
  },
} as const;

function Wheels({ value, pad }: { value: number; pad: number }) {
  const digits = String(Math.max(0, Math.floor(value))).padStart(pad, "0");
  return (
    <span className="wheels" aria-hidden="true">
      {digits.split("").map((digit, index) => (
        <span className="wheel" key={`${index}-${digits.length}`}>
          <span
            className="wheelStrip"
            style={{ "--digit": Number(digit) } as React.CSSProperties}
          >
            {Array.from({ length: 10 }, (_, n) => (
              <span key={n}>{n}</span>
            ))}
          </span>
        </span>
      ))}
    </span>
  );
}

export function LiveTotalizer({
  locale,
  actions,
}: {
  locale: Locale;
  actions?: React.ReactNode;
}) {
  const text = copy[locale];
  const [reading, setReading] = useState<Reading | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function read() {
      try {
        const response = await fetch(`${gateway}/v1/public/payments`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("gateway_error");
        const payments: PublicPayment[] = await response.json();
        const settled = payments.filter((item) => item.status !== "failed");
        const finalized = settled.filter(
          (item) => item.status === "finalized",
        ).length;
        const usdc =
          settled.reduce(
            (total, item) => total + Number(item.amountAtomic),
            0,
          ) / 1_000_000;
        const latest = settled.reduce<PublicPayment | null>(
          (newest, item) =>
            !newest || item.settledAt > newest.settledAt ? item : newest,
          null,
        );
        setReading({
          finalized,
          unconfirmed: settled.length - finalized,
          usdc,
          latest,
        });
        setFailed(false);
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
        setFailed(true);
      }
    }

    void read();
    const timer = setInterval(read, 15_000);
    return () => {
      controller.abort();
      clearInterval(timer);
    };
  }, []);

  return (
    <div className="totalizer">
      <div className="totalizerHead">
        <span className="label">{text.heading}</span>
        <span className="label">devnet · usdc</span>
      </div>

      {/* The instrument reads its measurement, its uncertainty and its
          primary action on one baseline. */}
      <div className="totalizerBaseline">
        <div className="totalizerValue">
          <Wheels value={reading?.finalized ?? 0} pad={5} />
          <span className="totalizerUnit">{text.unit}</span>
          <span className="totalizerPm">
            ± {reading?.unconfirmed ?? 0}
            <em>{text.unconfirmed}</em>
          </span>
        </div>
        {actions}
      </div>

      <span className="srStatus" role="status">
        {failed
          ? text.offline
          : reading
            ? `${reading.finalized} ${text.unit}, ± ${reading.unconfirmed} ${text.unconfirmed}`
            : text.reading}
      </span>

      <div className="toleranceBand totalizerBand" aria-hidden="true" />

      <div className="totalizerMeta">
        <div>
          <span className="label">{text.volume}</span>
          <b className="num">{reading ? reading.usdc.toFixed(6) : "—"}</b>
        </div>
        <div>
          <span className="label">{text.custody}</span>
          <b>{text.none}</b>
        </div>
        <div>
          <span className="label">{text.latest}</span>
          {reading?.latest ? (
            <a
              className="totalizerTrace"
              href={reading.latest.explorerUrl}
              target="_blank"
              rel="noreferrer"
            >
              {reading.latest.signature.slice(0, 8)}…
              {reading.latest.signature.slice(-6)} ↗
            </a>
          ) : (
            <b>{failed ? "—" : text.pending}</b>
          )}
        </div>
      </div>

      {failed ? <p className="totalizerOffline">{text.offline}</p> : null}
    </div>
  );
}
