import { afterEach, describe, expect, it } from "vitest";
import type { Server } from "node:http";

let server: Server | undefined;
afterEach(() => server?.close());

describe("copy-paste Express quickstart", () => {
  it("returns the canonical unpaid x402 challenge", async () => {
    process.env.MERCHANT_WALLET = "7YttLkHDoNj9wyDur5zto7qLQyHQVwMkwXU88HZ6sW9";
    const { createApp } = await import("./server.js");
    server = createApp(process.env.MERCHANT_WALLET).listen(0, "127.0.0.1");
    await new Promise<void>((resolve) => server!.once("listening", resolve));
    const address = server.address();
    if (!address || typeof address === "string")
      throw new Error("test server unavailable");
    const response = await fetch(`http://127.0.0.1:${address.port}/premium`);
    expect(response.status).toBe(402);
    const challenge = response.headers.get("payment-required");
    expect(challenge).toBeTruthy();
    const decoded = JSON.parse(
      Buffer.from(challenge!, "base64").toString("utf8"),
    );
    expect(JSON.stringify(decoded)).toContain("10000");
    expect(JSON.stringify(decoded)).toContain(
      "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1",
    );
  });
});
