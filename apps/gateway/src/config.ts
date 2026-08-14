import { SOLANA_DEVNET, productSchema, type Product } from "@usemeterkit/core";

const DEFAULT_USDC_DEVNET_MINT = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
const DEFAULT_LOCAL_GATEWAY = "http://localhost:3402";
const SYSTEM_PROGRAM = "11111111111111111111111111111111";

export type GatewayConfig = {
  port: number;
  publicGatewayUrl: string;
  trustProxyHops: number;
  pilot: {
    maxActiveEngagementsPerOwner: number;
    evidenceRetentionDays: number;
  };
  export: {
    maxRangeDays: number;
    maxRecords: number;
  };
  product: Product;
};

function parsePort(value: string): number {
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error("PORT must be an integer between 1 and 65535");
  }
  return port;
}

function parseBoundedInteger(
  name: string,
  value: string,
  minimum: number,
  maximum: number,
) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < minimum || parsed > maximum) {
    throw new Error(
      `${name} must be an integer between ${minimum} and ${maximum}`,
    );
  }
  return parsed;
}

function parsePublicUrl(value: string): string {
  const url = new URL(value);
  if (url.username || url.password || url.search || url.hash) {
    throw new Error(
      "PUBLIC_GATEWAY_URL must not contain credentials, query or fragment",
    );
  }
  const local = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  if (url.protocol !== "https:" && !(local && url.protocol === "http:")) {
    throw new Error("PUBLIC_GATEWAY_URL must use HTTPS outside localhost");
  }
  return url.toString().replace(/\/$/, "");
}

export function loadGatewayConfig(
  env: NodeJS.ProcessEnv = process.env,
): GatewayConfig {
  const requestedNetwork = env.METERKIT_NETWORK ?? "solana-devnet";
  if (requestedNetwork !== "solana-devnet") {
    throw new Error("MeterKit hosted demo only supports solana-devnet");
  }

  const port = parsePort(env.PORT ?? env.GATEWAY_PORT ?? "3402");
  const trustProxyHops = Number(env.TRUST_PROXY_HOPS ?? "0");
  if (
    !Number.isInteger(trustProxyHops) ||
    trustProxyHops < 0 ||
    trustProxyHops > 3
  ) {
    throw new Error("TRUST_PROXY_HOPS must be an integer between 0 and 3");
  }
  const publicGatewayUrl = parsePublicUrl(
    env.PUBLIC_GATEWAY_URL ?? DEFAULT_LOCAL_GATEWAY,
  );
  const payTo = env.MERCHANT_WALLET ?? SYSTEM_PROGRAM;

  return {
    port,
    publicGatewayUrl,
    trustProxyHops,
    pilot: {
      maxActiveEngagementsPerOwner: parseBoundedInteger(
        "PILOT_MAX_ACTIVE_PER_OWNER",
        env.PILOT_MAX_ACTIVE_PER_OWNER ?? "10",
        1,
        100,
      ),
      evidenceRetentionDays: parseBoundedInteger(
        "PILOT_EVIDENCE_RETENTION_DAYS",
        env.PILOT_EVIDENCE_RETENTION_DAYS ?? "365",
        7,
        730,
      ),
    },
    export: {
      maxRangeDays: parseBoundedInteger(
        "SETTLEMENT_EXPORT_MAX_RANGE_DAYS",
        env.SETTLEMENT_EXPORT_MAX_RANGE_DAYS ?? "90",
        1,
        90,
      ),
      maxRecords: parseBoundedInteger(
        "SETTLEMENT_EXPORT_MAX_RECORDS",
        env.SETTLEMENT_EXPORT_MAX_RECORDS ?? "10000",
        1,
        10_000,
      ),
    },
    product: productSchema.parse({
      id: "premium-weather",
      name: "Premium Weather API",
      description: "Pronóstico compacto con procedencia y hora de consulta",
      resource: `${publicGatewayUrl}/v1/weather/premium`,
      priceAtomic: "10000",
      assetMint: env.USDC_MINT || DEFAULT_USDC_DEVNET_MINT,
      payTo,
      network: SOLANA_DEVNET,
    }),
  };
}

export function requirePersistentMerchant(
  env: NodeJS.ProcessEnv = process.env,
): void {
  if (
    env.DATABASE_URL &&
    (!env.MERCHANT_WALLET || env.MERCHANT_WALLET === SYSTEM_PROGRAM)
  ) {
    throw new Error(
      "MERCHANT_WALLET is required when PostgreSQL persistence is enabled",
    );
  }
}
