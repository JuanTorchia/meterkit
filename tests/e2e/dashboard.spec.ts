import { expect, test } from "@playwright/test";

test("landing and dashboard communicate the non-custodial product", async ({ page }) => {
  const consoleErrors: string[] = [];
  const failedResponses: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("response", (response) => {
    if (response.status() >= 400) failedResponses.push(`${response.status()} ${response.url()}`);
  });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Tu API merece/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Premium Weather API" })).toBeVisible();
  await expect(page.getByText("0,01", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("No custody", { exact: false })).toBeVisible();
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
