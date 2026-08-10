import { describe, expect, it, vi } from "vitest";
import {
  buildGitHubAuthorizationUrl,
  exchangeGitHubIdentity,
} from "./github-auth.js";

describe("GitHub identity linking", () => {
  it("builds a minimal exact callback authorization request", () => {
    const url = new URL(
      buildGitHubAuthorizationUrl({
        clientId: "client-id",
        callbackUrl: "https://api.example.com/v1/auth/github/callback",
        state: "bounded-state",
      }),
    );
    expect(url.origin + url.pathname).toBe(
      "https://github.com/login/oauth/authorize",
    );
    expect(url.searchParams.get("client_id")).toBe("client-id");
    expect(url.searchParams.get("redirect_uri")).toBe(
      "https://api.example.com/v1/auth/github/callback",
    );
    expect(url.searchParams.get("scope")).toBe("read:user");
    expect(url.searchParams.get("state")).toBe("bounded-state");
  });

  it("exchanges the code server-side and accepts only bounded GitHub identity", async () => {
    const request = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            access_token: "secret-access-token-with-safe-length",
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: 12345678,
            login: "meterkit-pilot",
            avatar_url: "https://avatars.githubusercontent.com/u/12345678?v=4",
          }),
          { status: 200 },
        ),
      );
    await expect(
      exchangeGitHubIdentity(
        {
          clientId: "client-id",
          clientSecret: "client-secret",
          callbackUrl: "https://api.example.com/v1/auth/github/callback",
          code: "one-time-code",
        },
        request,
      ),
    ).resolves.toMatchObject({
      subject: "12345678",
      login: "meterkit-pilot",
    });
    expect(request.mock.calls[0]?.[1]?.body).toContain("client_secret");
    expect(request.mock.calls[1]?.[1]?.headers).toMatchObject({
      authorization: "Bearer secret-access-token-with-safe-length",
    });
  });

  it("rejects malformed provider responses", async () => {
    const request = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ error: "bad_verification_code" }), {
        status: 200,
      }),
    );
    await expect(
      exchangeGitHubIdentity(
        {
          clientId: "client-id",
          clientSecret: "client-secret",
          callbackUrl: "https://api.example.com/v1/auth/github/callback",
          code: "invalid",
        },
        request,
      ),
    ).rejects.toThrow("GITHUB_TOKEN_EXCHANGE_FAILED");
  });
});
