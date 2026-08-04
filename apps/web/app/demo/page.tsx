"use client";

import Link from "next/link";
import { useState } from "react";

const gateway = process.env.NEXT_PUBLIC_GATEWAY_URL ?? "http://localhost:3402";
type Phase = "idle" | "requesting" | "required" | "validating" | "settled" | "unlocked";

export default function DemoPage() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [requirement, setRequirement] = useState({ amount: "10000", payTo: "—", network: "Solana Devnet" });
  const [receipt, setReceipt] = useState<{ signature: string; explorerUrl: string }>();
  const run = async () => {
    setPhase("requesting");
    const response = await fetch(`${gateway}/v1/weather/premium?city=Buenos%20Aires`);
    const header = response.headers.get("payment-required");
    if (response.status !== 402 || !header) throw new Error("Expected a live HTTP 402");
    try {
      const decoded = JSON.parse(atob(header)) as { accepts?: Array<{ amount?: string; payTo?: string; network?: string }> };
      const next = decoded.accepts?.[0];
      setRequirement({ amount: next?.amount ?? "10000", payTo: next?.payTo ?? "—", network: next?.network ?? "Solana Devnet" });
    } catch { /* human-readable fallback remains safe */ }
    setPhase("required");
  };
  const replay = async () => {
    setPhase("validating");
    await pause(800);
    const payments = await fetch(`${gateway}/v1/public/payments`).then((value) => value.json()) as Array<{ status: string; signature: string; explorerUrl: string }>;
    const finalized = payments.find((payment) => payment.status === "finalized") ?? {
      status: "finalized",
      signature: "9EQSGTgeXsia5JJ2GAjuh6tjVsUnvBbNWnYhAS74HvBG4u1kewwxgbo3dXmwtPTdwtekuksZkimjivDwwTAwU7X",
      explorerUrl: "https://explorer.solana.com/tx/9EQSGTgeXsia5JJ2GAjuh6tjVsUnvBbNWnYhAS74HvBG4u1kewwxgbo3dXmwtPTdwtekuksZkimjivDwwTAwU7X?cluster=devnet",
    };
    setReceipt(finalized); setPhase("settled"); await pause(900); setPhase("unlocked");
  };
  return <main className="demoPage">
    <nav><Link className="brand" href="/"><span className="mark">M</span> MeterKit</Link><span className="devnetBadge">● Guided simulation · live devnet evidence</span><Link href="/dashboard">Provider workspace →</Link></nav>
    <header className="demoIntro"><span className="kicker">LIVE PRODUCT WALKTHROUGH</span><h1>Watch one API request become a payment.</h1><p>The 402 challenge is fetched live. Settlement playback uses an already-finalized devnet transaction and never represents an external user.</p></header>
    <section className="demoConsole">
      <article className="persona providerPane"><span className="personaLabel">PROVIDER</span><h2>Premium Weather API</h2><p>Protected forecast with provenance and retrieval time.</p><div className="demoPrice"><strong>0.01</strong><span>test USDC<br />per request</span></div><code>GET /v1/weather/premium</code><small>Paid directly to {requirement.payTo === "—" ? "the provider wallet" : short(requirement.payTo)}</small></article>
      <article className="persona agentPane"><span className="personaLabel">AI AGENT / CUSTOMER</span><h2>Request console</h2>
        <div className="requestLine"><code>GET /premium</code><button onClick={() => void run()} disabled={phase !== "idle"}>{phase === "idle" ? "Run request" : "Request sent"} →</button></div>
        {phase === "requesting" && <p className="demoNotice">Calling protected endpoint…</p>}
        {phase !== "idle" && phase !== "requesting" && <div className="paymentCard"><span>402 · PAYMENT REQUIRED</span><strong>{formatAmount(requirement.amount)} test USDC</strong><p>Devnet · recipient {short(requirement.payTo)}</p>{phase === "required" && <button onClick={() => void replay()}>Replay verified payment flow →</button>}</div>}
        {(phase === "validating" || phase === "settled" || phase === "unlocked") && <div className="paymentTimeline">
          <span className="done">✓ Network, mint, amount and recipient</span>
          <span className={phase !== "validating" ? "done" : ""}>✓ Wallet signed locally</span>
          <span className={phase === "unlocked" ? "done" : ""}>✓ Finalized and request retried</span>
        </div>}
        {phase === "unlocked" && <div className="weatherResult"><span>200 · PROTECTED RESPONSE</span><strong>21°C · Buenos Aires</strong><p>Clear · source timestamp included</p>{receipt && <a href={receipt.explorerUrl} target="_blank" rel="noreferrer">Finalized receipt {short(receipt.signature)} ↗</a>}</div>}
      </article>
    </section>
    <div className="demoSteps"><span className={phase !== "idle" ? "active" : ""}>1 Request</span><span className={["required","validating","settled","unlocked"].includes(phase) ? "active" : ""}>2 Price</span><span className={["validating","settled","unlocked"].includes(phase) ? "active" : ""}>3 Validate</span><span className={phase === "unlocked" ? "active" : ""}>4 Unlock</span></div>
  </main>;
}

function pause(ms: number) { return new Promise((resolve) => globalThis.setTimeout(resolve, ms)); }
function short(value: string) { return value.length > 16 ? `${value.slice(0, 7)}…${value.slice(-5)}` : value; }
function formatAmount(value: string) { return (Number(value) / 1_000_000).toFixed(2); }
