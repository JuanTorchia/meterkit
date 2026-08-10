import { serve } from "@hono/node-server";
import { Hono } from "hono";

const app = new Hono();
app.get("/premium", (context) =>
  context.json(
    {
      error: "payment_required",
      network: "solana-devnet",
      integration: "Follow the MeterKit Hono adapter guide",
    },
    402,
  ),
);
serve({ fetch: app.fetch, port: Number(process.env.PORT ?? "3000") });
