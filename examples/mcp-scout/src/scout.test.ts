import { describe, expect, it, vi } from "vitest";
import { fetchProject, renderReport } from "./scout.js";

const repository = {
  name: "kit", full_name: "solana-foundation/kit", description: "SDK",
  html_url: "https://github.com/solana-foundation/kit", homepage: null,
  license: { spdx_id: "MIT" }, default_branch: "main",
  created_at: "2024-01-01T00:00:00Z", updated_at: "2026-08-01T00:00:00Z",
  pushed_at: "2026-08-02T00:00:00Z", archived: false, open_issues_count: 7,
  stargazers_count: 100, forks_count: 20,
};

describe("Solana Project Scout", () => {
  it("uses only the expected public GitHub endpoints and cites fresh data", async () => {
    const request = vi.fn(async (input: string | URL | Request) =>
      new Response(JSON.stringify(String(input).endsWith("/releases/latest")
        ? { tag_name: "v5.5.1" }
        : repository), { status: 200 }));
    const facts = await fetchProject(
      "solana-foundation/kit",
      request as typeof fetch,
      () => new Date("2026-08-03T00:00:00Z"),
    );
    const report = renderReport(facts);
    expect(request).toHaveBeenCalledTimes(2);
    expect(report).toContain("https://api.github.com/repos/solana-foundation/kit");
    expect(report).toContain("Fecha de consulta: 2026-08-03T00:00:00.000Z");
    expect(report).toContain("No constituye asesoramiento de inversión");
  });

  it("rejects arbitrary URLs and malformed repository names", async () => {
    const request = vi.fn();
    await expect(fetchProject("https://evil.example/repo", request)).rejects.toThrow(
      "Formato de repositorio inválido",
    );
    expect(request).not.toHaveBeenCalled();
  });

  it("uses an optional server-side GitHub token without exposing it in output", async () => {
    vi.stubEnv("GITHUB_TOKEN", "github-test-token");
    const request = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      expect(new Headers(init?.headers).get("authorization")).toBe("Bearer github-test-token");
      return new Response(JSON.stringify(String(input).endsWith("/releases/latest")
        ? { tag_name: "v1" } : repository), { status: 200 });
    });
    const facts = await fetchProject("solana-foundation/kit", request as typeof fetch);
    expect(JSON.stringify(facts)).not.toContain("github-test-token");
    vi.unstubAllEnvs();
  });

  it("fails closed on oversized and rate-limited GitHub responses", async () => {
    const oversized = vi.fn(async () => new Response("{}", {
      status: 200, headers: { "content-length": "512001" },
    }));
    await expect(fetchProject("solana-foundation/kit", oversized as typeof fetch))
      .rejects.toThrow("500 KiB");

    const limited = vi.fn(async () => new Response("rate limited", {
      status: 403, headers: { "x-ratelimit-remaining": "0" },
    }));
    await expect(fetchProject("solana-foundation/kit", limited as typeof fetch))
      .rejects.toThrow("rate limit");
  });
});
