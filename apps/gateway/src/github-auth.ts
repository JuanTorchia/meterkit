import { z } from "zod";

const tokenSchema = z.object({ access_token: z.string().min(20).max(512) });
const profileSchema = z.object({
  id: z.number().int().positive(),
  login: z.string().regex(/^[A-Za-z0-9-]{1,39}$/),
  avatar_url: z.string().url().max(2_048).nullable().optional(),
});

export function buildGitHubAuthorizationUrl(input: {
  clientId: string;
  callbackUrl: string;
  state: string;
}) {
  const url = new URL("https://github.com/login/oauth/authorize");
  url.searchParams.set("client_id", input.clientId);
  url.searchParams.set("redirect_uri", input.callbackUrl);
  url.searchParams.set("scope", "read:user");
  url.searchParams.set("state", input.state);
  return url.toString();
}

export async function exchangeGitHubIdentity(
  input: {
    clientId: string;
    clientSecret: string;
    callbackUrl: string;
    code: string;
  },
  request: typeof fetch = fetch,
) {
  const tokenResponse = await request(
    "https://github.com/login/oauth/access_token",
    {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
      },
      signal: AbortSignal.timeout(10_000),
      body: JSON.stringify({
        client_id: input.clientId,
        client_secret: input.clientSecret,
        code: input.code,
        redirect_uri: input.callbackUrl,
      }),
    },
  );
  const token = tokenSchema.safeParse(await tokenResponse.json());
  if (!tokenResponse.ok || !token.success)
    throw new Error("GITHUB_TOKEN_EXCHANGE_FAILED");
  const profileResponse = await request("https://api.github.com/user", {
    headers: {
      accept: "application/vnd.github+json",
      authorization: `Bearer ${token.data.access_token}`,
      "user-agent": "MeterKit",
      "x-github-api-version": "2022-11-28",
    },
    signal: AbortSignal.timeout(10_000),
  });
  const profile = profileSchema.safeParse(await profileResponse.json());
  if (!profileResponse.ok || !profile.success)
    throw new Error("GITHUB_PROFILE_FAILED");
  return {
    subject: String(profile.data.id),
    login: profile.data.login,
    avatarUrl: profile.data.avatar_url ?? null,
    linkedAt: new Date().toISOString(),
  };
}
