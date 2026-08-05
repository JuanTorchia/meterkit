import type { NextConfig } from "next";

function configuredOrigin(value: string | undefined, name: string) {
  if (!value) return undefined;
  const url = new URL(value);
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) {
    throw new Error(`${name} must be an http(s) URL without embedded credentials`);
  }
  return url.origin;
}

const connectSources = new Set([
  "'self'",
  "https://meterkit-api.juanchi.dev",
  "https://api.devnet.solana.com",
  "https://cloudflareinsights.com",
  ...(process.env.NODE_ENV === "development"
    ? ["http://127.0.0.1:3402", "http://localhost:3402"]
    : []),
  configuredOrigin(process.env.NEXT_PUBLIC_GATEWAY_URL, "NEXT_PUBLIC_GATEWAY_URL"),
  configuredOrigin(process.env.NEXT_PUBLIC_SOLANA_RPC_URL, "NEXT_PUBLIC_SOLANA_RPC_URL"),
].filter((origin): origin is string => Boolean(origin)));

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "object-src 'none'",
  "img-src 'self' data:",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  `script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""}`,
  `connect-src ${[...connectSources].join(" ")}`,
].join("; ");

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: ["127.0.0.1"],
  poweredByHeader: false,
  async headers() {
    return [{
      source: "/(.*)",
      headers: [
        { key: "Content-Security-Policy", value: contentSecurityPolicy },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
        ...(process.env.NODE_ENV === "production"
          ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }]
          : []),
      ],
    }];
  },
};

export default nextConfig;
