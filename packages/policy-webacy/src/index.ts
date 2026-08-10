import {
  policyDecisionSchema,
  type PaymentPolicyEvaluator,
  type PolicyDecision,
  type PolicyEvaluationInput,
} from "@usemeterkit/core";
import { z } from "zod";

const OFFICIAL_ORIGINS = new Set([
  "https://api.webacy.com",
  "https://api-development.webacy.com",
]);

const responseSchema = z.object({
  overallRisk: z.number().finite().min(0).max(100),
  analyzed_at: z.string().datetime().optional(),
  issues: z.array(z.unknown()).default([]),
}).passthrough();

export type WebacyPolicyOptions = {
  id: string;
  apiKey: string;
  baseUrl?: string;
  warnAt?: number;
  denyAt?: number;
  maxResponseBytes?: number;
  fetch?: typeof globalThis.fetch;
};

export function createWebacyPolicy(options: WebacyPolicyOptions): PaymentPolicyEvaluator {
  const base = new URL(options.baseUrl ?? "https://api.webacy.com");
  if (base.protocol !== "https:" || base.username || base.password || !OFFICIAL_ORIGINS.has(base.origin)) {
    throw new Error("WEBACY_ORIGIN_INVALID");
  }
  if (!options.apiKey.trim()) throw new Error("WEBACY_API_KEY_REQUIRED");
  const warnAt = options.warnAt ?? 25;
  const denyAt = options.denyAt ?? 70;
  if (!(warnAt >= 0 && warnAt < denyAt && denyAt <= 100)) throw new Error("WEBACY_THRESHOLDS_INVALID");
  const maxBytes = options.maxResponseBytes ?? 32_768;
  if (maxBytes < 1_024 || maxBytes > 65_536) throw new Error("WEBACY_SIZE_LIMIT_INVALID");
  const request = options.fetch ?? globalThis.fetch;

  return {
    id: options.id,
    async evaluate(input: PolicyEvaluationInput, signal: AbortSignal): Promise<PolicyDecision> {
      if (!input.payer) throw new Error("WEBACY_ADDRESS_UNAVAILABLE");
      const url = new URL(`/addresses/${encodeURIComponent(input.payer)}`, base);
      url.searchParams.set("chain", "sol");
      url.searchParams.set("modules", "security_essentials,solana_specific,sanctions_compliance");
      const result = await request(url.toString(), {
        method: "GET",
        headers: { "x-api-key": options.apiKey },
        signal,
      });
      if (!result.ok) throw new Error(`WEBACY_HTTP_${result.status}`);
      const declared = Number(result.headers.get("content-length"));
      if (Number.isFinite(declared) && declared > maxBytes) throw new Error("WEBACY_RESPONSE_TOO_LARGE");
      const bytes = new Uint8Array(await result.arrayBuffer());
      if (bytes.byteLength > maxBytes) throw new Error("WEBACY_RESPONSE_TOO_LARGE");
      const data = responseSchema.parse(JSON.parse(new TextDecoder().decode(bytes)));
      const outcome = data.overallRisk >= denyAt ? "deny" : data.overallRisk >= warnAt ? "warn" : "allow";
      const reason = outcome === "deny" ? "WEBACY_HIGH_RISK" : outcome === "warn" ? "WEBACY_REVIEW" : "WEBACY_CLEAR";
      return policyDecisionSchema.parse({
        policyId: options.id,
        provider: "webacy",
        outcome,
        reasonCodes: [reason],
        confidence: Math.min(1, data.overallRisk / 100),
        evaluatedAt: new Date().toISOString(),
        ...(data.analyzed_at ? { freshUntil: data.analyzed_at } : {}),
        metadata: { overallRisk: data.overallRisk, issueCount: data.issues.length },
      });
    },
  };
}
