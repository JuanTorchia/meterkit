import {
  agentAuthorizationViewSchema,
  SOLANA_DEVNET,
  SUBSCRIPTIONS_PROGRAM,
} from "@usemeterkit/core";
import type { AgentAllowanceRecord } from "@usemeterkit/database";

export function toHostedAuthorization(record: AgentAllowanceRecord) {
  const spent = BigInt(record.spentAtomic ?? "0");
  const reserved = BigInt(record.reservedAtomic ?? "0");
  const aggregate = BigInt(record.maxAtomic);
  const now = new Date();
  const status = record.revokedAt
    ? "revoked"
    : new Date(record.expiresAt) <= now
      ? "expired"
      : (record.status ?? "unknown");
  const view = agentAuthorizationViewSchema.parse({
    schemaVersion: 1,
    authorizationAddress: record.address,
    program: SUBSCRIPTIONS_PROGRAM,
    network: SOLANA_DEVNET,
    kind: "fixed",
    owner: record.ownerWallet,
    delegate: record.delegateWallet,
    assetMint: record.mint,
    ...(record.recipientScope ? { recipientScope: record.recipientScope } : {}),
    resourceScopes: record.resourceScopes ?? [],
    perRequestLimitAtomic: record.perRequestAtomic ?? record.maxAtomic,
    aggregateLimitAtomic: record.maxAtomic,
    spentAtomic: String(spent),
    startsAt: record.startsAt ?? now.toISOString(),
    expiresAt: record.expiresAt,
    status,
    ...(record.signature ? { creationTransaction: record.signature } : {}),
    ...(record.revocationSignature
      ? { revocationTransaction: record.revocationSignature }
      : {}),
    observedCommitment: record.observedCommitment ?? "unknown",
    observedAt: record.observedAt ?? now.toISOString(),
  });
  return {
    ...view,
    reservedAtomic: String(reserved),
    remainingCapacityAtomic: String(aggregate - spent - reserved),
  };
}
