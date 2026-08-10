import { Buffer } from "node:buffer";
import { mkdir, rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { chromium } from "@playwright/test";
import process from "node:process";

const gatewayUrl =
  process.env.METERKIT_GATEWAY_URL ?? "https://meterkit-api.juanchi.dev";
const speed = Number(process.env.DEMO_SPEED ?? 1);
if (!Number.isFinite(speed) || speed <= 0 || speed > 2)
  throw new Error("DEMO_SPEED must be > 0 and <= 2");

const challengeResponse = await globalThis.fetch(
  `${gatewayUrl}/v1/weather/premium?city=Buenos%20Aires`,
  {
    signal: globalThis.AbortSignal.timeout(15_000),
  },
);
if (challengeResponse.status !== 402)
  throw new Error(`Expected HTTP 402, received ${challengeResponse.status}`);
const header = challengeResponse.headers.get("payment-required");
if (!header) throw new Error("PAYMENT-REQUIRED header missing");
const challenge = JSON.parse(Buffer.from(header, "base64").toString("utf8"));
const requirement = challenge.accepts?.[0];
if (
  !requirement?.network ||
  !requirement.asset ||
  !requirement.amount ||
  !requirement.payTo
) {
  throw new Error("Incomplete x402 requirement");
}

const paymentsResponse = await globalThis.fetch(
  `${gatewayUrl}/v1/public/payments`,
  {
    signal: globalThis.AbortSignal.timeout(15_000),
  },
);
if (!paymentsResponse.ok)
  throw new Error(`Public receipts returned ${paymentsResponse.status}`);
const payments = await paymentsResponse.json();
const receipts = payments.filter((payment) => payment?.status === "finalized");
if (receipts.length < 1)
  throw new Error("No finalized public receipt available");
const receipt = receipts[0];

const rawDir = "artifacts/institutional-raw";
const output = "artifacts/meterkit-institutional-75s.mp4";
await rm(rawDir, { recursive: true, force: true });
await mkdir(rawDir, { recursive: true });

const browser = await chromium.launch();
let rawVideo;
try {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: { dir: rawDir, size: { width: 1280, height: 720 } },
  });
  const page = await context.newPage();
  const video = page.video();
  await page.setContent(filmShell(), { waitUntil: "load" });

  await play(
    page,
    "opening",
    {
      eyebrow: "OPEN SOURCE · SOLANA · NON-CUSTODIAL",
      title: "Software should be able\nto pay for software.",
      body: "MeterKit turns an API request into a direct USDC payment.",
      footer: "No account. No card. No custody.",
    },
    7,
  );

  await play(
    page,
    "request",
    {
      eyebrow: "01 · THE REQUEST",
      title: "The price travels\nwith the API call.",
      body: "An agent asks for a protected resource. The endpoint answers with payment terms.",
      endpoint: "GET /v1/weather/premium",
    },
    8,
  );

  await play(
    page,
    "challenge",
    {
      eyebrow: "02 · LIVE X402 CHALLENGE",
      title: "HTTP 402.\nMachine-readable.",
      body: "Fetched from the public MeterKit gateway while this film was rendered.",
      network: "SOLANA DEVNET",
      amount: `${formatAtomic(requirement.amount)} TEST USDC`,
      mint: short(requirement.asset, 28),
      recipient: short(requirement.payTo, 28),
    },
    10,
  );

  await play(
    page,
    "settlement",
    {
      eyebrow: "03 · DIRECT SETTLEMENT",
      title: "Client to provider.\nMeterKit never holds funds.",
      body: "The agent validates network, mint, amount and recipient before its wallet signs locally.",
    },
    9,
  );

  await play(
    page,
    "receipt",
    {
      eyebrow: "04 · VERIFIABLE PROOF",
      title: "Finalized on Solana.",
      body: "A previously finalized synthetic devnet receipt, independently verifiable in Explorer.",
      signature: short(receipt.signature, 46),
      amount: `${formatAtomic(receipt.amountAtomic)} USDC`,
      slot: "FINALIZED",
    },
    9,
  );

  await play(
    page,
    "workspace",
    {
      eyebrow: "05 · PROVIDER WORKSPACE",
      title: "Products, payments\nand receipts.",
      body: "Configure a price. See settled activity. Keep ownership of the customer and wallet.",
      receipts: String(receipts.length),
      volume: `${formatAtomic(receipts.reduce((sum, item) => sum + Number(item.amountAtomic), 0))} USDC`,
    },
    8,
  );

  await play(
    page,
    "agents",
    {
      eyebrow: "06 · BOUNDED AGENTS",
      title: "Useful tools.\nControlled spending.",
      body: "Allowances cap amount and expiration. Solana Project Scout adds a free preview, then charges 0.02 test USDC for a sourced report.",
    },
    9,
  );

  await play(
    page,
    "closing",
    {
      eyebrow: "METERKIT",
      title: "Charge software\nfor valuable work.",
      body: "x402 · subscriptions · allowances · MCP",
      footer: "Open source. No token. No custody.",
    },
    8,
  );

  await context.close();
  rawVideo = await video.path();
} finally {
  await browser.close();
}

