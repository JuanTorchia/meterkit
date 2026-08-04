import { readFile } from "node:fs/promises";
import {
  address,
  appendTransactionMessageInstruction,
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
} from "@solana/kit";
import {
  fetchPlan,
  fetchSubscriptionAuthority,
  fetchSubscriptionDelegation,
  fetchSubscriptionsForUser,
  findPlanPda,
  findSubscriptionAuthorityPda,
  findSubscriptionDelegationPda,
} from "@solana/subscriptions";
import {
  buildCancelSubscription,
  buildInitSubscriptionAuthority,
  buildMonthlyPlan,
  buildRevokeAllForMint,
  buildRevokeAbandonedSubscription,
  buildSubscribe,
  buildTransferSubscription,
  THIRTY_DAY_PERIOD_HOURS,
} from "@meterkit/subscriptions";

const rpcUrl = process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com";
const wsUrl = process.env.SOLANA_WS_URL ?? "wss://api.devnet.solana.com";
const mint = address("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");
const tokenProgram = address("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
const destinationOwner = address(required("DESTINATION_WALLET"));
const signer = await createKeyPairSignerFromBytes(await readKeypair());
const rpc = createSolanaRpc(rpcUrl);
const rpcSubscriptions = createSolanaRpcSubscriptions(wsUrl);
const sendAndConfirm = sendAndConfirmTransactionFactory({ rpc, rpcSubscriptions });
const amountAtomic = 10_000n;
const planId = BigInt(Date.now());

const subscriberAta = await findAta(signer.address);
const destinationAta = await findAta(destinationOwner);
const [subscriptionAuthority] = await findSubscriptionAuthorityPda({
  user: signer.address,
  tokenMint: mint,
});
const cleanupTransactions: Signature[] = [];
const staleSubscriptions = await fetchSubscriptionsForUser(rpc, signer.address);
const existingAuthority = await rpc.getAccountInfo(subscriptionAuthority, {
  commitment: "confirmed",
  encoding: "base64",
}).send();
if (existingAuthority.value !== null) {
  cleanupTransactions.push(await send(await buildRevokeAllForMint({
    owner: signer,
    mint,
    tokenProgram,
  })));
}
for (const stale of staleSubscriptions) {
  cleanupTransactions.push(await send(buildRevokeAbandonedSubscription({
    payer: signer,
    plan: stale.data.header.delegatee,
    subscription: stale.address,
    subscriptionAuthority,
  })));
}
const destinationBefore = await tokenBalance(destinationOwner);
const [plan] = await findPlanPda({ owner: signer.address, planId });
const [subscription] = await findSubscriptionDelegationPda({
  planPda: plan,
  subscriber: signer.address,
});

const initAuthority = await send(await buildInitSubscriptionAuthority({
  owner: signer,
  mint,
  tokenProgram,
  userAta: subscriberAta,
}));
const authority = await fetchSubscriptionAuthority(rpc, subscriptionAuthority);

const createPlan = await send(await buildMonthlyPlan({
  merchant: signer,
  mint,
  amountAtomic,
  destination: destinationOwner,
  planId,
  metadataUri: "https://meterkit.juanchi.dev/plans/devnet-30-day.json",
  pullers: [signer.address],
}));
const createdPlan = await fetchPlan(rpc, plan);
if (createdPlan.data.data.terms.amount !== amountAtomic ||
    createdPlan.data.data.terms.periodHours !== THIRTY_DAY_PERIOD_HOURS ||
    createdPlan.data.data.mint !== mint) {
  throw new Error("PLAN_FIELDS_MISMATCH");
}

const subscribe = await send(await buildSubscribe({
  subscriber: signer,
  merchant: signer.address,
  mint,
  planId,
  expectedAmountAtomic: amountAtomic,
  expectedPeriodHours: THIRTY_DAY_PERIOD_HOURS,
  expectedCreatedAt: createdPlan.data.data.terms.createdAt,
  authorityInitId: authority.data.initId,
}));
const subscribed = await fetchSubscriptionDelegation(rpc, subscription);
if (subscribed.data.header.delegator !== signer.address ||
    subscribed.data.terms.amount !== amountAtomic) {
  throw new Error("SUBSCRIPTION_FIELDS_MISMATCH");
}

const pull = await send(await buildTransferSubscription({
  caller: signer,
  subscriber: signer.address,
  plan,
  subscription,
  receiverAta: destinationAta,
  mint,
  tokenProgram,
  amountAtomic,
}));
const afterPull = await fetchSubscriptionDelegation(rpc, subscription);
if (afterPull.data.amountPulledInPeriod !== amountAtomic) {
  throw new Error("SUBSCRIPTION_PULL_NOT_RECORDED");
}
const destinationAfter = await tokenBalance(destinationOwner);
if (destinationAfter - destinationBefore !== amountAtomic) {
  throw new Error("SUBSCRIPTION_DESTINATION_BALANCE_MISMATCH");
}

const cancel = await send(await buildCancelSubscription({
  subscriber: signer,
  plan,
  subscription,
}));
const cancelled = await fetchSubscriptionDelegation(rpc, subscription);
if (cancelled.data.expiresAtTs === 0n) throw new Error("SUBSCRIPTION_NOT_CANCELLED");

const closeAuthority = await send(await buildRevokeAllForMint({
  owner: signer,
  mint,
  tokenProgram,
}));
const revoke = await send(buildRevokeAbandonedSubscription({
  payer: signer,
  plan,
  subscription,
  subscriptionAuthority,
}));
const accountAfterRevoke = await rpc.getAccountInfo(subscription, {
  commitment: "confirmed",
  encoding: "base64",
}).send();
if (accountAfterRevoke.value !== null) throw new Error("SUBSCRIPTION_STILL_EXISTS");

const transactions = {
  initAuthority,
  createPlan,
  subscribe,
  pull,
  cancel,
  closeAuthority,
  revoke,
};
await waitForFinalized([
  ...cleanupTransactions,
  ...Object.values(transactions),
]);

process.stdout.write(`${JSON.stringify({
  checkedAt: new Date().toISOString(),
  network: "solana-devnet",
  merchantAndSubscriber: signer.address,
  destinationOwner,
  mint,
  plan,
  subscriptionAuthority,
  subscription,
  terms: {
    amountAtomic: String(amountAtomic),
    periodHours: String(THIRTY_DAY_PERIOD_HOURS),
    periodMeaning: "fixed 30-day period; not calendar-month billing",
    planId: String(planId),
    createdAt: String(createdPlan.data.data.terms.createdAt),
  },
  destinationBalanceBeforeAtomic: String(destinationBefore),
  destinationBalanceAfterAtomic: String(destinationAfter),
  amountPulledInPeriod: String(afterPull.data.amountPulledInPeriod),
  cancelledExpiresAtTs: String(cancelled.data.expiresAtTs),
  revoked: accountAfterRevoke.value === null,
  transactions: Object.fromEntries(
    Object.entries(transactions).map(([key, signature]) => [key, explorer(signature)]),
  ),
  cleanupTransactions: cleanupTransactions.map(explorer),
}, null, 2)}\n`);

async function send(instruction: Instruction) {
  const { value: lifetime } = await rpc.getLatestBlockhash({ commitment: "confirmed" }).send();
  const message = appendTransactionMessageInstruction(
    instruction,
    setTransactionMessageLifetimeUsingBlockhash(
      lifetime,
      setTransactionMessageFeePayerSigner(signer, createTransactionMessage({ version: 0 })),
    ),
  );
  const transaction = await signTransactionMessageWithSigners(message);
  assertIsTransactionWithBlockhashLifetime(transaction);
  await sendAndConfirm(transaction, { commitment: "confirmed" });
  return getSignatureFromTransaction(transaction);
}

async function findAta(owner: Address) {
  const result = await rpc.getTokenAccountsByOwner(
    owner,
    { mint },
    { commitment: "confirmed", encoding: "jsonParsed" },
  ).send();
  const account = result.value.find((candidate) => {
    const data = candidate.account.data;
    return typeof data === "object" && "parsed" in data;
  });
  if (!account) throw new Error(`USDC_ATA_NOT_FOUND:${owner}`);
  return account.pubkey;
}

async function tokenBalance(owner: Address) {
  const result = await rpc.getTokenAccountsByOwner(
    owner,
    { mint },
    { commitment: "confirmed", encoding: "jsonParsed" },
  ).send();
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
    const result = await rpc.getSignatureStatuses(signatures, {
      searchTransactionHistory: true,
    }).send();
    if (result.value.every((status) =>
      status?.confirmationStatus === "finalized" && status.err === null)) return;
    await new Promise((resolve) => setTimeout(resolve, 2_000));
  }
  throw new Error("TRANSACTIONS_NOT_FINALIZED");
}

async function readKeypair() {
  const parsed: unknown = JSON.parse(await readFile(required("SOLANA_KEYPAIR_PATH"), "utf8"));
  if (!Array.isArray(parsed) || parsed.length !== 64 ||
      !parsed.every((item) => Number.isInteger(item) && item >= 0 && item <= 255)) {
    throw new Error("SOLANA_KEYPAIR_PATH must contain a 64-byte keypair");
  }
  return Uint8Array.from(parsed as number[]);
}

function explorer(signature: string) {
  return {
    signature,
    url: `https://explorer.solana.com/tx/${signature}?cluster=devnet`,
  };
}

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}
