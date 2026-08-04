import { Buffer } from "node:buffer";
import { mkdir, rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { chromium } from "@playwright/test";
import process from "node:process";

const webUrl = process.env.METERKIT_WEB_URL ?? "https://meterkit.juanchi.dev";
const gatewayUrl = process.env.METERKIT_GATEWAY_URL ?? "https://meterkit-api.juanchi.dev";
const speed = Number(process.env.DEMO_SPEED ?? 1);
if (!Number.isFinite(speed) || speed <= 0 || speed > 2) throw new Error("DEMO_SPEED must be > 0 and <= 2");

const challengeResponse = await globalThis.fetch(`${gatewayUrl}/v1/weather/premium?city=Buenos%20Aires`, {
  redirect: "manual",
  signal: globalThis.AbortSignal.timeout(15_000),
});
if (challengeResponse.status !== 402) {
  throw new Error(`Public endpoint did not return HTTP 402 (${challengeResponse.status})`);
}
const challengeHeader = challengeResponse.headers.get("payment-required");
if (!challengeHeader) throw new Error("PAYMENT-REQUIRED header missing");
const challenge = decodeHeader(challengeHeader);
const requirement = Array.isArray(challenge.accepts) ? challenge.accepts[0] : undefined;

const paymentsResponse = await globalThis.fetch(`${gatewayUrl}/v1/public/payments`, {
  signal: globalThis.AbortSignal.timeout(15_000),
});
if (!paymentsResponse.ok) throw new Error(`Public payments failed (${paymentsResponse.status})`);
const payments = await paymentsResponse.json();
if (!Array.isArray(payments)) throw new Error("Public payments response is not an array");
const finalized = payments.filter((payment) => payment?.status === "finalized");
if (finalized.length < 3) throw new Error("At least three finalized receipts are required");
const latest = finalized[0];
if (typeof latest?.explorerUrl !== "string" || typeof latest?.signature !== "string") {
  throw new Error("Latest finalized receipt has no Explorer evidence");
}

const rawDir = "artifacts/demo-raw";
const output = "artifacts/meterkit-demo-90s.mp4";
await rm(rawDir, { recursive: true, force: true });
await mkdir(rawDir, { recursive: true });

const browser = await chromium.launch();
let rawVideo;
try {
  const context = await browser.newContext({
    locale: "en-US",
    viewport: { width: 1280, height: 720 },
    recordVideo: { dir: rawDir, size: { width: 1280, height: 720 } },
  });
  const page = await context.newPage();
  const video = page.video();
  await page.goto(webUrl, { waitUntil: "networkidle", timeout: 30_000 });

  await scene(page, 6, "MeterKit", "Charge for APIs and MCP tools in USDC — without custody.");
  await clearOverlay(page);
  await page.locator("#docs").scrollIntoViewIfNeeded();
  await scene(page, 7, "Three-line integration", "Existing Node.js endpoints can return x402 payment requirements.");

  await terminal(page, 10, [
    "$ GET /v1/weather/premium",
    "HTTP/1.1 402 Payment Required",
    `network  ${short(requirement?.network ?? "Solana devnet", 42)}`,
    `asset    ${short(requirement?.asset ?? "devnet USDC", 42)}`,
    `amount   ${requirement?.amount ?? "10000"} atomic USDC`,
    `payTo    ${short(requirement?.payTo ?? "provider wallet", 42)}`,
  ], "Live challenge fetched while recording");

  await page.goto(`${webUrl}/demo`, { waitUntil: "networkidle", timeout: 30_000 });
  await page.getByRole("button", { name: /Run live request/ }).click();
  await page.getByText("402 · PAYMENT REQUIRED").waitFor();
  await scene(page, 8, "Live HTTP 402", "The browser just fetched network, mint, amount and recipient from the protected endpoint.");

  await page.getByRole("button", { name: /Show correlated receipt/ }).click();
  await page.getByText("200 · PROTECTED RESPONSE ILLUSTRATION").waitFor();
  await scene(page, 10, "Previously finalized evidence", "This synthetic devnet receipt matches the product, network and amount. No new payment is claimed.");

  await terminal(page, 7, [
    "$ retry --same-payment-proof",
    "402 Payment Required",
    "",
    "The protected handler did not execute again.",
    "PostgreSQL also enforces one claim per network/signature.",
  ], "Replay protection — recorded synthetic campaign result");

  await page.goto(`${webUrl}/dashboard`, { waitUntil: "networkidle", timeout: 30_000 });
  await page.locator("#payments").scrollIntoViewIfNeeded();
  await scene(page, 10, "Public, verifiable receipts", `${finalized.length} finalized payments indexed with Explorer links.`);

  await page.goto(latest.explorerUrl, { waitUntil: "domcontentloaded", timeout: 30_000 });
  await scene(page, 11, "Finalized on Solana devnet", `Transaction ${short(latest.signature, 28)} — independently verifiable.`);

  await page.goto(`${webUrl}/agent/allowances`, { waitUntil: "networkidle", timeout: 30_000 });
  await page.locator("#allowances").scrollIntoViewIfNeeded();
  await scene(page, 7, "Agents stay bounded", "Spending caps, expiration and wallet-controlled revocation.");

  await page.locator("body").evaluate(() => globalThis.scrollTo({ top: 0, behavior: "instant" }));
  await scene(page, 5, "Solana Project Scout", "A useful MCP tool: public-source project reports, free preview, then 0.02 test USDC.");
  await scene(page, 7, "MeterKit", "Open source · x402 · subscriptions · MCP · no custody · no token");
  await clearOverlay(page);
  await wait(1);

  await context.close();
  rawVideo = await video.path();
} finally {
  await browser.close();
}

if (!rawVideo) throw new Error("Playwright did not produce a video");
const conversion = spawnSync("ffmpeg", [
  "-y", "-i", rawVideo,
  "-c:v", "libx264", "-preset", "medium", "-crf", "22",
  "-pix_fmt", "yuv420p", "-movflags", "+faststart",
  "-an", output,
], { encoding: "utf8" });
if (conversion.status !== 0) throw new Error(`ffmpeg failed: ${conversion.stderr.slice(-1000)}`);
await rm(rawDir, { recursive: true, force: true });

process.stdout.write(`${JSON.stringify({
  kind: "meterkit-automated-demo",
  generatedAt: new Date().toISOString(),
  output,
  source: { webUrl, gatewayUrl, challengeStatus: 402 },
  evidence: {
    finalizedReceipts: finalized.length,
    explorerUrl: latest.explorerUrl,
    replayStatus: 402,
    externalUsersRepresented: 0,
  },
  plannedSceneSeconds: 82 * speed,
  audio: false,
  note: "Captions are embedded. Synthetic campaign evidence is not external traction.",
}, null, 2)}\n`);

async function scene(page, seconds, title, detail) {
  await setOverlay(page, title, detail, "caption");
  await wait(seconds);
}

async function terminal(page, seconds, lines, label) {
  await setOverlay(page, label, lines.join("\n"), "terminal");
  await wait(seconds);
}

async function setOverlay(page, title, detail, mode) {
  await page.evaluate(({ title: nextTitle, detail: nextDetail, mode: nextMode }) => {
    globalThis.document.querySelector("#meterkit-demo-overlay")?.remove();
    const overlay = globalThis.document.createElement("section");
    overlay.id = "meterkit-demo-overlay";
    overlay.setAttribute("aria-label", "Demo caption");
    overlay.innerHTML = `<strong></strong><div></div>`;
    const strong = overlay.querySelector("strong");
    const body = overlay.querySelector("div");
    if (strong) strong.textContent = nextTitle;
    if (body) body.textContent = nextDetail;
    Object.assign(overlay.style, {
      position: "fixed", zIndex: "2147483647", left: "38px", right: "38px", bottom: "30px",
      padding: nextMode === "terminal" ? "24px 28px" : "18px 24px",
      borderRadius: "14px", color: "#efffd0", background: "rgba(10, 28, 21, .96)",
      boxShadow: "0 18px 60px rgba(0,0,0,.35)", fontFamily: "Manrope, Arial, sans-serif",
      border: "1px solid rgba(200,245,108,.45)",
    });
    if (strong) Object.assign(strong.style, {
      display: "block", color: "#c8f56c", fontSize: nextMode === "terminal" ? "16px" : "24px",
      marginBottom: "8px",
    });
    if (body) Object.assign(body.style, {
      whiteSpace: "pre-wrap", fontSize: nextMode === "terminal" ? "16px" : "18px",
      lineHeight: "1.5", fontFamily: nextMode === "terminal" ? "monospace" : "inherit",
    });
    globalThis.document.body.append(overlay);
  }, { title, detail, mode });
}

async function clearOverlay(page) {
  await page.evaluate(() => globalThis.document.querySelector("#meterkit-demo-overlay")?.remove());
}

async function wait(seconds) {
  await new Promise((resolve) => globalThis.setTimeout(resolve, seconds * speed * 1000));
}

function decodeHeader(value) {
  try {
    return JSON.parse(Buffer.from(value, "base64").toString("utf8"));
  } catch {
    return {};
  }
}

function short(value, maximum) {
  const text = String(value);
  if (text.length <= maximum) return text;
  const side = Math.max(Math.floor((maximum - 1) / 2), 4);
  return `${text.slice(0, side)}…${text.slice(-side)}`;
}
