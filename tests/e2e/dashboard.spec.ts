import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

// Read from the workspace rather than hardcoding: a pinned literal here is how
// the pilots page kept asserting a superseded version long after it shipped.
const publishedSdk: string = JSON.parse(
  readFileSync("packages/sdk/package.json", "utf8"),
).version;

test("receipt states stay accessible and recoverable", async ({ page }) => {
  await page.route("**/v1/public/products", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: "[]" }),
  );
  await page.route("**/v1/public/payments", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        {
          id: "1",
          productId: "pending-api",
          amountAtomic: "10000",
          signature: "sanitized-test-signature-1",
          settledAt: new Date().toISOString(),
          status: "unknown",
          explorerUrl: "https://explorer.solana.com/?cluster=devnet",
        },
        {
          id: "2",
          productId: "final-api",
          amountAtomic: "10000",
          signature: "sanitized-test-signature-2",
          settledAt: new Date().toISOString(),
          status: "finalized",
          explorerUrl: "https://explorer.solana.com/?cluster=devnet",
        },
      ]),
    }),
  );
  await page.goto("/dashboard");
  await expect(page.getByText("unknown", { exact: true })).toBeVisible();
  await expect(page.getByText("finalized", { exact: true })).toBeVisible();
  const refresh = page.getByRole("button", { name: "Refresh" });
  await refresh.focus();
  await expect(refresh).toBeFocused();
  await refresh.press("Enter");
});

test("landing, guided demo and workspace communicate the non-custodial product", async ({
  page,
}) => {
  const consoleErrors: string[] = [];
  const failedResponses: string[] = [];
  page.on("console", (message) => {
    if (
      message.type() === "error" &&
      !message.text().includes("402 (Payment Required)")
    )
      consoleErrors.push(message.text());
  });
  page.on("response", (response) => {
    if (response.status() >= 400 && response.status() !== 402)
      failedResponses.push(`${response.status()} ${response.url()}`);
  });
  const landingResponse = await page.goto("/");
  expect(landingResponse?.headers()["content-security-policy"]).toContain(
    "frame-ancestors 'none'",
  );
  expect(landingResponse?.headers()["x-content-type-options"]).toBe("nosniff");
  expect(landingResponse?.headers()["x-powered-by"]).toBeUndefined();
  await expect(
    page.getByRole("heading", { name: /Every request is metered/ }),
  ).toBeVisible();
  await expect(
    page.getByText("MeterKit never holds the funds", { exact: false }),
  ).toBeVisible();
  await page.screenshot({
    path: "artifacts/landing-v2-desktop.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Español", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: /Cada request se mide/ }),
  ).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "es");
  await page
    .getByRole("button", { name: "Português (Brasil)", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: /Cada requisição é medida/ }),
  ).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "pt-BR");
  await page.reload();
  await expect(
    page.getByRole("heading", { name: /Cada requisição é medida/ }),
  ).toBeVisible();
  await page.getByRole("button", { name: "English", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await page.goto("/demo");
  await page.getByRole("button", { name: /Run live request/ }).click();
  await expect(page.getByText("402 · PAYMENT REQUIRED")).toBeVisible();
  await expect(page.getByText("0.01 test USDC")).toBeVisible();
  await expect(page.getByText(/recipient 7NXuBz/)).toBeVisible();
  await page.route("**/v1/public/payments", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: "[]" }),
  );
  await page
    .getByRole("button", { name: /Show matching public receipt/ })
    .click();
  await expect(page.locator(".demoError")).toContainText(
    "No finalized receipt matches",
  );
  await expect(page.getByRole("button", { name: /^Retry/ })).toBeEnabled();
  await expect(page.getByText("Wallet signed locally")).toHaveCount(0);
  await page.screenshot({
    path: "artifacts/demo-v2-desktop.png",
    fullPage: true,
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth ===
        document.documentElement.clientWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "artifacts/demo-v2-mobile.png",
    fullPage: true,
  });

  await page.goto("/");
  await expect(
    page
      .getByRole("navigation", { name: "Product areas" })
      .getByRole("link", { name: "Payer" }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("navigation", { name: "Product areas" })
      .getByRole("link", { name: /MCP Scout/ }),
  ).toBeVisible();
  await page.screenshot({
    path: "artifacts/landing-v2-mobile.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/dashboard");
  await expect(
    page.getByRole("heading", { name: "Premium Weather API" }),
  ).toBeVisible();
  await expect(page.getByText("0.01", { exact: true }).first()).toBeVisible();
  await expect(page.locator("[data-nextjs-dialog]")).toHaveCount(0);
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth ===
        document.documentElement.clientWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "artifacts/dashboard-desktop.png",
    fullPage: true,
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Premium Weather API" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth ===
        document.documentElement.clientWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "artifacts/dashboard-mobile.png",
    fullPage: true,
  });
  await page.goto("/agent/allowances");
  await expect(
    page.getByRole("heading", { name: "Your authorization stays yours." }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "Create, inspect and revoke allowances.",
    }),
  ).toBeVisible();
  await expect(page.getByLabel("Delegate wallet")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Create fixed allowance" }),
  ).toBeVisible();
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/pilots");
  await expect(
    page.getByRole("heading", {
      name: "Verify your first paid endpoint without sharing a key.",
    }),
  ).toBeVisible();
  await expect(
    page.getByText("meterkit-pilot.json", { exact: false }).first(),
  ).toBeVisible();
  await expect(
    page
      .getByText(`@usemeterkit/sdk@${publishedSdk}`, { exact: false })
      .first(),
  ).toBeVisible();
  await expect(
    page.getByText(/initializer candidate is not published on npm/i),
  ).toBeVisible();
  await expect(
    page.getByText("pnpm create:meterkit", { exact: false }).first(),
  ).toBeVisible();
  await expect(page).toHaveTitle("External developer pilot | MeterKit");
  await expect(page.getByRole("button", { name: /^Copy:/ })).toHaveCount(5);
  await page.screenshot({
    path: "artifacts/pilots-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await expect(
    page
      .getByRole("navigation", { name: "Product areas" })
      .getByRole("link", { name: "Pilots" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth ===
        document.documentElement.clientWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "artifacts/pilots-mobile.png",
    fullPage: true,
  });
  expect(consoleErrors).toEqual([]);
  expect(failedResponses).toEqual([]);
});
