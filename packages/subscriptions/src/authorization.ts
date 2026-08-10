import {
  agentAuthorizationViewSchema,
  SOLANA_DEVNET,
  SUBSCRIPTIONS_PROGRAM,
  type AgentAuthorizationView,
} from "@usemeterkit/core";
import { address, type Address } from "@solana/kit";
import {
  findFixedDelegationPda,
  findSubscriptionAuthorityPda,
} from "@solana/subscriptions";

export async function deriveFixedAuthorizationAddress(input: {
  owner: Address | string;
  mint: Address | string;
  delegate: Address | string;
  nonce: bigint;
}) {
  const owner = address(input.owner);
  const mint = address(input.mint);
  const [subscriptionAuthority] = await findSubscriptionAuthorityPda({
    user: owner,
    tokenMint: mint,
  });
  const [delegation] = await findFixedDelegationPda({
    subscriptionAuthority,
    delegator: owner,
    delegatee: address(input.delegate),
    nonce: input.nonce,
  });
  return String(delegation);
}

export function buildFixedAuthorizationView(input: {
  authorizationAddress: string;
  owner: string;
  delegate: string;
  assetMint: string;
  recipientScope?: string;
  resourceScopes: string[];
  perRequestLimitAtomic: bigint;
  aggregateLimitAtomic: bigint;
  spentAtomic: bigint;
  startsAt: Date;
  expiresAt: Date;
  status?: AgentAuthorizationView["status"];
  creationTransaction?: string;
  revocationTransaction?: string;
  observedCommitment: AgentAuthorizationView["observedCommitment"];
  observedAt: Date;
}): AgentAuthorizationView {
  return agentAuthorizationViewSchema.parse({
    schemaVersion: 1,
    authorizationAddress: input.authorizationAddress,
    program: SUBSCRIPTIONS_PROGRAM,
    network: SOLANA_DEVNET,
    kind: "fixed",
    owner: input.owner,
    delegate: input.delegate,
    assetMint: input.assetMint,
    ...(input.recipientScope ? { recipientScope: input.recipientScope } : {}),
    resourceScopes: input.resourceScopes.map(normalizeResourceScope),
    perRequestLimitAtomic: String(input.perRequestLimitAtomic),
    aggregateLimitAtomic: String(input.aggregateLimitAtomic),
    spentAtomic: String(input.spentAtomic),
    startsAt: input.startsAt.toISOString(),
    expiresAt: input.expiresAt.toISOString(),
    status: input.status ?? statusAt(input, input.observedAt),
    ...(input.creationTransaction
      ? { creationTransaction: input.creationTransaction }
      : {}),
    ...(input.revocationTransaction
      ? { revocationTransaction: input.revocationTransaction }
      : {}),
    observedCommitment: input.observedCommitment,
    observedAt: input.observedAt.toISOString(),
  });
}

function statusAt(
  input: Pick<
    Parameters<typeof buildFixedAuthorizationView>[0],
    "spentAtomic" | "aggregateLimitAtomic" | "startsAt" | "expiresAt"
  >,
  now: Date,
): AgentAuthorizationView["status"] {
  if (input.expiresAt <= now) return "expired";
  if (input.startsAt > now) return "pending";
  if (input.spentAtomic === input.aggregateLimitAtomic) return "exhausted";
  return "active";
}

function normalizeResourceScope(raw: string) {
  const resource = new URL(raw);
  if (
    !["http:", "https:"].includes(resource.protocol) ||
    resource.username ||
    resource.password ||
    resource.hash
  ) {
    throw new Error("AUTHORIZATION_RESOURCE_INVALID");
  }
  if (resource.pathname.length > 1) {
    resource.pathname = resource.pathname.replace(/\/+$/, "");
  }
  return resource.toString();
}
