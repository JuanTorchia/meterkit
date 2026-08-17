import { expect, test } from "@playwright/test";

test("free beta and optional setup are understandable, keyboard reachable and error-safe", async ({
  page,
}) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  await page.goto("/");
  const primary = page.getByRole("link", {
    name: "Review the free devnet beta",
  });
  await expect(primary).toBeVisible();
  await primary.focus();
  await expect(primary).toBeFocused();
  await primary.click();
  await expect(
    page.getByRole("heading", {
      name: "Install and verify one endpoint at no charge.",
    }),
  ).toBeVisible();
  await expect(
    page.getByText(
      /Participants are not charged and are not paid or compensated/,
    ),
  ).toBeVisible();
  await expect(
    page.getByText(/optional founder setup service costs USD 100/),
  ).toBeVisible();
  await expect(page.getByText(/Devnet only/).first()).toBeVisible();

  const ratio = await page
    .locator("a.primary")
    .first()
    .evaluate((element) => {
      const style = getComputedStyle(element);
      const channels = (value: string) =>
        value
          .match(/[\d.]+/g)!
          .slice(0, 3)
          .map((part) => Number(part) / 255);
      const luminance = (value: string) =>
        channels(value)
          .map((channel) =>
            channel <= 0.03928
              ? channel / 12.92
              : ((channel + 0.055) / 1.055) ** 2.4,
          )
          .reduce(
            (sum, channel, index) =>
              sum + channel * [0.2126, 0.7152, 0.0722][index]!,
            0,
          );
      const values = [
        luminance(style.color),
        luminance(style.backgroundColor),
      ].sort((a, b) => b - a);
      return (values[0]! + 0.05) / (values[1]! + 0.05);
    });
  expect(ratio).toBeGreaterThanOrEqual(4.5);
  expect(consoleErrors).toEqual([]);
});

test("readiness exposes loading and provider-independent failure states", async ({
  page,
}) => {
  await page.route("**/v1/pilot/verify", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 250));
    await route.fulfill({ status: 503, body: "{}" });
  });
  await page.goto("/pilots");
  await page
    .getByLabel("Endpoint to verify")
    .fill("https://api.example/premium");
  await page.getByRole("button", { name: "Verify readiness" }).click();
  await expect(page.getByRole("button", { name: "Verifying…" })).toBeDisabled();
  await expect(page.locator(".errorBanner[role='alert']")).toContainText(
    /our side, not your endpoint/,
  );
});

test("free beta remains usable and equivalent in Spanish on mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/pilots");
  await page.getByRole("button", { name: "Español" }).click();
  await expect(
    page.getByRole("heading", {
      name: "Instala y verifica un endpoint sin costo.",
    }),
  ).toBeVisible();
  await expect(
    page.getByText(/No se les cobra ni se les paga o compensa/),
  ).toBeVisible();
  await expect(
    page.getByText(/servicio opcional de implementación cuesta USD 100/),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth ===
        document.documentElement.clientWidth,
    ),
  ).toBe(true);
});
