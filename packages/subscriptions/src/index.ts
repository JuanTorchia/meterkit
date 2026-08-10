import { SUBSCRIPTIONS_PROGRAM } from "@usemeterkit/core";
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
  getInitSubscriptionAuthorityOverlayInstructionAsync,
  getCreateRecurringDelegationOverlayInstructionAsync,
  getCreatePlanOverlayInstructionAsync,
  getSubscribeOverlayInstructionAsync,
  getTransferFixedOverlayInstructionAsync,
  getTransferSubscriptionOverlayInstructionAsync,
  getCancelSubscriptionOverlayInstructionAsync,
  getRevokeAbandonedSubscriptionInstruction,
  getRevokeDelegationOverlayInstruction,
  getRevokeSubscriptionOverlayInstruction,
  getRevokeSubscriptionAuthorityOverlayInstructionAsync,
} from "@solana/subscriptions";

export * from "./authorization.js";
export * from "./policy.js";

/** Native plans use fixed hours; 720 hours is a 30-day billing period, not a calendar month. */
export const THIRTY_DAY_PERIOD_HOURS = 720n;

export type AllowancePolicy = {
  maxAtomic: bigint;
  expiresAt: Date;
  periodSeconds?: bigint;
};

export type AllowanceConstraints = {
  maxAtomic: bigint;
  maxDurationSeconds: bigint;
  minPeriodSeconds: bigint;
};

export const DEFAULT_AGENT_ALLOWANCE_CONSTRAINTS: AllowanceConstraints = {
  maxAtomic: 100_000_000n, // 100 USDC at six decimals.
  maxDurationSeconds: 90n * 24n * 60n * 60n,
  minPeriodSeconds: 60n,
};

export function assertAllowancePolicy(
  policy: AllowancePolicy,
  now = new Date(),
  constraints = DEFAULT_AGENT_ALLOWANCE_CONSTRAINTS,
) {
  if (policy.maxAtomic <= 0n) throw new Error("ALLOWANCE_AMOUNT_INVALID");
  if (policy.maxAtomic > constraints.maxAtomic)
    throw new Error("ALLOWANCE_AMOUNT_EXCEEDS_POLICY");
  if (policy.expiresAt <= now) throw new Error("ALLOWANCE_EXPIRED");
  const durationSeconds = BigInt(
    Math.ceil((policy.expiresAt.getTime() - now.getTime()) / 1_000),
  );
  if (durationSeconds > constraints.maxDurationSeconds) {
    throw new Error("ALLOWANCE_DURATION_EXCEEDS_POLICY");
  }
  if (policy.periodSeconds !== undefined) {
    if (
      policy.periodSeconds < constraints.minPeriodSeconds ||
      policy.periodSeconds > durationSeconds
    ) {
      throw new Error("ALLOWANCE_PERIOD_INVALID");
    }
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

export async function buildInitSubscriptionAuthority(input: {
  owner: TransactionSigner;
  payer?: TransactionSigner;
  mint: Address;
  tokenProgram: Address;
  userAta: Address;
}) {
  return getInitSubscriptionAuthorityOverlayInstructionAsync({
    owner: input.owner,
    ...(input.payer ? { payer: input.payer } : {}),
    tokenMint: input.mint,
    tokenProgram: input.tokenProgram,
    userAta: input.userAta,
  });
}

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
  assertAllowancePolicy({
    maxAtomic: input.maxAtomic,
    expiresAt: input.expiresAt,
  });
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
  if (input.startsAt >= input.expiresAt)
    throw new Error("ALLOWANCE_START_AFTER_EXPIRY");
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

export async function buildTransferFixedAllowance(input: {
  delegationAccount: Address;
  owner: Address;
  ownerAta: Address;
  receiverAta: Address;
  mint: Address;
  tokenProgram: Address;
  delegate: TransactionSigner;
  amountAtomic: bigint;
}) {
  if (input.amountAtomic <= 0n) throw new Error("TRANSFER_AMOUNT_INVALID");
  return getTransferFixedOverlayInstructionAsync({
    delegationPda: input.delegationAccount,
    delegator: input.owner,
    delegatorAta: input.ownerAta,
    receiverAta: input.receiverAta,
    tokenMint: input.mint,
    tokenProgram: input.tokenProgram,
    delegatee: input.delegate,
    amount: input.amountAtomic,
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
    periodHours: THIRTY_DAY_PERIOD_HOURS,
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
    expectedPeriodHours: input.expectedPeriodHours ?? THIRTY_DAY_PERIOD_HOURS,
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
  return (await prepareFixedAllowanceTransaction(input)).transaction;
}

export async function prepareFixedAllowanceTransaction(input: {
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
  const delegationAccount = instruction.accounts?.[2]?.address;
  if (!delegationAccount) throw new Error("DELEGATION_ACCOUNT_NOT_DERIVED");
  return {
    transaction: compileWalletInstruction(owner, instruction, input),
    delegationAccount: String(delegationAccount),
  };
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

export async function buildTransferSubscription(input: {
  caller: TransactionSigner;
  subscriber: Address;
  plan: Address;
  subscription: Address;
  receiverAta: Address;
  mint: Address;
  tokenProgram: Address;
  amountAtomic: bigint;
}) {
  if (input.amountAtomic <= 0n)
    throw new Error("SUBSCRIPTION_TRANSFER_AMOUNT_INVALID");
  return getTransferSubscriptionOverlayInstructionAsync({
    caller: input.caller,
    delegator: input.subscriber,
    planPda: input.plan,
    subscriptionPda: input.subscription,
    receiverAta: input.receiverAta,
    tokenMint: input.mint,
    tokenProgram: input.tokenProgram,
    amount: input.amountAtomic,
  });
}

export async function buildCancelSubscription(input: {
  subscriber: TransactionSigner;
  plan: Address;
  subscription?: Address;
}) {
  return getCancelSubscriptionOverlayInstructionAsync({
    subscriber: input.subscriber,
    planPda: input.plan,
    ...(input.subscription ? { subscriptionPda: input.subscription } : {}),
  });
}

export function buildRevokeAbandonedSubscription(input: {
  payer: TransactionSigner;
  subscription: Address;
  subscriptionAuthority: Address;
  plan: Address;
}) {
  return getRevokeAbandonedSubscriptionInstruction({
    payer: input.payer,
    subscriptionAccount: input.subscription,
    subscriptionAuthority: input.subscriptionAuthority,
    planPda: input.plan,
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
      setTransactionMessageFeePayer(
        feePayer,
        createTransactionMessage({ version: 0 }),
      ),
    ),
  );
  return getTransactionEncoder().encode(compileTransaction(message));
}
