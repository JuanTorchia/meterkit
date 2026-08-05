import { Buffer } from "node:buffer";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

export const SOLANA_DEVNET_NETWORK = "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1";
export const SOLANA_DEVNET_USDC_MINT = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";

export type PilotPolicy = {
  network?: string;
  mint?: string;
  maxAmountAtomic?: string;
  recipient?: string;
  allowLocalhost?: boolean;
};

export type PilotCheck = {
  name: string;
  ok: boolean;
  evidence?: Record<string, unknown>;
  error?: string;
};

export type PilotReport = {
  schemaVersion: 1;
  kind: "meterkit-external-endpoint-readiness";
  passed: boolean;
  checkedAt: string;
  endpoint: string;
  checks: PilotCheck[];
  requirement?: {
    network: string;
    mint: string;
    amountAtomic: string;
    recipient: string;
    scheme: string;
    maxTimeoutSeconds?: number;
  };
  notice: string;
};

type FetchLike = typeof globalThis.fetch;

export async function verifyEndpoint(
  endpoint: string,
  policy: PilotPolicy = {},
  fetcher: FetchLike = globalThis.fetch,
): Promise<PilotReport> {
  const checks: PilotCheck[] = [];
  let requirement: PilotReport["requirement"];
  let url = endpoint;

  try {
    url = await parseEndpoint(endpoint, policy.allowLocalhost === true, fetcher === globalThis.fetch);
    const response = await fetcher(url, {
      method: "GET",
      redirect: "manual",
      signal: globalThis.AbortSignal.timeout(15_000),
      headers: { "user-agent": "meterkit-pilot/0.1" },
    });
    checks.push({
      name: "unpaid request returns HTTP 402",
      ok: response.status === 402,
      evidence: { status: response.status },
      ...(response.status === 402 ? {} : { error: `expected 402, received ${response.status}` }),
    });

    const encoded = response.headers.get("payment-required");
    checks.push({
      name: "PAYMENT-REQUIRED header is present",
      ok: Boolean(encoded),
      evidence: { present: Boolean(encoded) },
      ...(encoded ? {} : { error: "header missing" }),
    });
    if (!encoded) return report(url, checks);

    const challenge = decodeRequirement(encoded);
    const candidates = (challenge.accepts ?? []).flatMap((accepted) => {
      try {
        return [parseRequirement(accepted)];
      } catch {
        return [];
      }
    });
    if (!candidates.length) throw new Error("challenge has no accepted payment method");
    requirement = selectRequirement(candidates, policy);
    checks.push({
      name: "x402 challenge decodes",
      ok: challenge.x402Version === 2,
      evidence: { x402Version: challenge.x402Version, scheme: requirement.scheme },
      ...(challenge.x402Version === 2 ? {} : { error: "expected x402Version 2" }),
    });
    checks.push({
      name: "payment scheme is exact",
      ok: requirement.scheme === "exact",
      evidence: { actual: requirement.scheme },
      ...(requirement.scheme === "exact" ? {} : { error: "expected exact payment scheme" }),
    });
    checks.push({
      name: "network is supported Solana devnet",
      ok: requirement.network === SOLANA_DEVNET_NETWORK,
      evidence: { expected: SOLANA_DEVNET_NETWORK, actual: requirement.network },
      ...(requirement.network === SOLANA_DEVNET_NETWORK ? {} : { error: "unsupported Solana network" }),
    });
    checks.push({
      name: "asset is supported devnet USDC",
      ok: requirement.mint === SOLANA_DEVNET_USDC_MINT,
      evidence: { expected: SOLANA_DEVNET_USDC_MINT, actual: requirement.mint },
      ...(requirement.mint === SOLANA_DEVNET_USDC_MINT ? {} : { error: "unsupported USDC mint" }),
    });
    checks.push(policyCheck("network matches policy", policy.network, requirement.network));
    checks.push(policyCheck("USDC mint matches policy", policy.mint, requirement.mint));
    checks.push(policyCheck("recipient matches policy", policy.recipient, requirement.recipient));
    checks.push(maximumCheck(policy.maxAmountAtomic, requirement.amountAtomic));
  } catch (cause) {
    checks.push({
      name: "endpoint can be verified safely",
      ok: false,
      error: cause instanceof Error ? cause.message : String(cause),
    });
  }
  return report(url, checks, requirement);
}

export function parsePolicy(value: unknown): PilotPolicy {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("policy must be a JSON object");
  const input = value as Record<string, unknown>;
  const allowed = new Set(["network", "mint", "recipient", "maxAmountAtomic", "allowLocalhost"]);
  const unknown = Object.keys(input).filter((key) => !allowed.has(key));
  if (unknown.length) throw new Error(`policy contains unknown field${unknown.length === 1 ? "" : "s"}: ${unknown.join(", ")}`);
  const output: PilotPolicy = {};
  for (const key of ["network", "mint", "recipient"] as const) {
    if (input[key] !== undefined) output[key] = requiredString(input[key], key);
  }
  if (input.maxAmountAtomic !== undefined) output.maxAmountAtomic = requiredAtomic(input.maxAmountAtomic);
  if (input.allowLocalhost !== undefined) {
    if (typeof input.allowLocalhost !== "boolean") throw new Error("allowLocalhost must be a boolean");
    output.allowLocalhost = input.allowLocalhost;
  }
  return output;
}

