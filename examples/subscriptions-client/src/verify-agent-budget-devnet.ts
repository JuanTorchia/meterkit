import { createHash } from "node:crypto";
import { chmod, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import {
  address,
  appendTransactionMessageInstructions,
  assertIsTransactionWithBlockhashLifetime,
  createKeyPairSignerFromBytes,
  createSolanaRpc,
  createSolanaRpcSubscriptions,
  createTransactionMessage,
  getSignatureFromTransaction,
  sendAndConfirmTransactionFactory,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  signTransactionMessageWithSigners,
  type Address,
  type Instruction,
  type Signature,
  type TransactionSigner,
} from "@solana/kit";
import {
  fetchFixedDelegation,
  fetchDelegationsByDelegator,
  fetchSubscriptionAuthority,
  findFixedDelegationPda,
  findSubscriptionAuthorityPda,
} from "@solana/subscriptions";
import {
  buildFixedAllowance,
  buildInitSubscriptionAuthority,
  buildRevokeAllForMint,
  buildRevokeDelegation,
  buildTransferFixedAllowance,
} from "@usemeterkit/subscriptions";

const rpcUrl = process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com";
const wsUrl = process.env.SOLANA_WS_URL ?? "wss://api.devnet.solana.com";
const mint = address("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");
const tokenProgram = address("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
const owner = await signerFrom(required("SOLANA_KEYPAIR_PATH"));
const delegate = await signerFrom(required("DELEGATE_KEYPAIR_PATH"));
const rpc = createSolanaRpc(rpcUrl);
const subscriptions = createSolanaRpcSubscriptions(wsUrl);
const sendAndConfirm = sendAndConfirmTransactionFactory({
  rpc,
  rpcSubscriptions: subscriptions,
});
const ownerAta = await findAta(owner.address);
const receiverAta = await findAta(delegate.address);
const [subscriptionAuthority] = await findSubscriptionAuthorityPda({
  user: owner.address,
  tokenMint: mint,
});
const cleanupTransactions: Signature[] = [];
const existingAuthority = await rpc
  .getAccountInfo(subscriptionAuthority, {
    commitment: "confirmed",
    encoding: "base64",
  })
  .send();
if (existingAuthority.value !== null) {
  const staleDelegations = await fetchDelegationsByDelegator(
    rpc,
    owner.address,
  );
  for (const stale of staleDelegations) {
    cleanupTransactions.push(
      await send(
        buildRevokeDelegation({
          owner,
          delegationAccount: stale.address,
        }),
        owner,
      ),
    );
  }
  cleanupTransactions.push(
    await send(
      await buildRevokeAllForMint({
        owner,
        mint,
        tokenProgram,
      }),
      owner,
    ),
  );
}
const nonce = BigInt(Date.now());
const maxAtomic = 15_000n;
const attemptAtomic = 10_000n;
const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1_000);
const [delegationAccount] = await findFixedDelegationPda({
  subscriptionAuthority,
  delegator: owner.address,
  delegatee: delegate.address,
  nonce,
});
const destinationBefore = await tokenBalance(delegate.address);

const init = await send(
  await buildInitSubscriptionAuthority({
    owner,
    mint,
    tokenProgram,
    userAta: ownerAta,
  }),
  owner,
);
const authority = await fetchSubscriptionAuthority(rpc, subscriptionAuthority);
const create = await send(
  await buildFixedAllowance({
    owner,
    mint,
    delegate: delegate.address,
    maxAtomic,
    expiresAt,
    nonce,
    authorityInitId: authority.data.initId,
  }),
  owner,
);
const created = await fetchFixedDelegation(rpc, delegationAccount);
if (created.data.amount !== maxAtomic)
  throw new Error("ALLOWANCE_AMOUNT_MISMATCH");

const transferInstruction = () =>
  buildTransferFixedAllowance({
    delegationAccount,
    owner: owner.address,
    ownerAta,
    receiverAta,
    mint,
    tokenProgram,
    delegate,
    amountAtomic: attemptAtomic,
  });
const concurrent = await Promise.allSettled([
  send(await transferInstruction(), owner, "race-a"),
  send(await transferInstruction(), owner, "race-b"),
]);
const successfulSpend = concurrent.filter(
  (result): result is PromiseFulfilledResult<Signature> =>
    result.status === "fulfilled",
);
const rejectedSpend = concurrent.filter(
  (result) => result.status === "rejected",
);
if (successfulSpend.length !== 1 || rejectedSpend.length !== 1) {
  throw new Error("CONCURRENT_LIMIT_NOT_ENFORCED");
}
const boundedSpendSignature = successfulSpend[0]?.value;
if (!boundedSpendSignature) throw new Error("BOUNDED_SPEND_MISSING");
const destinationAfter = await tokenBalance(delegate.address);
if (destinationAfter - destinationBefore !== attemptAtomic) {
  throw new Error("DESTINATION_BALANCE_MISMATCH");
}

const revoke = await send(
  buildRevokeDelegation({ owner, delegationAccount }),
  owner,
);
const afterRevoke = await rpc
  .getAccountInfo(delegationAccount, {
    commitment: "confirmed",
    encoding: "base64",
  })
  .send();
if (afterRevoke.value !== null) throw new Error("DELEGATION_STILL_EXISTS");
const rejectedAfterRevoke = await send(await transferInstruction(), owner).then(
  () => false,
  () => true,
);
if (!rejectedAfterRevoke) throw new Error("REVOKED_SPEND_ACCEPTED");
const closeAuthority = await send(
  await buildRevokeAllForMint({
    owner,
    mint,
    tokenProgram,
  }),
  owner,
);

const successfulSignatures = [
  ...cleanupTransactions,
  init,
  create,
  boundedSpendSignature,
  revoke,
  closeAuthority,
];
await waitForFinalized(successfulSignatures);
const evidence = {
  checkedAt: new Date().toISOString(),
  factualScope:
    "internal disposable-wallet devnet validation; not a pilot or revenue",
  network: "solana-devnet",
  owner: owner.address,
  delegate: delegate.address,
  mint,
  subscriptionAuthority,
  delegationAccount,
  policy: {
    maxAtomic: String(maxAtomic),
    perAttemptAtomic: String(attemptAtomic),
    expiresAt: expiresAt.toISOString(),
  },
  destinationBalanceBeforeAtomic: String(destinationBefore),
  destinationBalanceAfterAtomic: String(destinationAfter),
  verification: {
    createFinalized: true,
    boundedSpendFinalized: true,
    concurrentAccepted: successfulSpend.length,
    concurrentRejected: rejectedSpend.length,
    aggregateLimitEnforced: true,
    revoked: afterRevoke.value === null,
    postRevokeSpendRejected: rejectedAfterRevoke,
    authorityClosed: true,
  },
  transactions: {
    initAuthority: explorer(init),
    createAllowance: explorer(create),
    boundedSpend: explorer(boundedSpendSignature),
    revokeAllowance: explorer(revoke),
    closeAuthority: explorer(closeAuthority),
  },
  cleanupTransactions: cleanupTransactions.map(explorer),
};
const outputPath = resolve(
  process.env.EVIDENCE_OUTPUT ??
    "artifacts/world-class-evidence/agent-budget-devnet.json",
);
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(evidence, null, 2)}\n`, {
  mode: 0o600,
});
await chmod(outputPath, 0o600);
process.stdout.write(
  `${JSON.stringify(
    {
      checkedAt: evidence.checkedAt,
      network: evidence.network,
      owner: evidence.owner,
      delegate: evidence.delegate,
      delegationAccount: evidence.delegationAccount,
      verification: evidence.verification,
      transactionFingerprints: Object.fromEntries(
        Object.entries(evidence.transactions).map(([key, value]) => [
          key,
          fingerprint(value.signature),
        ]),
      ),
      exactExplorerEvidence: "written to ignored mode-0600 artifact",
    },
    null,
    2,
  )}\n`,
);

async function send(
  instruction: Instruction,
  feePayer: TransactionSigner,
  uniquenessTag?: string,
) {
  const { value: lifetime } = await rpc
    .getLatestBlockhash({ commitment: "confirmed" })
    .send();
  const instructions: Instruction[] = [instruction];
  if (uniquenessTag) {
    instructions.push({
      programAddress: address("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"),
      accounts: [],
      data: new TextEncoder().encode(`meterkit:${uniquenessTag}`),
    });
  }
  const message = appendTransactionMessageInstructions(
    instructions,
    setTransactionMessageLifetimeUsingBlockhash(
      lifetime,
      setTransactionMessageFeePayerSigner(
        feePayer,
        createTransactionMessage({ version: 0 }),
      ),
    ),
  );
  const transaction = await signTransactionMessageWithSigners(message);
  assertIsTransactionWithBlockhashLifetime(transaction);
  await sendAndConfirm(transaction, { commitment: "confirmed" });
  return getSignatureFromTransaction(transaction);
}

async function signerFrom(path: string) {
  const parsed: unknown = JSON.parse(await readFile(path, "utf8"));
  if (
    !Array.isArray(parsed) ||
    parsed.length !== 64 ||
    !parsed.every(
      (value) => Number.isInteger(value) && value >= 0 && value <= 255,
    )
  ) {
    throw new Error("KEYPAIR_PATH_INVALID");
  }
  return createKeyPairSignerFromBytes(Uint8Array.from(parsed as number[]));
}

async function findAta(wallet: Address) {
  const result = await rpc
    .getTokenAccountsByOwner(
      wallet,
      { mint },
      { commitment: "confirmed", encoding: "jsonParsed" },
    )
    .send();
  const account = result.value.find((candidate) => {
    const data = candidate.account.data;
    return typeof data === "object" && "parsed" in data;
  });
  if (!account) throw new Error(`USDC_ATA_NOT_FOUND:${wallet}`);
  return account.pubkey;
}

async function tokenBalance(wallet: Address) {
  const result = await rpc
    .getTokenAccountsByOwner(
      wallet,
      { mint },
      { commitment: "confirmed", encoding: "jsonParsed" },
    )
    .send();
  return result.value.reduce((sum, candidate) => {
    const data = candidate.account.data;
    if (typeof data !== "object" || !("parsed" in data)) return sum;
    const parsed = data.parsed as {
      info?: { tokenAmount?: { amount?: string } };
    };
    return sum + BigInt(parsed.info?.tokenAmount?.amount ?? "0");
  }, 0n);
}

async function waitForFinalized(signatures: readonly Signature[]) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const result = await rpc
      .getSignatureStatuses(signatures, { searchTransactionHistory: true })
      .send();
    if (
      result.value.every(
        (status) =>
          status?.confirmationStatus === "finalized" && status.err === null,
      )
    )
      return;
    await new Promise((resolve) => setTimeout(resolve, 2_000));
  }
  throw new Error("TRANSACTIONS_NOT_FINALIZED");
}

function explorer(signature: Signature) {
  return {
    signature,
    url: `https://explorer.solana.com/tx/${signature}?cluster=devnet`,
  };
}

function fingerprint(signature: Signature) {
  return `sha256:${createHash("sha256").update(signature).digest("hex").slice(0, 16)}`;
}

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}
