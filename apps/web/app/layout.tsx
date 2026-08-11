import type { Metadata } from "next";
import { Archivo, Public_Sans, Martian_Mono } from "next/font/google";
import "./styles.css";

const display = Archivo({
  subsets: ["latin"],
  variable: "--face-display",
  axes: ["wdth"],
  display: "swap",
});

const body = Public_Sans({
  subsets: ["latin"],
  variable: "--face-body",
  display: "swap",
});

const measure = Martian_Mono({
  subsets: ["latin"],
  variable: "--face-measure",
  display: "swap",
});

const CONTRACT = `<!--
THESIS: A payment is a measurement, and every measurement ships with the
certificate that lets a stranger verify it without trusting us. Refuses the
category hero: dark ground, mesh gradient, one-line snippet, logo wall.
OWN-WORLD: Security-print certificate. Cold stock #EDF1F4, intaglio #1A2E6E as
committed field, cold black #0C1114, seal red #C8321E for out-of-tolerance and
the devnet warning, #C3D2DE tolerance tint. Archivo / Public Sans / Martian
Mono. Ruled registers, tolerance bands, wire seals, graticules, plus-minus
notation. No cards.
STORY: The provider understands a call settles on-chain, believes it because
the page hands over a receipt they can check themselves, and installs the SDK.
FIRST VIEWPORT: Full-bleed intaglio field; the live devnet totalizer at
architectural scale with its plus-minus beside it; a pinned instrument bar
carrying network and the devnet warning; primary action on the totalizer
baseline.
FORM: Certificate of Calibration; candidate 3 of 7; seed fdf10741.
FINISH: unreviewed and undocumented is unfinished; this build ends with the
finish review, the verdict, and DESIGN.md
-->`;

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://meterkit.juanchi.dev",
  ),
  title: {
    default: "MeterKit — USDC payments for APIs",
    template: "%s | MeterKit",
  },
  description: "Monetize APIs and MCP tools with USDC on Solana.",
  applicationName: "MeterKit",
  keywords: ["x402", "Solana", "USDC", "API payments", "MCP payments"],
  openGraph: {
    title: "MeterKit — USDC payments for APIs",
    description: "Monetize APIs and MCP tools with USDC on Solana.",
    type: "website",
    url: "/",
  },
  alternates: { canonical: "/" },
};

export default function Layout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${display.variable} ${body.variable} ${measure.variable}`}
    >
      <body>
        <div
          style={{ display: "contents" }}
          dangerouslySetInnerHTML={{ __html: CONTRACT }}
        />
        <a className="skipLink" href="#main-content">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
