import { expect, test } from "@playwright/test";

test("bilingual docs are searchable, keyboard reachable and recoverable", async ({
  page,
}) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  await page.goto("/en/docs");
  await expect(
    page.getByRole("heading", { name: "Start with MeterKit" }).first(),
  ).toBeVisible();
  await expect(
    page.locator('.docsSearch[data-shortcut-ready="true"]'),
  ).toBeVisible();
  await page.keyboard.press("/");
  const search = page.getByLabel("Search documentation");
  await expect(search).toBeFocused();
  await search.fill("replay");
  await expect(page.locator(".docsSearchResults a").first()).toBeVisible();
  await page.getByRole("link", { name: "Español" }).click();
  await expect(page).toHaveURL(/\/es\/docs$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "es");
  await expect(
    page.getByRole("heading", { name: "Comenzar con MeterKit" }).first(),
  ).toBeVisible();
  await page
    .getByLabel("Buscar documentación")
    .fill("consulta inexistente xyz");
  await expect(page.getByText(/Sin resultados/)).toBeVisible();
  expect(consoleErrors).toEqual([]);
});

test("docs remain usable on mobile, reduced motion and missing routes", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/en/docs/trust");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(
    page.getByRole("heading", { name: "Trust and limitations" }).first(),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth ===
        document.documentElement.clientWidth,
    ),
  ).toBe(true);
  await expect(
    page.getByRole("navigation", { name: "Sections" }),
  ).toBeVisible();
  await page.getByRole("navigation", { name: "Sections" }).focus();
  await expect(
    page.getByRole("navigation", { name: "Sections" }),
  ).toBeFocused();
  await page.goto("/en/docs/not-a-real-page");
  await expect(
    page.getByRole("heading", { name: "Documentation page not found" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Open documentation" }),
  ).toBeVisible();
});
