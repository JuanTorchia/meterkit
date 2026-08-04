import { chromium } from "@playwright/test";
import process from "node:process";

const target = process.env.METERKIT_WEB_URL ?? "https://meterkit.juanchi.dev";
const minimumReceipts = Number(process.env.MINIMUM_RECEIPTS ?? 3);
const browser = await chromium.launch();

try {
  const context = await browser.newContext({
    locale: "en-US",
    viewport: { width: 1440, height: 1000 },
  });
  const page = await context.newPage();
  const consoleErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  await page.goto(`${target}/dashboard`, { waitUntil: "networkidle", timeout: 30_000 });
  await page.waitForFunction(
    (minimum) => globalThis.document.querySelectorAll(".transactions .row").length >= minimum,
    minimumReceipts,
    { timeout: 30_000 },
  ).catch(() => undefined);
  const evidence = await page.evaluate(() => ({
    title: globalThis.document.title,
    lang: globalThis.document.documentElement.lang,
    receiptRows: globalThis.document.querySelectorAll(".transactions .row").length,
    finalizedRows: Array.from(globalThis.document.querySelectorAll(".transactions .row"))
      .filter((row) => row.textContent?.toLowerCase().includes("finalized")).length,
    explorerLinks: globalThis.document.querySelectorAll(".transactions a[href*='explorer.solana.com']").length,
    horizontalOverflow: globalThis.document.documentElement.scrollWidth >
      globalThis.document.documentElement.clientWidth,
  }));
  await page.screenshot({
    path: "artifacts/internal-synthetic-dashboard.png",
    fullPage: true,
  });
  const passed = evidence.receiptRows >= minimumReceipts &&
    evidence.finalizedRows >= minimumReceipts &&
    evidence.explorerLinks >= minimumReceipts &&
    !evidence.horizontalOverflow &&
    consoleErrors.length === 0;
  process.stdout.write(`${JSON.stringify({
    kind: "meterkit-internal-synthetic-browser-validation",
    externalUser: false,
    checkedAt: new Date().toISOString(),
    target,
    passed,
    evidence,
    consoleErrors,
    screenshot: "artifacts/internal-synthetic-dashboard.png",
  }, null, 2)}\n`);
  if (!passed) process.exitCode = 1;
  await context.close();
} finally {
  await browser.close();
}
