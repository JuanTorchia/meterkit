import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

function luminance(hex: string) {
  const channels = hex.match(/[0-9a-f]{2}/gi)!.map((value) => {
    const channel = Number.parseInt(value, 16) / 255;
    return channel <= 0.03928
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return channels[0]! * 0.2126 + channels[1]! * 0.7152 + channels[2]! * 0.0722;
}

function contrast(left: string, right: string) {
  const values = [luminance(left), luminance(right)].sort((a, b) => b - a);
  return (values[0]! + 0.05) / (values[1]! + 0.05);
}

describe("public self-service CTA contract", () => {
  it("keeps the free beta primary and the paid service optional in EN/ES", async () => {
    const source = await readFile(
      new URL("./pilots/page.tsx", import.meta.url),
      "utf8",
    );
    expect(source).toMatch(/FREE FIVE-PERSON DEVNET BETA/);
    expect(source).toMatch(/BETA DEVNET GRATUITA PARA CINCO PERSONAS/);
    expect(source).toMatch(/not charged and are not paid or compensated/);
    expect(source).toMatch(
      /servicio opcional de implementación cuesta USD 100/,
    );
  });

  it("exposes keyboard, mobile, loading and failure states", async () => {
    const [globalCss, pilotCss, readiness] = await Promise.all([
      readFile(new URL("./styles.css", import.meta.url), "utf8"),
      readFile(new URL("./pilots/pilots.module.css", import.meta.url), "utf8"),
      readFile(
        new URL("./pilots/readiness-check.tsx", import.meta.url),
        "utf8",
      ),
    ]);
    expect(globalCss).toMatch(/:focus-visible/);
    expect(pilotCss).toMatch(/@media \(max-width: 850px\)/);
    expect(readiness).toMatch(/disabled=\{busy \|\| !endpoint\}/);
    expect(readiness).toMatch(/role="alert"/);
    expect(readiness).toMatch(/aria-live="polite"/);
    expect(contrast("#f7f9fb", "#1a2e6e")).toBeGreaterThanOrEqual(4.5);
  });

  it("publishes the minimum trust links from the homepage", async () => {
    const source = await readFile(
      new URL("./page.tsx", import.meta.url),
      "utf8",
    );
    for (const marker of [
      "Releases",
      "Security",
      "Support",
      "Roadmap",
      "devnet beta",
      "0 verified external",
    ])
      expect(source).toContain(marker);
  });
});
