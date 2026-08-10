import { address, generateKeyPairSigner } from "@solana/kit";
import { describe, expect, it } from "vitest";
import { SUBSCRIPTIONS_PROGRAM } from "@usemeterkit/core";
import {
  buildFixedAllowance,
  buildTransferFixedAllowance,
  buildRevokeDelegation,
  prepareFixedAllowanceTransaction,
} from "./index.js";
import {
  buildFixedAuthorizationView,
  deriveFixedAuthorizationAddress,
} from "./authorization.js";

const mint = address("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");
const delegate = address("7NXuBzJ3EQV4CuxpSVELD3t1bs5xZ6ocfGvwjFDbCZUE");

describe("official authorization lifecycle", () => {
  it("derives the same canonical address used by the create instruction", async () => {
    const owner = await generateKeyPairSigner();
    const nonce = 42n;
    const expected = await deriveFixedAuthorizationAddress({
      owner: owner.address,
      mint,
      delegate,
      nonce,
    });
    const prepared = await prepareFixedAllowanceTransaction({
      ownerAddress: owner.address,
      mint,
      delegate,
      maxAtomic: 50_000n,
      expiresAt: new Date(Date.now() + 86_400_000),
      nonce,
      authorityInitId: 1n,
      recentBlockhash: "11111111111111111111111111111111",
      lastValidBlockHeight: 123n,
    });
    expect(prepared.delegationAccount).toBe(expected);
  });

  it("keeps create, inspect and revoke on the official program", async () => {
    const owner = await generateKeyPairSigner();
    const authorizationAddress = await deriveFixedAuthorizationAddress({
      owner: owner.address,
      mint,
      delegate,
      nonce: 7n,
    });
    const create = await buildFixedAllowance({
      owner,
      mint,
      delegate,
      maxAtomic: 50_000n,
      expiresAt: new Date(Date.now() + 86_400_000),
      nonce: 7n,
      authorityInitId: 1n,
    });
    const revoke = buildRevokeDelegation({
      owner,
      delegationAccount: address(authorizationAddress),
    });
    const view = buildFixedAuthorizationView({
      authorizationAddress,
      owner: owner.address,
      delegate,
      assetMint: mint,
      recipientScope: delegate,
      resourceScopes: ["https://api.example.com/premium"],
      perRequestLimitAtomic: 10_000n,
      aggregateLimitAtomic: 50_000n,
      spentAtomic: 10_000n,
      startsAt: new Date("2030-01-01T00:00:00.000Z"),
      expiresAt: new Date("2030-02-01T00:00:00.000Z"),
      observedAt: new Date("2030-01-02T00:00:00.000Z"),
      creationTransaction: "1".repeat(64),
      observedCommitment: "finalized",
    });
    expect(create.programAddress).toBe(SUBSCRIPTIONS_PROGRAM);
    expect(view.program).toBe(SUBSCRIPTIONS_PROGRAM);
    expect(view.authorizationAddress).toBe(authorizationAddress);
    expect(revoke.programAddress).toBe(SUBSCRIPTIONS_PROGRAM);
  });

  it("builds delegated fixed spending on the official program", async () => {
    const delegateSigner = await generateKeyPairSigner();
    const instruction = await buildTransferFixedAllowance({
      delegationAccount: address(
        "Dm9hAwx4oCMscHgMwzWjvYAnfKdCrWYJNDyy7FSxqpok",
      ),
      owner: address("HjZRrfm6G9C7RdzbzQ7u98jp6iQuE4SYgfqkuRHUiQdb"),
      ownerAta: address("8GrzjhuCsA7mj3BjdFkpM1mS9quR1Q7rTxkpSWFd1mbE"),
      receiverAta: address("5LU9mKqXiKUrjFnWthZvkZhVbti1ZNTEpuuZRBQf4SNe"),
      mint,
      tokenProgram: address("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
      delegate: delegateSigner,
      amountAtomic: 10_000n,
    });

    expect(instruction.programAddress).toBe(SUBSCRIPTIONS_PROGRAM);
    expect(
      instruction.accounts.some(
        (account) =>
          account.address === delegateSigner.address && account.role === 2,
      ),
    ).toBe(true);
  });
});