if (!rawVideo) throw new Error("Playwright did not create a video");
const conversion = spawnSync(
  "ffmpeg",
  [
    "-y",
    "-i",
    rawVideo,
    "-c:v",
    "libx264",
    "-preset",
    "medium",
    "-crf",
    "20",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    "-an",
    output,
  ],
  { encoding: "utf8" },
);
if (conversion.status !== 0)
  throw new Error(`ffmpeg failed: ${conversion.stderr.slice(-1200)}`);
await rm(rawDir, { recursive: true, force: true });

process.stdout.write(
  `${JSON.stringify(
    {
      kind: "meterkit-institutional-film",
      generatedAt: new Date().toISOString(),
      output,
      source: { gatewayUrl, challengeStatus: challengeResponse.status },
      evidence: {
        finalizedReceipts: receipts.length,
        signature: receipt.signature,
        externalUsersRepresented: 0,
        newPaymentCreated: false,
      },
      plannedSeconds: 68 * speed,
      audio: false,
    },
    null,
    2,
  )}\n`,
);

async function play(page, scene, data, seconds) {
  await page.evaluate(
    ({ nextScene, nextData }) => {
      const root = globalThis.document.querySelector("#film");
      if (!root) return;
      root.classList.add("leaving");
      globalThis.setTimeout(() => {
        root.className = `film scene-${nextScene}`;
        root.innerHTML = renderScene(nextScene, nextData);
        globalThis.requestAnimationFrame(() => root.classList.add("entered"));
      }, 280);

      function escape(value) {
        return String(value ?? "").replace(
          /[&<>"']/g,
          (character) =>
            ({
              "&": "&amp;",
              "<": "&lt;",
              ">": "&gt;",
              '"': "&quot;",
              "'": "&#039;",
            })[character],
        );
      }
      function lines(value) {
        return escape(value).replaceAll("\n", "<br>");
      }
      function common(d) {
        return `<div class="top"><div class="logo"><b>M</b><span>MeterKit</span></div><span class="eyebrow">${escape(d.eyebrow)}</span><span class="counter">USDC / SOLANA</span></div>`;
      }
      function copy(d) {
        return `<section class="copy"><h1>${lines(d.title)}</h1><p>${escape(d.body)}</p></section>`;
      }
      function renderScene(name, d) {
        const head = common(d);
        if (name === "opening" || name === "closing")
          return `${head}${copy(d)}
        <div class="orb"><i></i><i></i><i></i><strong>USDC</strong></div>
        <div class="bottomLine">${escape(d.footer)}</div>`;
        if (name === "request")
          return `${head}${copy(d)}
        <div class="requestCard"><span>AI AGENT</span><code>${escape(d.endpoint)}</code><b>REQUEST →</b></div>
        <div class="routeLine"><i></i><i></i><i></i></div>`;
        if (name === "challenge")
          return `${head}${copy(d)}
        <div class="challengeCard">
          <div class="status"><b>402</b><span>PAYMENT REQUIRED</span></div>
          <dl><div><dt>NETWORK</dt><dd>${escape(d.network)}</dd></div><div><dt>AMOUNT</dt><dd>${escape(d.amount)}</dd></div>
          <div><dt>MINT</dt><dd>${escape(d.mint)}</dd></div><div><dt>RECIPIENT</dt><dd>${escape(d.recipient)}</dd></div></dl>
        </div><span class="liveBadge">● LIVE REQUIREMENT</span>`;
        if (name === "settlement")
          return `${head}${copy(d)}
        <div class="settlementFlow"><article><i>01</i><b>AGENT</b><small>policy validated</small></article>
        <div class="transfer"><span>0.01 USDC</span><i></i></div>
        <article><i>02</i><b>PROVIDER</b><small>paid directly</small></article></div>
        <div class="noCustody">METERKIT <b>≠</b> WALLET</div>`;
        if (name === "receipt")
          return `${head}${copy(d)}
        <div class="receiptCard"><div class="receiptHead"><span>SOLANA EXPLORER</span><b>✓ ${escape(d.slot)}</b></div>
        <strong>${escape(d.amount)}</strong><code>${escape(d.signature)}</code>
        <div class="receiptMeta"><span>NETWORK<br><b>DEVNET</b></span><span>CUSTODY<br><b>DIRECT</b></span><span>PROOF<br><b>PUBLIC</b></span></div></div>`;
        if (name === "workspace")
          return `${head}${copy(d)}
        <div class="metrics"><article><span>SETTLED VOLUME</span><strong>${escape(d.volume)}</strong></article>
        <article><span>FINALIZED RECEIPTS</span><strong>${escape(d.receipts)}</strong></article>
        <article><span>ACTIVE PRODUCT</span><strong>0.01 <small>USDC</small></strong></article></div>
        <div class="activity"><i></i><span>Premium Weather API</span><b>✓ FINALIZED</b></div>`;
        return `${head}${copy(d)}
        <div class="agentGrid"><article><span>ALLOWANCE</span><strong>1.00 USDC</strong><small>maximum · expiration · revocation</small></article>
        <article class="scout"><span>MCP TOOL</span><strong>Solana Project Scout</strong><small>public sources · dated report · 0.02 test USDC</small></article></div>`;
      }
    },
    { nextScene: scene, nextData: data },
  );
  await pause(seconds * speed * 1000 + 300);
}

function filmShell() {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Manrope:wght@400;500;600;700&display=swap');
  :root{--ink:#10251d;--paper:#f3f0e7;--lime:#c8f56c;--green:#17543a;--purple:#aa91ff;--line:#d3d5c9}
  *{box-sizing:border-box}body{margin:0;background:#0b2018;font-family:Manrope,Arial,sans-serif;overflow:hidden}
  .film{position:relative;width:1280px;height:720px;background:var(--paper);color:var(--ink);padding:42px 58px;overflow:hidden;opacity:1;transition:opacity .28s}
  .film:before{content:"";position:absolute;inset:0;opacity:.2;background-image:radial-gradient(#143d2b 0.6px,transparent .6px);background-size:9px 9px;pointer-events:none}
  .film:after{content:"";position:absolute;width:520px;height:520px;border-radius:50%;right:-180px;bottom:-250px;background:var(--lime);filter:blur(2px);opacity:.48}
  .film.leaving{opacity:0}.film>*{position:relative;z-index:1}.film.entered .copy,.film.entered [class$=Card],.film.entered .metrics,.film.entered .agentGrid,.film.entered .settlementFlow{animation:rise .8s cubic-bezier(.2,.8,.2,1) both}
  @keyframes rise{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:none}}
  .top{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;border-bottom:1px solid var(--line);padding-bottom:18px}
  .logo{display:flex;align-items:center;gap:10px;font-weight:700}.logo b{display:grid;place-items:center;width:30px;height:30px;border-radius:8px;background:var(--ink);color:var(--lime);font:500 15px DM Mono}
  .eyebrow,.counter{font:500 10px DM Mono;letter-spacing:1.8px;color:var(--green)}.counter{text-align:right;color:#728077}
  .copy{position:absolute;left:58px;top:145px;width:600px}.copy h1{font-size:62px;line-height:.97;letter-spacing:-4.4px;margin:0 0 24px}.copy p{font-size:18px;line-height:1.55;color:#66766d;max-width:570px}
  .bottomLine{position:absolute;left:58px;bottom:50px;font:500 13px DM Mono;color:var(--green)}
  .orb{position:absolute;right:100px;top:170px;width:330px;height:330px;border:1px solid #7e9b8b;border-radius:50%;display:grid;place-items:center}.orb:before,.orb:after{content:"";position:absolute;border:1px solid #9fb2a7;border-radius:50%}.orb:before{inset:45px}.orb:after{inset:95px;background:var(--lime)}.orb strong{z-index:2;font:500 24px DM Mono}.orb i{position:absolute;width:15px;height:15px;background:var(--purple);border-radius:50%}.orb i:nth-child(1){top:32px;left:66px}.orb i:nth-child(2){right:18px;bottom:110px;background:#72cef6}.orb i:nth-child(3){left:15px;bottom:95px;background:var(--lime)}
  .requestCard,.challengeCard,.receiptCard{position:absolute;right:65px;top:165px;width:460px;background:var(--ink);color:#fff;border-radius:22px;padding:34px;box-shadow:0 28px 70px #10251d2d}.requestCard span,.requestCard b{display:block;font:500 10px DM Mono;color:var(--lime);letter-spacing:1.5px}.requestCard code{display:block;margin:42px 0;background:#071610;padding:22px;border-radius:10px;color:#fff;font:16px DM Mono}.routeLine{position:absolute;right:90px;bottom:120px;width:410px;height:3px;background:#bdc8c0}.routeLine i{position:absolute;width:14px;height:14px;top:-6px;border-radius:50%;background:var(--green)}.routeLine i:nth-child(2){left:50%;background:var(--purple)}.routeLine i:nth-child(3){right:0;background:var(--lime)}
  .challengeCard{background:#fff;color:var(--ink);border:1px solid var(--line)}.status{display:flex;align-items:center;gap:16px;border-bottom:1px solid var(--line);padding-bottom:22px}.status b{font-size:55px;color:var(--green)}.status span{font:500 11px DM Mono}.challengeCard dl{display:grid;gap:16px}.challengeCard dl div{display:grid;grid-template-columns:95px 1fr}.challengeCard dt{font:10px DM Mono;color:#79867e}.challengeCard dd{margin:0;font:500 12px DM Mono}.liveBadge{position:absolute;right:87px;bottom:70px;background:#e1f4b6;color:var(--green);padding:9px 13px;border-radius:20px;font:500 10px DM Mono}
  .settlementFlow{position:absolute;right:58px;top:205px;width:535px;display:grid;grid-template-columns:170px 1fr 170px;align-items:center}.settlementFlow article{background:#fff;border:1px solid var(--line);border-radius:18px;padding:28px;display:grid;gap:9px}.settlementFlow article i{font:10px DM Mono;color:var(--green)}.settlementFlow article b{font-size:20px}.settlementFlow article small{color:#78857d}.transfer{text-align:center}.transfer span{font:500 10px DM Mono;color:var(--green)}.transfer i{display:block;height:3px;background:var(--green);margin-top:10px;position:relative}.transfer i:after{content:"›";position:absolute;right:-4px;top:-14px;font-size:24px}.noCustody{position:absolute;right:150px;bottom:118px;font:500 12px DM Mono}.noCustody b{color:#b04c4c;margin:0 10px}
  .receiptCard{background:#10251d}.receiptHead{display:flex;justify-content:space-between;font:10px DM Mono;color:#90a79a}.receiptHead b{color:var(--lime)}.receiptCard>strong{display:block;font-size:45px;margin:42px 0 14px}.receiptCard>code{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#cad7d0;background:#071710;padding:14px;border-radius:8px}.receiptMeta{display:grid;grid-template-columns:repeat(3,1fr);margin-top:28px;border-top:1px solid #345046;padding-top:20px}.receiptMeta span{font:9px/1.7 DM Mono;color:#90a79a}.receiptMeta b{color:#fff}
  .metrics{position:absolute;right:55px;top:175px;width:520px;display:grid;gap:12px}.metrics article{background:#10251d;color:#fff;border-radius:15px;padding:23px 26px;display:flex;align-items:center;justify-content:space-between}.metrics span{font:10px DM Mono;color:#9eb0a8}.metrics strong{font-size:27px}.metrics small{font:10px DM Mono}.activity{position:absolute;right:55px;bottom:80px;width:520px;background:#fff;border:1px solid var(--line);border-radius:12px;padding:18px;display:grid;grid-template-columns:20px 1fr auto;gap:10px}.activity i{width:10px;height:10px;background:var(--lime);border-radius:50%}.activity span{font-weight:600}.activity b{font:10px DM Mono;color:var(--green)}
  .agentGrid{position:absolute;right:55px;top:175px;width:520px;display:grid;gap:16px}.agentGrid article{background:#fff;border:1px solid var(--line);border-radius:18px;padding:28px;display:grid;gap:14px}.agentGrid span{font:10px DM Mono;color:var(--green)}.agentGrid strong{font-size:27px}.agentGrid small{color:#718078}.agentGrid .scout{background:var(--ink);color:#fff}.agentGrid .scout span{color:var(--lime)}
  .scene-closing{background:var(--ink);color:#fff}.scene-closing:before{opacity:.12;background-image:radial-gradient(#c8f56c .6px,transparent .6px)}.scene-closing:after{opacity:.8}.scene-closing .top{border-color:#345046}.scene-closing .counter{color:#8ea298}.scene-closing .copy p{color:#b4c2ba}.scene-closing .bottomLine{color:var(--lime)}
  </style></head><body><main id="film" class="film"></main></body></html>`;
}

function formatAtomic(value) {
  return (Number(value) / 1_000_000).toFixed(2);
}
function short(value, max) {
  const text = String(value);
  if (text.length <= max) return text;
  const side = Math.floor((max - 1) / 2);
  return `${text.slice(0, side)}…${text.slice(-side)}`;
}
function pause(ms) {
  return new Promise((resolve) => globalThis.setTimeout(resolve, ms));
}
