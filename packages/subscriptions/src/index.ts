import { SUBSCRIPTIONS_PROGRAM } from "@meterkit/core";
import {
  address,
  appendTransactionMessageInstruction,
  blockhash,
  compileTransaction,
  createNoopSigner,
  createTransactionMessage,
  getTransactionEncoder,
  setTransactionMessageFeePayer,
  setTransactionMessageLifetimeUsingBlockhash,
  type Address,
  type Instruction,
  type TransactionSigner,
} from "@solana/kit";
import {
  getCreateFixedDelegationOverlayInstructionAsync,
  getCreateRecurringDelegationOverlayInstructionAsync,
  getCreatePlanOverlayInstructionAsync,
  getSubscribeOverlayInstructionAsync,
  getRevokeDelegationOverlayInstruction,
  getRevokeSubscriptionOverlayInstruction,
  getRevokeSubscriptionAuthorityOverlayInstructionAsync,
} from "@solana/subscriptions";

export type AllowancePolicy = {
  maxAtomic: bigint;
  expiresAt: Date;
  periodSeconds?: bigint;
};

export function assertAllowancePolicy(policy: AllowancePolicy, now = new Date()) {
  if (policy.maxAtomic <= 0n) throw new Error("ALLOWANCE_AMOUNT_INVALID");
  if (policy.expiresAt <= now) throw new Error("ALLOWANCE_EXPIRED");
  if (policy.periodSeconds !== undefined && policy.periodSeconds <= 0n) {
    throw new Error("ALLOWANCE_PERIOD_INVALID");
  }
  return policy;
}

export const subscriptionsIntegration = {
  programId: SUBSCRIPTIONS_PROGRAM,
  package: "@solana/subscriptions",
  version: "0.4.0",
  supported: ["fixed", "recurring", "plan"] as const,
  // Instruction builders are deliberately exposed by the upstream SDK rather than
  // wrapped with hidden signing. MeterKit never receives a user's private key.
  revokeMethods: [
    "getRevokeDelegationOverlayInstruction",
    "getRevokeSubscriptionOverlayInstruction",
    "getRevokeSubscriptionAuthorityOverlayInstructionAsync",
  ] as const,
};

export async function buildFixedAllowance(input: {
  owner: TransactionSigner;
  payer?: TransactionSigner;
  mint: Address;
  delegate: Address;
  maxAtomic: bigint;
  expiresAt: Date;
  nonce: bigint;
  authorityInitId: bigint;
}): Promise<Instruction> {
  assertAllowancePolicy({ maxAtomic: input.maxAtomic, expiresAt: input.expiresAt });
  return getCreateFixedDelegationOverlayInstructionAsync({
    delegator: input.owner,
    ...(input.payer ? { payer: input.payer } : {}),
    tokenMint: input.mint,
    delegatee: input.delegate,
    amount: input.maxAtomic,
    expiryTs: toUnixSeconds(input.expiresAt),
    nonce: input.nonce,
    expectedSubscriptionAuthorityInitId: input.authorityInitId,
  });
}

export async function buildRecurringAllowance(input: {
  owner: TransactionSigner;
  payer?: TransactionSigner;
  mint: Address;
  delegate: Address;
  maxPerPeriodAtomic: bigint;
  periodSeconds: bigint;
  startsAt: Date;
  expiresAt: Date;
  nonce: bigint;
  authorityInitId: bigint;
}): Promise<Instruction> {
  assertAllowancePolicy({
    maxAtomic: input.maxPerPeriodAtomic,
    expiresAt: input.expiresAt,
    periodSeconds: input.periodSeconds,
  });
  if (input.startsAt >= input.expiresAt) throw new Error("ALLOWANCE_START_AFTER_EXPIRY");
  return getCreateRecurringDelegationOverlayInstructionAsync({
    delegator: input.owner,
    ...(input.payer ? { payer: input.payer } : {}),
    tokenMint: input.mint,
    delegatee: input.delegate,
    amountPerPeriod: input.maxPerPeriodAtomic,
    periodLengthS: input.periodSeconds,
    startTs: toUnixSeconds(input.startsAt),
    expiryTs: toUnixSeconds(input.expiresAt),
    nonce: input.nonce,
    expectedSubscriptionAuthorityInitId: input.authorityInitId,
  });
}

