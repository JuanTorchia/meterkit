import cors from "cors";
import express from "express";
import type { Express } from "express";
import { rateLimit } from "express-rate-limit";

export function installHttpPolicy(app: Express, trustProxyHops: number) {
  if (trustProxyHops > 0) app.set("trust proxy", trustProxyHops);
  app.disable("x-powered-by");
  app.use((_request, response, next) => {
    response.set({
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "Referrer-Policy": "no-referrer",
      "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
      "Cross-Origin-Resource-Policy": "same-site",
    });
    if (process.env.NODE_ENV === "production") {
      response.set(
        "Strict-Transport-Security",
        "max-age=31536000; includeSubDomains",
      );
    }
    next();
  });
  app.use(
    cors({
      origin: (
        process.env.CORS_ORIGINS ??
        "http://localhost:3000,http://127.0.0.1:3100"
      )
        .split(",")
        .map((origin) => origin.trim()),
      exposedHeaders: ["PAYMENT-REQUIRED", "PAYMENT-RESPONSE"],
    }),
  );
  app.use(express.json({ limit: "32kb" }));
  app.use(
    rateLimit({
      windowMs: 60_000,
      limit: Number(process.env.RATE_LIMIT_PER_MINUTE ?? 60),
    }),
  );
}
