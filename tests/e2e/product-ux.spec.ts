import { expect, test } from "@playwright/test";

test("landing leads with installation and exposes accessible controls", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("link", { name: /Review the free devnet beta/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("region", { name: /LIVE PRODUCT FLOW/ }),
  ).toBeVisible();
  await expect(page.getByRole("group", { name: "Language" })).toBeVisible();
  const code = page.locator(".codeSection pre");
  await code.focus();
  await expect(code).toBeFocused();
});

test("guided demo distinguishes live terms from synthetic receipt evidence", async ({
  page,
}) => {
  await page.goto("/demo");
  await page.getByRole("button", { name: /Run live request/ }).click();
  await expect(page.getByText("402 · PAYMENT REQUIRED")).toBeVisible();

  await page.route("**/v1/public/payments", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        {
          id: "internal-evidence",
          productId: "premium-weather",
          amountAtomic: "10000",
          network: "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1",
          status: "finalized",
          signature: "synthetic-devnet-receipt",
          explorerUrl:
            "https://explorer.solana.com/tx/synthetic-devnet-receipt?cluster=devnet",
          settledAt: "2026-08-05T00:00:00.000Z",
        },
      ]),
    }),
  );
  await page
    .getByRole("button", { name: /Show matching public receipt/ })
    .click();
  await expect(
    page.getByText(/no request was unlocked in this playback/),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Previously finalized receipt/ }),
  ).toHaveAttribute("href", /cluster=devnet/);
});

test("public workspace labels internal evidence and remains usable on mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/dashboard");
  await expect(
    page.getByText(/not external users, revenue or production activity/),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth ===
        document.documentElement.clientWidth,
    ),
  ).toBe(true);
});
