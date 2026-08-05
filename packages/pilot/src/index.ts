import { Buffer } from "node:buffer";

export type PilotPolicy = {
  network?: string;
  mint?: string;
  maxAmountAtomic?: string;
  recipient?: string;
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
  const url = parseEndpoint(endpoint);
  const checks: PilotCheck[] = [];
  let requirement: PilotReport["requirement"];

  try {
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
    const accepted = challenge.accepts?.[0];
    if (!accepted) throw new Error("challenge has no accepted payment method");
    requirement = {
      network: requiredString(accepted.network, "network"),
      mint: requiredString(accepted.asset, "asset"),
      amountAtomic: requiredAtomic(accepted.amount),
      recipient: requiredAddress(accepted.payTo, "recipient"),
      scheme: requiredString(accepted.scheme, "scheme"),
      ...(typeof accepted.maxTimeoutSeconds === "number"
        ? { maxTimeoutSeconds: accepted.maxTimeoutSeconds } : {}),
    };
    checks.push({
      name: "x402 challenge decodes",
      ok: challenge.x402Version === 2,
      evidence: { x402Version: challenge.x402Version, scheme: requirement.scheme },
      ...(challenge.x402Version === 2 ? {} : { error: "expected x402Version 2" }),
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
  const output: PilotPolicy = {};
  for (const key of ["network", "mint", "recipient"] as const) {
    if (input[key] !== undefined) output[key] = requiredString(input[key], key);
  }
  if (input.maxAmountAtomic !== undefined) output.maxAmountAtomic = requiredAtomic(input.maxAmountAtomic);
  return output;
}

function parseEndpoint(value: string) {
  const url = new URL(value);
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("endpoint must use http or https");
  if (url.username || url.password) throw new Error("endpoint URL must not contain credentials");
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
  if (!expected) return { name, ok: true, evidence: { actual, enforced: false } };
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
    ok: true,
    evidence: { amountAtomic: actual, enforced: false },
  };
  const ok = BigInt(actual) <= BigInt(maximum);
  return {
    name: "amount is within policy",
    ok,
    evidence: { maximumAtomic: maximum, amountAtomic: actual, enforced: true },
    ...(ok ? {} : { error: "amount exceeds maximum" }),
  };
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
