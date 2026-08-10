import express from "express";
import { afterEach, describe, expect, it } from "vitest";
import { installHttpPolicy } from "./http-policy.js";

const originalLimit = process.env.RATE_LIMIT_PER_MINUTE;

afterEach(() => {
  if (originalLimit === undefined) delete process.env.RATE_LIMIT_PER_MINUTE;
  else process.env.RATE_LIMIT_PER_MINUTE = originalLimit;
});

describe("hosted HTTP policy", () => {
  it("returns sanitized correlation and deterministic retry guidance", async () => {
    process.env.RATE_LIMIT_PER_MINUTE = "1";
    const app = express();
    installHttpPolicy(app, 0);
    app.get("/bounded", (_request, response) => response.json({ ok: true }));
    const server = app.listen(0, "127.0.0.1");
    await new Promise<void>((resolve) => server.once("listening", resolve));
    const address = server.address();
    if (!address || typeof address === "string")
      throw new Error("TEST_SERVER_ADDRESS");
    const url = `http://127.0.0.1:${address.port}/bounded`;
    try {
      const accepted = await fetch(url, {
        headers: { "x-request-id": "unsafe bearer token with spaces" },
      });
      expect(accepted.status).toBe(200);
      expect(accepted.headers.get("x-request-id")).toMatch(/^[a-f0-9-]{36}$/);
      expect(accepted.headers.get("ratelimit")).toBeTruthy();

      const rejected = await fetch(url);
      expect(rejected.status).toBe(429);
      expect(Number(rejected.headers.get("retry-after"))).toBeGreaterThan(0);
      await expect(rejected.json()).resolves.toMatchObject({
        error: "rate_limit_exceeded",
        retryable: true,
      });
    } finally {
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
    }
  });
});