async function parseEndpoint(value: string, allowLocalhost: boolean, resolveHostname: boolean) {
  const url = new URL(value);
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("endpoint must use http or https");
  if (url.username || url.password) throw new Error("endpoint URL must not contain credentials");
  const hostname = url.hostname.toLowerCase().replace(/\.$/, "");
  const localName = hostname === "localhost" || hostname.endsWith(".localhost");
  const loopback = isLoopbackAddress(hostname);
  if ((localName || loopback) && !allowLocalhost) {
    throw new Error("localhost endpoints are blocked; set policy.allowLocalhost to true for local development");
  }
  if (localName || loopback) return url.toString();
  if (url.protocol !== "https:") {
    throw new Error("public endpoints must use https; http is allowed only for explicit localhost development");
  }
  if (isBlockedAddress(hostname)) throw new Error("endpoint resolves to a private, loopback, link-local or reserved address");
  if (resolveHostname && isIP(hostname) === 0) {
    const addresses = await lookup(hostname, { all: true, verbatim: true });
    if (!addresses.length || addresses.some(({ address }) => isBlockedAddress(address))) {
      throw new Error("endpoint resolves to a private, loopback, link-local or reserved address");
    }
  }
  return url.toString();
}

function decodeRequirement(value: string) {
  try {
    return JSON.parse(Buffer.from(value, "base64").toString("utf8")) as {
      x402Version?: number;
      accepts?: Array<Record<string, unknown>>;
    };
  } catch {
    throw new Error("PAYMENT-REQUIRED is not valid base64 JSON");
  }
}

function requiredString(value: unknown, name: string) {
  if (typeof value !== "string" || value.length === 0) throw new Error(`${name} must be a non-empty string`);
  return value;
}

function requiredAtomic(value: unknown) {
  const amount = requiredString(value, "amount");
  if (!/^\d+$/.test(amount) || BigInt(amount) <= 0n) throw new Error("amount must be a positive atomic integer");
  return amount;
}

function requiredAddress(value: unknown, name: string) {
  const address = requiredString(value, name);
  if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)) throw new Error(`${name} is not a Solana address`);
  return address;
}

function policyCheck(name: string, expected: string | undefined, actual: string): PilotCheck {
  if (!expected) return {
    name,
    ok: false,
    evidence: { actual, enforced: false },
    error: "required policy value is missing",
  };
  return {
    name,
    ok: expected === actual,
    evidence: { expected, actual, enforced: true },
    ...(expected === actual ? {} : { error: "policy mismatch" }),
  };
}

function maximumCheck(maximum: string | undefined, actual: string): PilotCheck {
  if (!maximum) return {
    name: "amount is within policy",
    ok: false,
    evidence: { amountAtomic: actual, enforced: false },
    error: "required policy maximum is missing",
  };
  const ok = BigInt(actual) <= BigInt(maximum);
  return {
    name: "amount is within policy",
    ok,
    evidence: { maximumAtomic: maximum, amountAtomic: actual, enforced: true },
    ...(ok ? {} : { error: "amount exceeds maximum" }),
  };
}

function parseRequirement(accepted: Record<string, unknown>): NonNullable<PilotReport["requirement"]> {
  return {
    network: requiredString(accepted.network, "network"),
    mint: requiredString(accepted.asset, "asset"),
    amountAtomic: requiredAtomic(accepted.amount),
    recipient: requiredAddress(accepted.payTo, "recipient"),
    scheme: requiredString(accepted.scheme, "scheme"),
    ...(typeof accepted.maxTimeoutSeconds === "number"
      ? { maxTimeoutSeconds: accepted.maxTimeoutSeconds } : {}),
  };
}

function selectRequirement(
  candidates: Array<NonNullable<PilotReport["requirement"]>>,
  policy: PilotPolicy,
) {
  return candidates.find((candidate) =>
    candidate.scheme === "exact" &&
    (!policy.network || candidate.network === policy.network) &&
    (!policy.mint || candidate.mint === policy.mint) &&
    (!policy.recipient || candidate.recipient === policy.recipient) &&
    (!policy.maxAmountAtomic || BigInt(candidate.amountAtomic) <= BigInt(policy.maxAmountAtomic))
  ) ?? candidates.find((candidate) => candidate.scheme === "exact") ?? candidates[0]!;
}

function isBlockedAddress(value: string): boolean {
  const normalized = value.toLowerCase().replace(/^\[|\]$/g, "");
  const version = isIP(normalized);
  if (version === 4) {
    const [a, b] = normalized.split(".").map(Number);
    return a === 0 || a === 10 || a === 127 ||
      (a === 100 && b! >= 64 && b! <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b! >= 16 && b! <= 31) ||
      (a === 192 && b === 0) ||
      (a === 192 && b === 168) ||
      (a === 198 && (b === 18 || b === 19)) ||
      a! >= 224;
  }
  if (version === 6) {
    if (normalized === "::" || normalized === "::1") return true;
    if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true;
    if (/^fe[89ab]/.test(normalized)) return true;
    const mapped = normalized.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)?.[1];
    return mapped ? isBlockedAddress(mapped) : false;
  }
  return false;
}

function isLoopbackAddress(value: string) {
  const normalized = value.toLowerCase().replace(/^\[|\]$/g, "");
  if (normalized === "::1") return true;
  if (isIP(normalized) !== 4) return false;
  return Number(normalized.split(".")[0]) === 127;
}

function report(endpoint: string, checks: PilotCheck[], requirement?: PilotReport["requirement"]): PilotReport {
  return {
    schemaVersion: 1,
    kind: "meterkit-external-endpoint-readiness",
    passed: checks.length > 0 && checks.every((check) => check.ok),
    checkedAt: new Date().toISOString(),
    endpoint,
    checks,
    ...(requirement ? { requirement } : {}),
    notice: "No wallet, private key, seed phrase, payment proof or mainnet asset was used. This verifies readiness, not a completed settlement.",
  };
}
