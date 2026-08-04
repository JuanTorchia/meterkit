import { expect, test } from "@playwright/test";

test("landing, guided demo and workspace communicate the non-custodial product", async ({ page }) => {
  const consoleErrors: string[] = [];
  const failedResponses: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error" && !message.text().includes("402 (Payment Required)")) consoleErrors.push(message.text());
  });
  page.on("response", (response) => {
    if (response.status() >= 400 && response.status() !== 402) failedResponses.push(`${response.status()} ${response.url()}`);
  });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Turn an API call/ })).toBeVisible();
  await expect(page.getByText("MeterKit never holds the funds", { exact: false })).toBeVisible();
  await page.screenshot({ path: "artifacts/landing-v2-desktop.png", fullPage: true });
  await page.getByRole("button", { name: "Español", exact: true }).click();
  await expect(page.getByRole("heading", { name: /Convierte una llamada API/ })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "es");
  await page.getByRole("button", { name: "Português (Brasil)", exact: true }).click();
  await expect(page.getByRole("heading", { name: /Transforme uma chamada/ })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "pt-BR");
  await page.reload();
  await expect(page.getByRole("heading", { name: /Transforme uma chamada/ })).toBeVisible();
  await page.getByRole("button", { name: "English", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await page.goto("/demo");
  await page.getByRole("button", { name: /Run request/ }).click();
  await expect(page.getByText("402 · PAYMENT REQUIRED")).toBeVisible();
  await page.getByRole("button", { name: /Replay verified/ }).click();
  await expect(page.getByText("200 · PROTECTED RESPONSE")).toBeVisible();
  await page.screenshot({ path: "artifacts/demo-v2-desktop.png", fullPage: true });
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "Premium Weather API" })).toBeVisible();
  await expect(page.getByText("0.01", { exact: true }).first()).toBeVisible();
  await expect(page.locator("[data-nextjs-dialog]")).toHaveCount(0);
  expect(await page.evaluate(() =>
    document.documentElement.scrollWidth === document.documentElement.clientWidth)).toBe(true);
  await page.screenshot({ path: "artifacts/dashboard-desktop.png", fullPage: true });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await expect(page.getByRole("heading", { name: "Premium Weather API" })).toBeVisible();
  expect(await page.evaluate(() =>
    document.documentElement.scrollWidth === document.documentElement.clientWidth)).toBe(true);
  await page.screenshot({ path: "artifacts/dashboard-mobile.png", fullPage: true });
  expect(consoleErrors).toEqual([]);
  expect(failedResponses).toEqual([]);
});
