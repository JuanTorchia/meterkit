import { describe, expect, it, vi } from "vitest";
import {
  assertAllowedUpstream,
  fetchAllowedUpstream,
  parseUpstreamAllowlist,
} from "./upstream.js";

describe("safe upstream proxy", () => {
  const allowed = parseUpstreamAllowlist("api.example.com");

  it.each([
    "http://api.example.com/data",
    "https://user:pass@api.example.com/data",
    "https://127.0.0.1/data",
    "https://api.example.com:8443/data",
    "https://evil.example/data",
  ])("rejects unsafe upstream %s", (url) => {
    expect(() => assertAllowedUpstream(url, allowed)).toThrow(
      "UPSTREAM_NOT_ALLOWED",
    );
  });

  it("forwards query parameters and returns bounded JSON", async () => {
    const request = vi.fn(async (input: URL | RequestInfo) => {
      expect(String(input)).toContain("fixed=yes");
      expect(String(input)).toContain("city=Buenos+Aires");
      return new Response('{"temperature":21}', {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    });
    const result = await fetchAllowedUpstream({
      upstreamUrl: "https://api.example.com/weather?fixed=yes",
      clientQuery: new URLSearchParams({ city: "Buenos Aires" }),
      allowedHosts: allowed,
      request,
    });
    expect(new TextDecoder().decode(result.body)).toBe('{"temperature":21}');
  });

  it("rejects redirects, non-JSON and oversized responses", async () => {
    await expect(
      fetchAllowedUpstream({
        upstreamUrl: "https://api.example.com/data",
        clientQuery: new URLSearchParams(),
        allowedHosts: allowed,
        request: async () =>
          new Response("text", {
            headers: { "content-type": "text/plain" },
          }),
      }),
    ).rejects.toThrow("UPSTREAM_CONTENT_TYPE_REJECTED");
    await expect(
      fetchAllowedUpstream({
        upstreamUrl: "https://api.example.com/data",
        clientQuery: new URLSearchParams(),
        allowedHosts: allowed,
        request: async () =>
          new Response("{}", {
            headers: {
              "content-type": "application/json",
              "content-length": "1000001",
            },
          }),
      }),
    ).rejects.toThrow("UPSTREAM_RESPONSE_TOO_LARGE");
  });
});
