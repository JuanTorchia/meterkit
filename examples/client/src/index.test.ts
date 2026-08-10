import { describe, expect, it } from "vitest";
import { isResourceAllowed, parseAllowedResource } from "./index.js";

describe("agent resource scope", () => {
  const allowed = parseAllowedResource("https://api.example.com/v1/weather/premium/");

  it.each([
    ["exact path", "https://api.example.com/v1/weather/premium", true],
    ["trailing slash", "https://api.example.com/v1/weather/premium/", true],
    ["query string", "https://api.example.com/v1/weather/premium?city=Lima", true],
    ["malicious prefix", "https://api.example.com/v1/weather/premium-evil", false],
    ["encoded slash suffix", "https://api.example.com/v1/weather/premium%2Fevil", false],
    ["different origin", "https://evil.example/v1/weather/premium", false],
    ["different port", "https://api.example.com:444/v1/weather/premium", false],
    ["subpath by default", "https://api.example.com/v1/weather/premium/hourly", false],
  ])("%s", (_label, candidate, expected) => {
    expect(isResourceAllowed(new URL(candidate), allowed)).toBe(expected);
  });

  it("permits only path-boundary subpaths when explicitly enabled", () => {
    expect(isResourceAllowed(
      new URL("https://api.example.com/v1/weather/premium/hourly"),
      allowed,
      true,
    )).toBe(true);
    expect(isResourceAllowed(
      new URL("https://api.example.com/v1/weather/premium-evil"),
      allowed,
      true,
    )).toBe(false);
  });

  it.each([
    "ftp://api.example.com/v1/weather/premium",
    "http://api.example.com/v1/weather/premium",
    "https://user:password@api.example.com/v1/weather/premium",
  ])("rejects an unsafe configured resource: %s", (resource) => {
    expect(() => parseAllowedResource(resource)).toThrow();
  });

  it("allows HTTP only for explicit local development", () => {
    expect(parseAllowedResource("http://localhost:3402/v1/weather/premium").origin)
      .toBe("http://localhost:3402");
  });

  it("normalizes an adversarial trailing-slash input in linear time", () => {
    const allowed = parseAllowedResource(
      `https://api.example.com/v1/weather/premium${"/".repeat(100_000)}`,
    );
    expect(allowed.pathname).toBe("/v1/weather/premium");
  });
});
