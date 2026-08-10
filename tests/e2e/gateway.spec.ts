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
