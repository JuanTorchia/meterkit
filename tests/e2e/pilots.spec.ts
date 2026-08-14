import { expect, test } from "@playwright/test";

test("assisted pilot discloses price, effort, deliverables and consent boundaries", async ({
  page,
}) => {
  await page.goto("/pilots");
  await expect(
    page.getByRole("heading", {
      name: "MeterKit integrates and verifies your endpoint for USD 100.",
    }),
  ).toBeVisible();
  await expect(
    page.getByText(/You pay MeterKit USD 100.*participants are not paid/),
  ).toBeVisible();
  await expect(page.getByText(/session of up to 45 minutes/)).toBeVisible();
  await expect(page.getByText(/about 60–90 minutes/)).toBeVisible();
  await expect(
    page.getByText(/Technical participation, private evidence retention/),
  ).toBeVisible();
  await expect(page.getByText(/never requests wallet keys/)).toBeVisible();
  await expect(
    page.getByText(/do not count as a completed external pilot/),
  ).toBeVisible();
});

test("pilot offer remains usable in Spanish on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/pilots");
  await page.getByRole("button", { name: "Español" }).click();
  await expect(
    page.getByRole("heading", {
      name: "MeterKit integra y verifica tu endpoint por USD 100.",
    }),
  ).toBeVisible();
  await expect(
    page.getByText(/Tú pagas USD 100 a MeterKit.*no pagamos ni compensamos/),
  ).toBeVisible();
  await expect(page.getByText(/decisiones separadas/)).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth ===
        document.documentElement.clientWidth,
    ),
  ).toBe(true);
});