export async function buildMonthlyPlan(input: {
  merchant: TransactionSigner;
  mint: Address;
  amountAtomic: bigint;
  destination: Address;
  planId: bigint;
  metadataUri: string;
  endsAt?: Date;
  pullers?: Address[];
}): Promise<Instruction> {
  if (input.amountAtomic <= 0n) throw new Error("PLAN_AMOUNT_INVALID");
  return getCreatePlanOverlayInstructionAsync({
    owner: input.merchant,
    mint: input.mint,
    amount: input.amountAtomic,
    destinations: [input.destination],
    pullers: input.pullers ?? [],
    periodHours: 720n,
    endTs: input.endsAt ? toUnixSeconds(input.endsAt) : 0n,
    planId: input.planId,
    metadataUri: input.metadataUri,
  });
}

export async function buildSubscribe(input: {
  subscriber: TransactionSigner;
  payer?: TransactionSigner;
  merchant: Address;
  mint: Address;
  planId: bigint;
  expectedAmountAtomic: bigint;
  expectedPeriodHours?: bigint;
  expectedCreatedAt: bigint;
  authorityInitId: bigint;
}): Promise<Instruction> {
  return getSubscribeOverlayInstructionAsync({
    subscriber: input.subscriber,
    ...(input.payer ? { payer: input.payer } : {}),
    merchant: input.merchant,
    tokenMint: input.mint,
    planId: input.planId,
    expectedAmount: input.expectedAmountAtomic,
    expectedPeriodHours: input.expectedPeriodHours ?? 720n,
    expectedCreatedAt: input.expectedCreatedAt,
    expectedSubscriptionAuthorityInitId: input.authorityInitId,
  });
}

export function buildRevokeDelegation(input: {
  owner: TransactionSigner;
  delegationAccount: Address;
  rentReceiver?: Address;
}) {
  return getRevokeDelegationOverlayInstruction({
    authority: input.owner,
    delegationAccount: input.delegationAccount,
    ...(input.rentReceiver ? { receiver: input.rentReceiver } : {}),
  });
}

/**
 * Produces a version-0 unsigned wire transaction suitable for Wallet Standard's
 * `solana:signAndSendTransaction`. No private key enters MeterKit.
 */
export function buildRevokeDelegationTransaction(input: {
  ownerAddress: string;
  delegationAccount: string;
  recentBlockhash: string;
  lastValidBlockHeight: bigint;
}) {
  const owner = address(input.ownerAddress);
  const instruction = buildRevokeDelegation({
    owner: createNoopSigner(owner),
    delegationAccount: address(input.delegationAccount),
  });
  return compileWalletInstruction(owner, instruction, input);
}

export async function buildFixedAllowanceTransaction(input: {
  ownerAddress: string;
  mint: string;
  delegate: string;
  maxAtomic: bigint;
  expiresAt: Date;
  nonce: bigint;
  authorityInitId: bigint;
  recentBlockhash: string;
  lastValidBlockHeight: bigint;
}) {
  const owner = address(input.ownerAddress);
  const instruction = await buildFixedAllowance({
    owner: createNoopSigner(owner),
    mint: address(input.mint),
    delegate: address(input.delegate),
    maxAtomic: input.maxAtomic,
    expiresAt: input.expiresAt,
    nonce: input.nonce,
    authorityInitId: input.authorityInitId,
  });
  return compileWalletInstruction(owner, instruction, input);
}

