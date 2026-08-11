import { expect, test } from "@playwright/test";

const gateway = "http://127.0.0.1:3402";
const devnet = "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1";
const mint = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
const recipient = "7NXuBzJ3EQV4CuxpSVELD3t1bs5xZ6ocfGvwjFDbCZUE";

test("gateway exposes strict devnet health and x402 terms", async ({
  request,
}) => {
  const health = await request.get(`${gateway}/health`);
  expect(health.status()).toBe(200);
  await expect(health.json()).resolves.toMatchObject({
    status: "ok",
    network: devnet,
    custody: false,
    persistence: "postgres",
  });

  const unpaid = await request.get(`${gateway}/v1/weather/premium`);
  expect(unpaid.status()).toBe(402);
  const encoded = unpaid.headers()["payment-required"];
  expect(encoded).toBeTruthy();
  const terms = JSON.parse(Buffer.from(encoded, "base64").toString("utf8"));
  expect(terms).toMatchObject({
    x402Version: 2,
    accepts: [
      { network: devnet, asset: mint, amount: "10000", payTo: recipient },
    ],
  });
});

test("private resources and CORS remain isolated", async ({ request }) => {
  expect((await request.get(`${gateway}/v1/products`)).status()).toBe(401);
  expect((await request.get(`${gateway}/v1/payments`)).status()).toBe(401);
  expect((await request.get(`${gateway}/v1/allowances`)).status()).toBe(401);

  const allowed = await request.fetch(`${gateway}/health`, {
    method: "OPTIONS",
    headers: {
      origin: "http://127.0.0.1:3100",
      "access-control-request-method": "GET",
    },
  });
  expect(allowed.headers()["access-control-allow-origin"]).toBe(
    "http://127.0.0.1:3100",
  );

  const rejected = await request.fetch(`${gateway}/health`, {
    method: "OPTIONS",
    headers: {
      origin: "https://attacker.example",
      "access-control-request-method": "GET",
    },
  });
  expect(rejected.headers()["access-control-allow-origin"]).toBeUndefined();
});

test("hosted readiness verification refuses to reach anything internal", async ({
  request,
}) => {
  const verify = `${gateway}/v1/pilot/verify`;

  // Malformed input is rejected before the limiter, so a mistyped URL does not
  // spend a budget that exists to bound outbound requests.
  for (const body of [{}, { endpoint: "not-a-url" }, { endpoint: 42 }]) {
    const response = await request.post(verify, { data: body });
    expect(response.status()).toBe(400);
    expect(await response.json()).toMatchObject({ error: "invalid_endpoint" });
  }

  // The CLI can opt into localhost for local development. The hosted route must
  // not, or it becomes a probe for whatever the gateway can reach. A refused
  // address still answers 200 with a report, because naming the reason helps a
  // provider more than a bare status; what matters is that nothing is requested.
  const internal = [
    "http://localhost:3402/v1/weather/premium",
    "http://127.0.0.1:3402/health",
    "https://169.254.169.254/latest/meta-data/",
    "https://10.0.0.1/admin",
    "http://api.example.test/premium",
    "https://user:pass@api.example.test/premium",
  ];
  for (const endpoint of internal) {
    const response = await request.post(verify, { data: { endpoint } });
    expect(response.status(), `${endpoint} must answer with a report`).toBe(
      200,
    );
    const report = await response.json();
    expect(report.passed, `${endpoint} must not pass`).toBe(false);
    // Exactly one check means parseEndpoint threw before the fetch: no status
    // check and no header check, so nothing was requested from that address.
    expect(
      report.checks,
      `${endpoint} must be refused before any fetch`,
    ).toHaveLength(1);
    expect(report.checks[0]).toMatchObject({
      name: "endpoint can be verified safely",
      ok: false,
    });
  }

  // Six well-formed calls exhaust the per-minute budget; the seventh is refused
  // rather than costing another outbound socket.
  const exhausted = await request.post(verify, {
    data: { endpoint: "https://api.example.test/premium" },
  });
  expect(exhausted.status()).toBe(429);
  expect(await exhausted.json()).toMatchObject({
    error: "rate_limit_exceeded",
    retryable: true,
  });
});
