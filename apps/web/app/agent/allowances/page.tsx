"use client";

import Link from "next/link";
import { useState } from "react";
import {
  AllowancePanel,
  authenticateWallet,
  type ConnectedWallet,
  WalletButton,
} from "../../dashboard-client";
import { localeLabels, locales } from "../../locale";
import { MobileProductLinks } from "../../product-links";
import { useLocale } from "../../use-locale";

const copy = {
  en: {
    badge: "Payer control · Solana Devnet",
    dashboard: "Provider workspace →",
    kicker: "AGENT / PAYER CONTROL",
    title: "Your authorization stays yours.",
    intro:
      "Connect the payer wallet to create, inspect or revoke a bounded allowance. MeterKit never receives your seed phrase or private key.",
  },
  es: {
    badge: "Control del pagador · Solana Devnet",
    dashboard: "Panel del proveedor →",
    kicker: "CONTROL DEL AGENTE / PAGADOR",
    title: "Tu autorización sigue siendo tuya.",
    intro:
      "Conecta la wallet pagadora para crear, consultar o revocar una allowance limitada. MeterKit nunca recibe tu seed phrase ni tu clave privada.",
  },
  "pt-BR": {
    badge: "Controle do pagador · Solana Devnet",
    dashboard: "Painel do provedor →",
    kicker: "CONTROLE DO AGENTE / PAGADOR",
    title: "Sua autorização continua sendo sua.",
    intro:
      "Conecte a carteira pagadora para criar, consultar ou revogar uma allowance limitada. A MeterKit nunca recebe sua seed phrase ou chave privada.",
  },
} as const;

export default function AgentAllowancesPage() {
  const [locale, setLocale] = useLocale();
  const [connection, setConnection] = useState<ConnectedWallet>();
  const [sessionToken, setSessionToken] = useState<string>();
  const [error, setError] = useState<string>();
  const text = copy[locale];

  return (
    <main className="workspacePage payerPage" id="main-content">
      <nav className="workspaceNav">
        <Link className="brand" href="/">
          <span className="mark" aria-hidden="true">
            MK
          </span>{" "}
          MeterKit
        </Link>
        <span className="devnetBadge">● {text.badge}</span>
        <div className="navActions">
          <Link href="/dashboard">{text.dashboard}</Link>
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
      <header className="workspaceIntro">
        <h1>{text.title}</h1>
        <p>{text.intro}</p>
        <WalletButton
          locale={locale}
          onConnect={(connected) => {
            setConnection(connected);
            void authenticateWallet(connected, locale)
              .then(setSessionToken)
              .catch((cause: unknown) =>
                setError(
                  cause instanceof Error
                    ? cause.message
                    : "Authentication failed",
                ),
              );
          }}
        />
        {error && (
          <p className="errorBanner" role="alert">
            {error}
          </p>
        )}
      </header>
      <AllowancePanel
        connection={connection}
        sessionToken={sessionToken}
        locale={locale}
      />
    </main>
  );
}