export async function buildRecurringAllowanceTransaction(input: {
  ownerAddress: string;
  mint: string;
  delegate: string;
  maxPerPeriodAtomic: bigint;
  periodSeconds: bigint;
  startsAt: Date;
  expiresAt: Date;
  nonce: bigint;
  authorityInitId: bigint;
  recentBlockhash: string;
  lastValidBlockHeight: bigint;
}) {
  const owner = address(input.ownerAddress);
  const instruction = await buildRecurringAllowance({
    owner: createNoopSigner(owner),
    mint: address(input.mint),
    delegate: address(input.delegate),
    maxPerPeriodAtomic: input.maxPerPeriodAtomic,
    periodSeconds: input.periodSeconds,
    startsAt: input.startsAt,
    expiresAt: input.expiresAt,
    nonce: input.nonce,
    authorityInitId: input.authorityInitId,
  });
  return compileWalletInstruction(owner, instruction, input);
}

export async function buildMonthlyPlanTransaction(input: {
  merchantAddress: string;
  mint: string;
  amountAtomic: bigint;
  destination: string;
  planId: bigint;
  metadataUri: string;
  recentBlockhash: string;
  lastValidBlockHeight: bigint;
}) {
  const merchant = address(input.merchantAddress);
  const instruction = await buildMonthlyPlan({
    merchant: createNoopSigner(merchant),
    mint: address(input.mint),
    amountAtomic: input.amountAtomic,
    destination: address(input.destination),
    planId: input.planId,
    metadataUri: input.metadataUri,
  });
  return compileWalletInstruction(merchant, instruction, input);
}

export async function buildSubscribeTransaction(input: {
  subscriberAddress: string;
  merchant: string;
  mint: string;
  planId: bigint;
  expectedAmountAtomic: bigint;
  expectedCreatedAt: bigint;
  authorityInitId: bigint;
  recentBlockhash: string;
  lastValidBlockHeight: bigint;
}) {
  const subscriber = address(input.subscriberAddress);
  const instruction = await buildSubscribe({
    subscriber: createNoopSigner(subscriber),
    merchant: address(input.merchant),
    mint: address(input.mint),
    planId: input.planId,
    expectedAmountAtomic: input.expectedAmountAtomic,
    expectedCreatedAt: input.expectedCreatedAt,
    authorityInitId: input.authorityInitId,
  });
  return compileWalletInstruction(subscriber, instruction, input);
}

export function buildRevokeSubscription(input: {
  owner: TransactionSigner;
  plan: Address;
  subscription: Address;
  rentReceiver?: Address;
}) {
  return getRevokeSubscriptionOverlayInstruction({
    authority: input.owner,
    planPda: input.plan,
    subscriptionPda: input.subscription,
    ...(input.rentReceiver ? { receiver: input.rentReceiver } : {}),
  });
}

export async function buildRevokeAllForMint(input: {
  owner: TransactionSigner;
  mint: Address;
  tokenProgram: Address;
  rentReceiver?: Address;
}) {
  return getRevokeSubscriptionAuthorityOverlayInstructionAsync({
    user: input.owner,
    tokenMint: input.mint,
    tokenProgram: input.tokenProgram,
    ...(input.rentReceiver ? { receiver: input.rentReceiver } : {}),
  });
}

function toUnixSeconds(date: Date) {
  if (!Number.isFinite(date.getTime())) throw new Error("DATE_INVALID");
  return BigInt(Math.floor(date.getTime() / 1_000));
}

function compileWalletInstruction(
  feePayer: Address,
  instruction: Instruction,
  lifetime: { recentBlockhash: string; lastValidBlockHeight: bigint },
) {
  const message = appendTransactionMessageInstruction(
    instruction,
    setTransactionMessageLifetimeUsingBlockhash(
      {
        blockhash: blockhash(lifetime.recentBlockhash),
        lastValidBlockHeight: lifetime.lastValidBlockHeight,
      },
      setTransactionMessageFeePayer(feePayer, createTransactionMessage({ version: 0 })),
    ),
  );
  return getTransactionEncoder().encode(compileTransaction(message));
}
