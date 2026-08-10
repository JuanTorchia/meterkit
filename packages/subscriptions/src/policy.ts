import {
  agentAuthorizationViewSchema,
  type AgentAuthorizationView,
} from "@usemeterkit/core";

export type AgentSpendRequest = {
  owner: string;
  delegate: string;
  network: string;
  assetMint: string;
  recipient: string;
  resource: string;
  amountAtomic: bigint;
  now?: Date;
};

export type AgentSpendDecision =
  | { allowed: true; code: "AUTHORIZED"; remainingAtomic: bigint }
  | { allowed: false; code: string; remainingAtomic: bigint };

export function evaluateAgentSpend(
  rawAuthorization: AgentAuthorizationView,
  request: AgentSpendRequest,
): AgentSpendDecision {
  const authorization = agentAuthorizationViewSchema.parse(rawAuthorization);
  const spent = BigInt(authorization.spentAtomic);
  const aggregate = BigInt(authorization.aggregateLimitAtomic);
  const remaining = aggregate - spent;
  const reject = (code: string): AgentSpendDecision => ({
    allowed: false,
    code,
    remainingAtomic: remaining,
  });
  if (
    authorization.observedCommitment !== "finalized" ||
    authorization.status === "unknown" ||
    authorization.status === "pending"
  )
    return reject("FINALITY_REQUIRED");
  if (
    authorization.status === "revoked" ||
    authorization.status === "revocation_pending"
  )
    return reject("AUTHORIZATION_REVOKED");
  if (authorization.status === "failed") return reject("AUTHORIZATION_FAILED");
  if (authorization.owner !== request.owner) return reject("OWNER_MISMATCH");
  if (authorization.delegate !== request.delegate)
    return reject("DELEGATE_MISMATCH");
  if (authorization.network !== request.network)
    return reject("NETWORK_MISMATCH");
  if (authorization.assetMint !== request.assetMint)
    return reject("ASSET_MISMATCH");
  if (
    authorization.recipientScope &&
    authorization.recipientScope !== request.recipient
  )
    return reject("RECIPIENT_MISMATCH");
  if (
    !authorization.resourceScopes.includes(normalizeResource(request.resource))
  )
    return reject("RESOURCE_OUT_OF_SCOPE");
  const now = request.now ?? new Date();
  if (Date.parse(authorization.expiresAt) <= now.getTime())
    return reject("AUTHORIZATION_EXPIRED");
  if (Date.parse(authorization.startsAt) > now.getTime())
    return reject("AUTHORIZATION_NOT_STARTED");
  if (request.amountAtomic <= 0n) return reject("AMOUNT_INVALID");
  if (request.amountAtomic > BigInt(authorization.perRequestLimitAtomic))
    return reject("PER_REQUEST_LIMIT_EXCEEDED");
  if (request.amountAtomic > remaining || authorization.status === "exhausted")
    return reject("AGGREGATE_LIMIT_EXCEEDED");
  return {
    allowed: true,
    code: "AUTHORIZED",
    remainingAtomic: remaining - request.amountAtomic,
  };
}

function normalizeResource(raw: string) {
  try {
    const resource = new URL(raw);
    if (
      !["http:", "https:"].includes(resource.protocol) ||
      resource.username ||
      resource.password ||
      resource.hash
    )
      return "";
    if (resource.pathname.length > 1)
      resource.pathname = resource.pathname.replace(/\/+$/, "");
    return resource.toString();
  } catch {
    return "";
  }
}
