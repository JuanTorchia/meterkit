import { describe, expect, it } from "vitest";
import {
  assertAllowancePolicy,
  buildFixedAllowance,
  buildFixedAllowanceTransaction,
  buildMonthlyPlan,
  buildInitSubscriptionAuthority,
  buildMonthlyPlanTransaction,
  buildRecurringAllowance,
  buildRecurringAllowanceTransaction,
  buildRevokeAllForMint,
  buildRevokeDelegation,
  buildRevokeDelegationTransaction,
  buildRevokeSubscription,
  buildSubscribe,
  buildSubscribeTransaction,
  buildTransferSubscription,
  buildCancelSubscription,
  THIRTY_DAY_PERIOD_HOURS,
  subscriptionsIntegration,
} from "./index.js";
import { address, generateKeyPairSigner } from "@solana/kit";

describe("allowance policy", () => {
  it("requires a positive cap and future expiry", () => {
    const future = new Date(Date.now() + 86_400_000);
    expect(assertAllowancePolicy({ maxAtomic: 1_000_000n, expiresAt: future }).maxAtomic).toBe(1_000_000n);
    expect(() => assertAllowancePolicy({ maxAtomic: 0n, expiresAt: future })).toThrow("ALLOWANCE_AMOUNT_INVALID");
    expect(() => assertAllowancePolicy({ maxAtomic: 1n, expiresAt: new Date("2020-01-01") })).toThrow("ALLOWANCE_EXPIRED");
  });

  it("rejects overly broad agent allowances by default", () => {
    const now = new Date("2030-01-01T00:00:00Z");
    expect(() => assertAllowancePolicy({
      maxAtomic: 100_000_001n,
      expiresAt: new Date("2030-01-02T00:00:00Z"),
    }, now)).toThrow("ALLOWANCE_AMOUNT_EXCEEDS_POLICY");
    expect(() => assertAllowancePolicy({
      maxAtomic: 1_000_000n,
      expiresAt: new Date("2030-04-02T00:00:00Z"),
    }, now)).toThrow("ALLOWANCE_DURATION_EXCEEDS_POLICY");
    expect(() => assertAllowancePolicy({
      maxAtomic: 1_000_000n,
      expiresAt: new Date("2030-01-02T00:00:00Z"),
      periodSeconds: 30n,
    }, now)).toThrow("ALLOWANCE_PERIOD_INVALID");
  });

  it("exposes explicit upstream revoke instructions", () => {
    expect(subscriptionsIntegration.revokeMethods).toHaveLength(3);
  });

  it("builds canonical fixed allowance and monthly plan instructions", async () => {
    const signer = await generateKeyPairSigner();
    const delegate = address("7NXuBzJ3EQV4CuxpSVELD3t1bs5xZ6ocfGvwjFDbCZUE");
    const mint = address("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");
    const allowance = await buildFixedAllowance({
      owner: signer, mint, delegate, maxAtomic: 1_000_000n,
      expiresAt: new Date(Date.now() + 86_400_000), nonce: 1n, authorityInitId: 1n,
    });
    expect(allowance.programAddress).toBe(subscriptionsIntegration.programId);
    const plan = await buildMonthlyPlan({
      merchant: signer, mint, destination: signer.address, amountAtomic: 10_000_000n,
      planId: 1n, metadataUri: "https://meterkit.dev/plans/pro.json",
    });
    expect(plan.programAddress).toBe(subscriptionsIntegration.programId);
  });

  it("builds the canonical subscription authority initialization", async () => {
    const signer = await generateKeyPairSigner();
    const instruction = await buildInitSubscriptionAuthority({
      owner: signer,
      mint: address("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"),
      tokenProgram: address("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
      userAta: address("7NXuBzJ3EQV4CuxpSVELD3t1bs5xZ6ocfGvwjFDbCZUE"),
    });
    expect(instruction.programAddress).toBe(subscriptionsIntegration.programId);
  });

  it("builds recurring, subscribe, and every explicit revocation instruction", async () => {
    const signer = await generateKeyPairSigner();
    const merchant = address("7NXuBzJ3EQV4CuxpSVELD3t1bs5xZ6ocfGvwjFDbCZUE");
    const mint = address("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");
    const recurring = await buildRecurringAllowance({
      owner: signer,
      mint,
      delegate: merchant,
      maxPerPeriodAtomic: 10_000_000n,
      periodSeconds: 2_592_000n,
      startsAt: new Date(Date.now() - 1_000),
      expiresAt: new Date(Date.now() + 30 * 86_400_000),
      nonce: 2n,
      authorityInitId: 1n,
    });
    expect(recurring.programAddress).toBe(subscriptionsIntegration.programId);

    const subscribe = await buildSubscribe({
      subscriber: signer, merchant, mint, planId: 1n,
      expectedAmountAtomic: 10_000_000n, expectedCreatedAt: 1n, authorityInitId: 1n,
    });
    expect(subscribe.programAddress).toBe(subscriptionsIntegration.programId);

    const delegation = buildRevokeDelegation({
      owner: signer,
      delegationAccount: merchant,
    });
    const subscription = buildRevokeSubscription({
      owner: signer,
      plan: merchant,
      subscription: signer.address,
    });
    const all = await buildRevokeAllForMint({
      owner: signer,
      mint,
      tokenProgram: address("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"),
    });
    expect([delegation, subscription, all].every(
      (instruction) => instruction.programAddress === subscriptionsIntegration.programId,
    )).toBe(true);
  });

  it("builds the native 30-day pull and cancellation instructions", async () => {
    const signer = await generateKeyPairSigner();
    const subscriber = address("7NXuBzJ3EQV4CuxpSVELD3t1bs5xZ6ocfGvwjFDbCZUE");
    const plan = address("8NXuBzJ3EQV4CuxpSVELD3t1bs5xZ6ocfGvwjFDbCZUF");
    const subscription = address("9NXuBzJ3EQV4CuxpSVELD3t1bs5xZ6ocfGvwjFDbCZUG");
    const mint = address("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");
    const transfer = await buildTransferSubscription({
      caller: signer,
      subscriber,
      plan,
      subscription,
      receiverAta: signer.address,
      mint,
      tokenProgram: address("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
      amountAtomic: 10_000_000n,
    });
    const cancel = await buildCancelSubscription({
      subscriber: signer,
      plan,
      subscription,
    });
    expect(THIRTY_DAY_PERIOD_HOURS).toBe(720n);
    expect([transfer, cancel].every(
      (instruction) => instruction.programAddress === subscriptionsIntegration.programId,
    )).toBe(true);
  });

  it("serializes a revocation for Wallet Standard without a private key", async () => {
    const signer = await generateKeyPairSigner();
    const transaction = buildRevokeDelegationTransaction({
      ownerAddress: signer.address,
      delegationAccount: "7NXuBzJ3EQV4CuxpSVELD3t1bs5xZ6ocfGvwjFDbCZUE",
      recentBlockhash: "11111111111111111111111111111111",
      lastValidBlockHeight: 123n,
    });
    expect(transaction).toBeInstanceOf(Uint8Array);
    expect(transaction.byteLength).toBeGreaterThan(100);
  });

  it("serializes fixed, recurring, plan and subscribe transactions for wallets", async () => {
    const signer = await generateKeyPairSigner();
    const merchant = "7NXuBzJ3EQV4CuxpSVELD3t1bs5xZ6ocfGvwjFDbCZUE";
    const mint = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
    const lifetime = {
      recentBlockhash: "11111111111111111111111111111111",
      lastValidBlockHeight: 123n,
    };
    const commonAllowance = {
      ownerAddress: signer.address,
      mint,
      delegate: merchant,
      expiresAt: new Date(Date.now() + 86_400_000),
      nonce: 1n,
      authorityInitId: 1n,
      ...lifetime,
    };
    const transactions = await Promise.all([
      buildFixedAllowanceTransaction({ ...commonAllowance, maxAtomic: 1_000_000n }),
      buildRecurringAllowanceTransaction({
        ...commonAllowance,
        maxPerPeriodAtomic: 1_000_000n,
        periodSeconds: 86_400n,
        startsAt: new Date(),
      }),
      buildMonthlyPlanTransaction({
        merchantAddress: signer.address,
        mint,
        destination: signer.address,
        amountAtomic: 10_000_000n,
        planId: 1n,
        metadataUri: "https://meterkit.dev/plan.json",
        ...lifetime,
      }),
      buildSubscribeTransaction({
        subscriberAddress: signer.address,
        merchant,
        mint,
        planId: 1n,
        expectedAmountAtomic: 10_000_000n,
        expectedCreatedAt: 1n,
        authorityInitId: 1n,
        ...lifetime,
      }),
    ]);
    expect(transactions.every((transaction) => transaction.byteLength > 100)).toBe(true);
  });
});
